import React, { useState, useEffect } from 'react';
import { getTrips } from '../../../api/trips';
import { getVehicles } from '../../../api/vehicles';
import { getExpenses, getFuelLogs } from '../../../api/expenses';
import {
  getReportsExportUrl,
  getSafetyReportData,
  downloadSafetyCSV,
  downloadSafetyPDF,
  getMaintenanceReportData,
  downloadMaintenanceCSV,
  downloadMaintenancePDF
} from '../../../api/reports';
import { isMockMode } from '../../../api/client';
import {
  Download,
  BarChart2,
  TrendingUp,
  ShieldAlert,
  Award,
  Compass,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Wrench,
  Clock,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { canPerformAction } from '../../../rbac/permissions';
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
  const { user } = useAuth();
  const isSafetyOfficer = user?.role === 'safety_officer';
  const canExportReports = canPerformAction(user?.role, 'reports', 'exportCsv');


  // Original Financial dashboard states
  const [completedTrips, setCompletedTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [roiReport, setRoiReport] = useState([]);


  // Safety Officer dashboard states
  const [safetyData, setSafetyData] = useState(null);

  // Maintenance dashboard states (Fleet Manager)
  const [maintData, setMaintData] = useState(null);
  const [activeTab, setActiveTab] = useState('operational'); // 'operational' or 'maintenance'


  const [loading, setLoading] = useState(true);


  const fetchData = async () => {
    setLoading(true);
    try {
      if (isSafetyOfficer) {
        // Fetch only safety reports data
        const res = await getSafetyReportData();
        setSafetyData(res.data);
      } else {
        // Fetch original financial reports data
        const promises = [
          getTrips(),
          getVehicles(),
          getFuelLogs(),
          getExpenses()
        ];
        
        if (user?.role === 'fleet_manager') {
          promises.push(getMaintenanceReportData());
        }

        const results = await Promise.all(promises);
        const [tripsRes, vehiclesRes, fuelRes, expensesRes, maintRes] = results;

        const completed = tripsRes.data.filter(t => t.status === 'completed');
        setCompletedTrips(completed);


        const getVehicleId = (item) => {
          if (!item) return null;
          if (item.vehicle_id) return item.vehicle_id;
          if (item.vehicle) {
            return typeof item.vehicle === 'object' ? item.vehicle.id : item.vehicle;
          }
          return null;
        };


        const calculatedRoi = vehiclesRes.data.map(v => {
          const vFuel = fuelRes.data.filter(f => getVehicleId(f) === v.id).reduce((sum, f) => sum + parseFloat(f.cost || 0), 0);
          const vExpenses = expensesRes.data.filter(e => getVehicleId(e) === v.id).reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
          const vRevenue = tripsRes.data.filter(t => getVehicleId(t) === v.id && t.status === 'completed').reduce((sum, t) => sum + parseFloat(t.revenue || 0), 0);

          const acquisitionCost = parseFloat(v.acquisition_cost) || 0;
          const returnVal = vRevenue - (vFuel + vExpenses);
          const roi = acquisitionCost > 0
            ? parseFloat(((returnVal / acquisitionCost) * 100).toFixed(2))
            : 0;


          return {
            id: v.id,
            name: v.name_model,
            reg: v.registration_number,
            revenue: vRevenue,
            costs: vFuel + vExpenses,
            costVal: acquisitionCost,
            roi: roi
          };
        });
        setRoiReport(calculatedRoi);
        setVehicles(vehiclesRes.data);

        if (maintRes) {
          setMaintData(maintRes.data);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchData();
  }, [user]);


  const handleExportCSV = (reportType) => {
    if (isMockMode()) {
      let csvContent = '';
      let filename = `${reportType}_report.csv`;


      if (reportType === 'fuel_efficiency') {
        csvContent = 'Trip ID,Vehicle,Route,Distance (km),Fuel (Liters),Efficiency (km/L)\n';
        completedTrips.forEach(t => {
          const efficiency = t.fuel_consumed > 0 ? (t.actual_distance / t.fuel_consumed).toFixed(2) : 0;
          const vehicle = t.vehicle_detail || t.vehicle;
          csvContent += `${t.id},${vehicle?.registration_number || 'N/A'},${t.source} to ${t.destination},${t.actual_distance},${t.fuel_consumed},${efficiency}\n`;
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
      window.open(getReportsExportUrl(reportType), '_blank');
    }
  };


  const handleSafetyCSVExport = async () => {
    try {
      await downloadSafetyCSV();
    } catch (err) {
      console.error(err);
    }
  };


  const handleSafetyPDFExport = async () => {
    try {
      await downloadSafetyPDF();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaintenanceCSVExport = async () => {
    try {
      await downloadMaintenanceCSV();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMaintenancePDFExport = async () => {
    try {
      await downloadMaintenancePDF();
    } catch (err) {
      console.error(err);
    }
  };


  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };


  const formatDate = (dateStr) => {
    if (!dateStr) return 'Ongoing';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };


  // Render Safety Officer Dashboard
  if (isSafetyOfficer) {
    const stats = safetyData?.compliance_stats || {
      total_drivers: 0,
      compliant_drivers: 0,
      suspended_drivers: 0,
      expired_licenses: 0,
      average_safety_score: 0
    };


    const safetyScoreData = (safetyData?.drivers_safety_scores || []).map(d => ({
      ...d,
      displayName: d.name.length > 12 ? d.name.slice(0, 10) + '..' : d.name
    }));
    const licenseReportData = safetyData?.license_expiry_report || [];
    const suspendedDriversData = safetyData?.suspended_drivers || [];
    const safetyTrendData = safetyData?.safety_trend || [];


    // Calculate compliance percent
    const compliancePercent = stats.total_drivers > 0
      ? Math.round((stats.compliant_drivers / stats.total_drivers) * 100)
      : 100;


    return (
      <div className="space-y-6 select-none">
        {/* Header with Exports */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div>
            <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Safety & Compliance Reports</h2>
            <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">
              Monitor driver safety performance logs, licensing audits, and compliance trends
            </p>
          </div>
          {canExportReports && (
            <div className="flex gap-2.5">
              <button
                onClick={handleSafetyCSVExport}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold rounded-xl text-on-surface shadow-sm cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Download className="h-4.5 w-4.5 text-primary" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={handleSafetyPDFExport}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Download className="h-4.5 w-4.5" />
                <span>Export PDF</span>
              </button>
            </div>
          )}
        </div>


        {loading ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">
            Compiling driver safety audit...
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Compliance Level</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${compliancePercent >= 85 ? 'text-green-600' : 'text-amber-500'}`}>{compliancePercent}%</span>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Compliance threshold target is 90%</p>
              </div>


              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Average Safety Score</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-on-surface">{stats.average_safety_score}/100</span>
                  <Award className="h-5 w-5 text-primary" />
                </div>
                <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Fleet-wide driving score average</p>
              </div>


              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Drivers</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black text-on-surface">{stats.total_drivers}</span>
                  <Users className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Active driver profile registers</p>
              </div>


              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Suspended Drivers</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${stats.suspended_drivers > 0 ? 'text-error font-bold' : 'text-on-surface'}`}>{stats.suspended_drivers}</span>
                  <XCircle className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Suspended for safety audits</p>
              </div>


              <div className="bg-white p-6 rounded-xl border border-gray-150 shadow-sm space-y-2">
                <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Expired Licenses</span>
                <div className="flex items-baseline justify-between">
                  <span className={`text-2xl font-black ${stats.expired_licenses > 0 ? 'text-error font-bold' : 'text-on-surface'}`}>{stats.expired_licenses}</span>
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                </div>
                <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Licenses needing urgent renewal</p>
              </div>
            </div>


            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Driver Safety Scores Bar Chart */}
              <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart2 className="h-4.5 w-4.5 text-primary" />
                  <span>Driver Safety Scores</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={safetyScoreData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="displayName" interval={0} stroke="#6B7280" fontSize={11} tickLine={false} />
                      <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={11} tickLine={false} label={{ value: 'Score / 100', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                      <Tooltip />
                      <Bar dataKey="safety_score" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Safety Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>


              {/* Safety Trend Line Chart */}
              <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingUp className="h-4.5 w-4.5 text-primary" />
                  <span>Safety Trend</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={safetyTrendData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                      <YAxis domain={[70, 100]} stroke="#6B7280" fontSize={11} tickLine={false} label={{ value: 'Avg Score', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#6B7280', fontSize: 10 } }} />
                      <Tooltip />
                      <Line type="monotone" dataKey="score" stroke="#22C55E" strokeWidth={2.5} name="Average Safety Index" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>


            {/* Lists/Tables Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Compliance / Driver License Expiry table */}
              <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 lg:col-span-2 select-none">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-4.5 w-4.5 text-primary" />
                  <span>License Expiry & Compliance Report</span>
                </h3>

                <div className="overflow-x-auto max-h-[300px] overflow-y-auto border border-gray-100 rounded-lg">
                  <table className="min-w-full divide-y divide-gray-100 text-left text-xs font-semibold text-on-surface">
                    <thead className="bg-gray-50 text-[10px] uppercase font-bold text-on-surface-variant sticky top-0">
                      <tr>
                        <th className="px-4 py-3">Driver Name</th>
                        <th className="px-4 py-3">License No.</th>
                        <th className="px-4 py-3">Expiry Date</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {licenseReportData.map(l => {
                        const expired = l.days_to_expiry < 0;
                        return (
                          <tr key={l.id} className="hover:bg-gray-50/50">
                            <td className="px-4 py-3 font-bold">{l.name}</td>
                            <td className="px-4 py-3 font-mono">{l.license_number}</td>
                            <td className="px-4 py-3">
                              <span className={expired ? "text-error font-bold" : "text-on-surface"}>
                                {l.license_expiry_date}
                              </span>
                              {expired ? (
                                <span className="bg-red-500/10 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-500/20 ml-2">
                                  EXPIRED
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-on-surface-variant ml-2">
                                  ({l.days_to_expiry} days left)
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right capitalize">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${l.status === 'available' ? 'bg-green-100 text-green-800' :
                                l.status === 'on_trip' ? 'bg-blue-100 text-blue-800' :
                                  l.status === 'suspended' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                {l.status.replace('_', ' ')}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>


              {/* Suspended Drivers Panel */}
              <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 select-none">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="h-4.5 w-4.5 text-error" />
                  <span>Suspended Drivers</span>
                </h3>


                <div className="overflow-y-auto max-h-[300px] space-y-3 pr-1">
                  {suspendedDriversData.length === 0 ? (
                    <p className="text-xs text-on-surface-variant font-medium text-center py-8">
                      No drivers are currently suspended.
                    </p>
                  ) : (
                    suspendedDriversData.map(d => (
                      <div key={d.id} className="border border-gray-100 p-3 rounded-lg flex items-center justify-between gap-3 bg-red-50/20 border-red-500/10">
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-on-surface truncate">{d.name}</h4>
                          <p className="text-[10px] font-mono text-on-surface-variant truncate mt-0.5">{d.license_number} | {d.contact_number}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-xs font-bold text-red-600 block">{d.safety_score}/100</span>
                          <span className="text-[9px] font-extrabold uppercase bg-red-100 text-red-800 px-1 py-0.5 rounded">SUSPENDED</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }


  // Original Financial Dashboard (Fleet Manager / Financial Analyst)
  const chartEfficiencyData = completedTrips.map(t => ({
    name: `Trip #${t.id}`,
    efficiency: t.fuel_consumed > 0 ? parseFloat((t.actual_distance / t.fuel_consumed).toFixed(2)) : 0
  }));

  const renderMaintenanceDashboard = () => {
    const stats = maintData || {
      total_maintenance_cost: 0,
      active_jobs: 0,
      completed_jobs: 0,
      cancelled_jobs: 0,
      average_cost: 0,
      vehicles_in_shop: 0,
      monthly_maintenance_cost: [],
      service_type_distribution: [],
      maintenance_trend: []
    };

    return (
      <div className="space-y-6">
        {/* Export Buttons */}
        <div className="flex justify-end gap-2.5">
          <button
            onClick={handleMaintenanceCSVExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-sm font-semibold rounded-xl text-on-surface shadow-sm cursor-pointer transition-all transform hover:-translate-y-0.5"
          >
            <Download className="h-4.5 w-4.5 text-primary" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={handleMaintenancePDFExport}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg cursor-pointer transition-all transform hover:-translate-y-0.5"
          >
            <Download className="h-4.5 w-4.5" />
            <span>Export PDF</span>
          </button>
        </div>

        {/* KPI Cards Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Total Service Cost</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-on-surface">{formatCurrency(stats.total_maintenance_cost)}</span>
              <Wrench className="h-5 w-5 text-primary" />
            </div>
            <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Cumulative cost of all active/completed jobs</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Average Job Cost</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-on-surface">{formatCurrency(stats.average_cost)}</span>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Average cost per repair workshop job</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Active Repair Jobs</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-amber-600">{stats.active_jobs}</span>
              <Clock className="h-5 w-5 text-amber-500" />
            </div>
            <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Vehicles currently undergoing service</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Completed Jobs</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-green-600">{stats.completed_jobs}</span>
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Successfully completed repairs</p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-2">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Vehicles in Shop</span>
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-red-600">{stats.vehicles_in_shop}</span>
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <p className="text-[10.5px] leading-tight text-on-surface-variant font-medium">Fleet capacity currently off duty in-shop</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Cost Chart */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 lg:col-span-2">
            <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span>Monthly Maintenance Cost Trend</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthly_maintenance_cost}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Line type="monotone" dataKey="cost" stroke="#4F46E5" strokeWidth={2.5} name="Total Cost" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Type Distribution */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="h-4.5 w-4.5 text-primary" />
              <span>Service Type Distribution</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.service_type_distribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                  <XAxis type="number" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#6B7280" fontSize={10} tickLine={false} width={80} />
                  <Tooltip formatter={(value) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="#006b5f" radius={[0, 4, 4, 0]} name="Total Spend" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Maintenance Trend counts */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 lg:col-span-3">
            <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="h-4.5 w-4.5 text-primary" />
              <span>Completed Service Trend</span>
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.maintenance_trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="month" stroke="#6B7280" fontSize={11} tickLine={false} />
                  <YAxis stroke="#6B7280" fontSize={11} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="jobs" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Completed Repair Jobs" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Reports & Analytics</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">View efficiency metrics, ROI calculations, and export report datasets</p>
      </div>

      {user?.role === 'fleet_manager' && (
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('operational')}
            className={`px-4 py-2 font-bold text-sm cursor-pointer border-b-2 transition-all ${
              activeTab === 'operational'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Operational & ROI Reports
          </button>
          <button
            onClick={() => setActiveTab('maintenance')}
            className={`px-4 py-2 font-bold text-sm cursor-pointer border-b-2 transition-all ${
              activeTab === 'maintenance'
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            Maintenance & Repair Reports
          </button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Generating analytics dashboard...</div>
      ) : activeTab === 'maintenance' && user?.role === 'fleet_manager' ? (
        renderMaintenanceDashboard()
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">


          {/* FUEL EFFICIENCY REPORT */}
          <div className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="h-4.5 w-4.5 text-primary" />
                <span>Fuel Efficiency Report</span>
              </h3>
              {canExportReports && (
                <button
                  onClick={() => handleExportCSV('fuel_efficiency')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-on-surface cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
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
                        <td className="px-4 py-2.5 font-mono text-primary">{(t.vehicle_detail || t.vehicle)?.registration_number}</td>
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
              {canExportReports && (
                <button
                  onClick={() => handleExportCSV('roi')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-xs font-bold text-on-surface cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Export CSV</span>
                </button>
              )}
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



