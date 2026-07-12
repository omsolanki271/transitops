import React, { useState, useEffect } from 'react';
import { getDashboardSummary } from '../../../api/reports';
import { KPICard } from '../../../components/common/KPICard';
import { 
  Truck, 
  UserCheck, 
  MapPin, 
  Wrench, 
  Activity, 
  TrendingUp,
  Fuel, 
  DollarSign, 
  Briefcase, 
  Percent,
  RefreshCw
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [vehicleType, setVehicleType] = useState('');
  const [status, setStatus] = useState('');
  const [region, setRegion] = useState('');

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await getDashboardSummary({
        vehicle_type: vehicleType,
        status: status,
        region: region
      });
      setSummary(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [vehicleType, status, region]);

  // Mock data for charts matching Section 6 contract
  const utilizationData = [
    { name: 'Mon', rate: 68 },
    { name: 'Tue', rate: 72 },
    { name: 'Wed', rate: summary?.fleet_utilization || 75 },
    { name: 'Thu', rate: 78 },
    { name: 'Fri', rate: 82 },
    { name: 'Sat', rate: 60 },
    { name: 'Sun', rate: 55 }
  ];

  const expenseComparison = [
    { name: 'Jan', fuel: 45000, maintenance: 15000 },
    { name: 'Feb', fuel: 52000, maintenance: 18000 },
    { name: 'Mar', fuel: 48000, maintenance: 25000 },
    { name: 'Apr', fuel: 61000, maintenance: 12000 },
    { name: 'May', fuel: 55000, maintenance: 30000 },
    { name: 'Jun', fuel: summary?.fuel_cost || 42000, maintenance: summary?.maintenance_cost || 20000 }
  ];

  const vehicleStatusData = [
    { name: 'Available', value: summary?.available_vehicles || 0, color: '#22C55E' },
    { name: 'On Trip', value: summary?.active_vehicles || 0, color: '#3B82F6' },
    { name: 'In Shop', value: summary?.vehicles_in_shop || 0, color: '#F59E0B' }
  ].filter(item => item.value > 0);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Filters Header Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 select-none">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <span className="font-bold text-on-surface text-sm">Dashboard Scope Filters</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Vehicle Type Filter */}
          <div>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">All Vehicle Types</option>
              <option value="heavy_duty_truck">Heavy Duty Truck</option>
              <option value="medium_duty_truck">Medium Duty Truck</option>
              <option value="pickup">Pickup</option>
              <option value="dumper">Dumper</option>
              <option value="mini_truck">Mini Truck</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="in_shop">In Shop</option>
              <option value="retired">Retired</option>
            </select>
          </div>

          {/* Region Filter */}
          <div>
            <select
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors cursor-pointer"
            >
              <option value="">All Regions</option>
              <option value="north">North</option>
              <option value="south">South</option>
              <option value="east">East</option>
              <option value="west">West</option>
            </select>
          </div>

          {/* Refresh Button */}
          <button
            onClick={fetchSummary}
            className="p-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer"
            title="Refresh Metrics"
          >
            <RefreshCw className={`h-4.5 w-4.5 text-on-surface-variant ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Active Vehicles" 
          value={summary?.active_vehicles ?? 0} 
          icon={Truck} 
          trend="up" 
          trendValue="+12%" 
          trendLabel="vs last week"
        />
        <KPICard 
          title="Available Fleet" 
          value={summary?.available_vehicles ?? 0} 
          icon={Truck} 
          variant="mint"
        />
        <KPICard 
          title="Vehicles in Shop" 
          value={summary?.vehicles_in_shop ?? 0} 
          icon={Wrench}
          trend={summary?.vehicles_in_shop > 2 ? 'up' : 'down'}
          trendValue={summary?.vehicles_in_shop}
          trendLabel="active repairs"
        />
        <KPICard 
          title="Drivers On Duty" 
          value={summary?.drivers_on_duty ?? 0} 
          icon={UserCheck}
        />
        <KPICard 
          title="Active Trips" 
          value={summary?.active_trips ?? 0} 
          icon={MapPin}
        />
        <KPICard 
          title="Pending Trips" 
          value={summary?.pending_trips ?? 0} 
          icon={Activity}
        />
        <KPICard 
          title="Fleet Utilization" 
          value={`${summary?.fleet_utilization ?? 0}%`} 
          icon={Percent} 
          trend="up" 
          trendValue="Optimum"
          trendLabel="efficiency zone"
        />
        <KPICard 
          title="Vehicle ROI Est." 
          value={`${summary?.roi ?? 0}%`} 
          icon={TrendingUp}
        />
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard 
          title="Total Revenue" 
          value={formatCurrency(summary?.revenue ?? 0)} 
          icon={DollarSign}
        />
        <KPICard 
          title="Fuel Cost" 
          value={formatCurrency(summary?.fuel_cost ?? 0)} 
          icon={Fuel}
        />
        <KPICard 
          title="Maintenance Cost" 
          value={formatCurrency(summary?.maintenance_cost ?? 0)} 
          icon={Wrench}
        />
        <KPICard 
          title="Total Operational Cost" 
          value={formatCurrency(summary?.operational_cost ?? 0)} 
          icon={Briefcase}
          variant="mint"
        />
      </div>

      {/* Data Visualization Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fleet Utilization Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-2 select-none">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">
            Fleet Utilization Trend (%)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={utilizationData}>
                <defs>
                  <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0058be" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#0058be" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#6B7280" fontSize={12} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="rate" stroke="#0058be" strokeWidth={2} fillOpacity={1} fill="url(#colorRate)" name="Utilization Rate" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vehicle Status Pie Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm select-none">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">
            Fleet Status Breakdown
          </h3>
          <div className="h-72 flex flex-col justify-center items-center">
            {vehicleStatusData.length > 0 ? (
              <div className="w-full h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={vehicleStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {vehicleStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-sm font-medium text-on-surface-variant py-12">No active vehicles found</div>
            )}
            
            {/* Status Legend */}
            <div className="flex gap-4 mt-2 text-xs font-semibold">
              {vehicleStatusData.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Expenses Overview Bar Chart */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm lg:col-span-3 select-none">
          <h3 className="text-sm font-bold text-on-surface uppercase tracking-wider mb-4">
            Operational Cost Breakdown (Fuel vs Maintenance)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expenseComparison}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6B7280" fontSize={12} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Bar dataKey="fuel" fill="#0058be" radius={[4, 4, 0, 0]} name="Fuel Expenses" />
                <Bar dataKey="maintenance" fill="#006b5f" radius={[4, 4, 0, 0]} name="Maintenance Cost" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
