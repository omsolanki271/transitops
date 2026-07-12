import React, { useState, useEffect } from 'react';
import { getTrips } from '../../../api/trips';
import { getVehicles } from '../../../api/vehicles';
import { getExpenses, getFuelLogs } from '../../../api/expenses';
import { getReportsExportUrl } from '../../../api/reports';
import { isMockMode } from '../../../api/client';
import { Download, BarChart2, TrendingUp, ShieldAlert, Award, Compass } from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  LineChart, 
  Line 
} from 'recharts';

export const Reports = () => {
  const [completedTrips, setCompletedTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [roiReport, setRoiReport] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsRes, vehiclesRes, fuelRes, expensesRes] = await Promise.all([
        getTrips(),
        getVehicles(),
        getFuelLogs(),
        getExpenses()
      ]);

      // 1. Filter completed trips to calculate fuel efficiency
      const completed = tripsRes.data.filter(t => t.status === 'completed');
      setCompletedTrips(completed);

      // 2. Calculate ROI report for each vehicle
      // ROI: (Revenue - (Maintenance + Fuel)) / Acquisition Cost * 100
      const calculatedRoi = vehiclesRes.data.map(v => {
        const vFuel = fuelRes.data.filter(f => f.vehicle_id === v.id).reduce((sum, f) => sum + f.cost, 0);
        const vExpenses = expensesRes.data.filter(e => e.vehicle_id === v.id).reduce((sum, e) => sum + e.amount, 0);
        const vRevenue = tripsRes.data.filter(t => t.vehicle_id === v.id && t.status === 'completed').reduce((sum, t) => sum + (t.revenue || 0), 0);
        
        const returnVal = vRevenue - (vFuel + vExpenses);
        const roi = v.acquisition_cost > 0 
          ? parseFloat(((returnVal / v.acquisition_cost) * 100).toFixed(2)) 
          : 0;

        return {
          id: v.id,
          name: v.name_model,
          reg: v.registration_number,
          revenue: vRevenue,
          costs: vFuel + vExpenses,
          costVal: v.acquisition_cost,
          roi: roi
        };
      });
      setRoiReport(calculatedRoi);
      setVehicles(vehiclesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleExportCSV = (reportType) => {
    if (isMockMode()) {
      // Mock client-side CSV download
      let csvContent = '';
      let filename = `${reportType}_report.csv`;

      if (reportType === 'fuel_efficiency') {
        csvContent = 'Trip ID,Vehicle,Route,Distance (km),Fuel (Liters),Efficiency (km/L)\n';
        completedTrips.forEach(t => {
          const efficiency = t.fuel_consumed > 0 ? (t.actual_distance / t.fuel_consumed).toFixed(2) : 0;
          csvContent += `${t.id},${t.vehicle_detail?.registration_number},${t.source} to ${t.destination},${t.actual_distance},${t.fuel_consumed},${efficiency}\n`;
        });
      } else if (reportType === 'roi') {
        csvContent = 'Vehicle,Reg Number,Revenue,Operational Costs,Acquisition Cost,ROI (%)\n';
        roiReport.forEach(v => {
          csvContent += `${v.name},${v.reg},${v.revenue},${v.costs},${v.costVal},${v.roi}%\n`;
        });
      } else {
        csvContent = 'Report Type,Export Date,Status\nMock Export,2026-07-12,Success\n';
      }

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Live server redirect
      window.open(getReportsExportUrl(reportType), '_blank');
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  // Recharts Efficiency chart data
  const chartEfficiencyData = completedTrips.map(t => ({
    name: `Trip #${t.id}`,
    efficiency: t.fuel_consumed > 0 ? parseFloat((t.actual_distance / t.fuel_consumed).toFixed(2)) : 0
  }));

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Reports & Analytics</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">View efficiency metrics, ROI calculations, and export csv datasets</p>
      </div>

      {loading ? (
        <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Generating analytics dashboard...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* FUEL EFFICIENCY REPORT */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4.5 w-4.5 text-primary" />
                <span>Fuel Efficiency Report</span>
              </h3>
              <button
                onClick={() => handleExportCSV('fuel_efficiency')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-on-surface cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* Efficiency Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartEfficiencyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} label={{ value: 'km/L', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="efficiency" stroke="#0058be" strokeWidth={2.5} name="Efficiency (km/L)" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Completed trips table */}
            <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-semibold text-on-surface">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Trip</th>
                    <th className="px-4 py-2.5">Vehicle</th>
                    <th className="px-4 py-2.5 text-right">Distance</th>
                    <th className="px-4 py-2.5 text-right">Fuel Log</th>
                    <th className="px-4 py-2.5 text-right">Efficiency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {completedTrips.map(t => {
                    const eff = t.fuel_consumed > 0 ? (t.actual_distance / t.fuel_consumed).toFixed(2) : 0;
                    return (
                      <tr key={t.id} className="hover:bg-gray-50/50">
                        <td className="px-4 py-2.5">#{t.id} ({t.source.split(' ')[0]} ➔ {t.destination.split(' ')[0]})</td>
                        <td className="px-4 py-2.5 font-mono text-primary">{t.vehicle_detail?.registration_number}</td>
                        <td className="px-4 py-2.5 text-right">{t.actual_distance} km</td>
                        <td className="px-4 py-2.5 text-right">{t.fuel_consumed} L</td>
                        <td className="px-4 py-2.5 text-right font-bold text-green-700">{eff} km/L</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* VEHICLE ROI ANALYTICS */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="h-4.5 w-4.5 text-primary" />
                <span>Vehicle ROI Analytics</span>
              </h3>
              <button
                onClick={() => handleExportCSV('roi')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-on-surface cursor-pointer transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            </div>

            {/* ROI Chart */}
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={roiReport.filter(r => r.roi > 0)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} label={{ value: 'ROI %', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                  <Tooltip />
                  <Bar dataKey="roi" fill="#006b5f" radius={[4, 4, 0, 0]} name="ROI Ratio %" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ROI Details Table */}
            <div className="overflow-x-auto max-h-[220px] overflow-y-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-semibold text-on-surface">
                <thead className="bg-gray-50 text-[10px] uppercase font-bold text-on-surface-variant sticky top-0">
                  <tr>
                    <th className="px-4 py-2.5">Vehicle</th>
                    <th className="px-4 py-2.5 text-right">Revenue</th>
                    <th className="px-4 py-2.5 text-right">Op Cost</th>
                    <th className="px-4 py-2.5 text-right">Acquisition</th>
                    <th className="px-4 py-2.5 text-right">ROI (%)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {roiReport.map(r => (
                    <tr key={r.id} className="hover:bg-gray-50/50">
                      <td className="px-4 py-2.5">
                        <div className="font-bold">{r.name}</div>
                        <div className="text-[10px] font-mono font-bold text-primary">{r.reg}</div>
                      </td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(r.revenue)}</td>
                      <td className="px-4 py-2.5 text-right">{formatCurrency(r.costs)}</td>
                      <td className="px-4 py-2.5 text-right text-on-surface-variant">{formatCurrency(r.costVal)}</td>
                      <td className={`px-4 py-2.5 text-right font-bold ${r.roi > 0 ? 'text-primary' : 'text-on-surface-variant'}`}>
                        {r.roi}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* COMPLIANCE & SAFETY INSIGHTS */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 lg:col-span-2 select-none">
            <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <Award className="h-4.5 w-4.5 text-primary" />
              <span>Fleet Health & Compliance Audit</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Compliance card */}
              <div className="border border-gray-150 rounded-xl p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">License Compliance</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-on-surface">
                    {vehicles.filter(v => v.status !== 'retired').length}
                  </span>
                  <span className="text-xs text-on-surface-variant font-semibold">Active Fleet Vehicles</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-normal">
                  All active drivers are audited daily against expiring vehicle logistics certificates.
                </p>
              </div>

              {/* Maintenance Schedule */}
              <div className="border border-gray-150 rounded-xl p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Active Operations</h4>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-on-surface">
                    {completedTrips.length}
                  </span>
                  <span className="text-xs text-on-surface-variant font-semibold">Trips completed successfully</span>
                </div>
                <p className="text-xs text-on-surface-variant leading-normal">
                  Trip completion audits capture fuel efficiency indices and update odometer logs automatically.
                </p>
              </div>

              {/* Safety audits */}
              <div className="border border-gray-150 rounded-xl p-4 space-y-2">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Compliance Alert Level</h4>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-green-500/10 text-green-700 border border-green-500/20">
                    Optimum / Safe
                  </span>
                </div>
                <p className="text-xs text-on-surface-variant leading-normal">
                  Operational risk scoring blocks drivers with expired licenses from dispatch actions.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Reports;
