import React, { useState, useEffect } from 'react';
import { getExpenses, createExpense, getFuelLogs, createFuelLog } from '../../../api/expenses';
import { getVehicles } from '../../../api/vehicles';
import { getTrips } from '../../../api/trips';
import { Plus, Fuel, DollarSign, ListFilter, AlertCircle, Calendar, FileText, Truck } from 'lucide-react';

export const FuelExpenses = () => {
  const [activeTab, setActiveTab] = useState('fuel'); // 'fuel' | 'expenses' | 'summary'
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  
  // Fuel state
  const [fuelLogs, setFuelLogs] = useState([]);
  const [fuelVehicleId, setFuelVehicleId] = useState('');
  const [fuelTripId, setFuelTripId] = useState('');
  const [liters, setLiters] = useState('');
  const [fuelCost, setFuelCost] = useState('');
  const [fuelDate, setFuelDate] = useState('');

  // Expenses state
  const [expenses, setExpenses] = useState([]);
  const [expVehicleId, setExpVehicleId] = useState('');
  const [expTripId, setExpTripId] = useState('');
  const [expType, setExpType] = useState('toll');
  const [expAmount, setExpAmount] = useState('');
  const [expDate, setExpDate] = useState('');
  const [remarks, setRemarks] = useState('');

  const [loading, setLoading] = useState(true);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // Per-vehicle cost calculation summaries
  const [vehicleCostSummary, setVehicleCostSummary] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, tripsRes, fuelRes, expensesRes] = await Promise.all([
        getVehicles(),
        getTrips(),
        getFuelLogs(),
        getExpenses()
      ]);
      
      const vList = vehiclesRes.data.filter(v => v.status !== 'retired');
      setVehicles(vList);
      setTrips(tripsRes.data);
      setFuelLogs(fuelRes.data);
      setExpenses(expensesRes.data);

      // Compute per-vehicle summaries
      calculateVehicleSummaries(vehiclesRes.data, fuelRes.data, expensesRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const calculateVehicleSummaries = (vehiclesList, fuelData, expData) => {
    const getVehicleId = (item) => {
      if (!item) return null;
      if (item.vehicle_id) return item.vehicle_id;
      if (item.vehicle) {
        return typeof item.vehicle === 'object' ? item.vehicle.id : item.vehicle;
      }
      return null;
    };

    const summary = vehiclesList.map(vehicle => {
      const vFuel = fuelData.filter(f => getVehicleId(f) === vehicle.id).reduce((sum, f) => sum + parseFloat(f.cost || 0), 0);
      const vExpMaint = expData.filter(e => getVehicleId(e) === vehicle.id && e.expense_type === 'maintenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      const vExpOther = expData.filter(e => getVehicleId(e) === vehicle.id && e.expense_type !== 'maintenance').reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);
      return {
        id: vehicle.id,
        name: vehicle.name_model,
        reg: vehicle.registration_number,
        fuel: vFuel,
        maintenance: vExpMaint,
        other: vExpOther,
        total: vFuel + vExpMaint + vExpOther
      };
    }).filter(s => s.total > 0);
    setVehicleCostSummary(summary);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleLogFuel = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!fuelVehicleId) errors.fuel_vehicle = ['Vehicle is required'];
    if (!liters || parseFloat(liters) <= 0) errors.liters = ['Liters must be positive'];
    if (!fuelCost || parseFloat(fuelCost) <= 0) errors.fuel_cost = ['Fuel cost must be positive'];

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle: parseInt(fuelVehicleId),
      trip: fuelTripId ? parseInt(fuelTripId) : null,
      liters: parseFloat(liters),
      cost: parseFloat(fuelCost),
      log_date: fuelDate || new Date().toISOString().split('T')[0]
    };

    try {
      await createFuelLog(payload);
      setLiters('');
      setFuelCost('');
      setFuelVehicleId('');
      setFuelTripId('');
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to log fuel');
      }
    }
  };

  const handleLogExpense = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!expVehicleId) errors.exp_vehicle = ['Vehicle is required'];
    if (!expAmount || parseFloat(expAmount) <= 0) errors.exp_amount = ['Amount must be positive'];

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle: parseInt(expVehicleId),
      expense_type: expType,
      amount: parseFloat(expAmount),
      expense_date: expDate || new Date().toISOString().split('T')[0],
      description: remarks
    };

    try {
      await createExpense(payload);
      setExpAmount('');
      setExpVehicleId('');
      setExpTripId('');
      setRemarks('');
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to log expense');
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  const formatExpType = (type) => {
    const types = { toll: 'Tolls', maintenance: 'Maintenance', other: 'Others' };
    return types[type] || type;
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Operational Expenses</h2>
        <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">Manage refueling audits and general logistics costs</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 text-sm font-semibold select-none">
        <button
          onClick={() => setActiveTab('fuel')}
          className={`flex items-center gap-1.5 px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'fuel' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Fuel className="h-4.5 w-4.5" />
          <span>Fuel Logging</span>
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center gap-1.5 px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'expenses' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <DollarSign className="h-4.5 w-4.5" />
          <span>General Expenses</span>
        </button>
        <button
          onClick={() => setActiveTab('summary')}
          className={`flex items-center gap-1.5 px-6 py-3 border-b-2 transition-all cursor-pointer ${
            activeTab === 'summary' 
              ? 'border-primary text-primary font-bold' 
              : 'border-transparent text-on-surface-variant hover:text-on-surface'
          }`}
        >
          <Truck className="h-4.5 w-4.5" />
          <span>Per-Vehicle cost list</span>
        </button>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Syncing costs registries...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Tab Content: FUEL LOGGING */}
          {activeTab === 'fuel' && (
            <>
              {/* Form Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">Log Vehicle Refueling</h3>
                
                <form onSubmit={handleLogFuel} className="space-y-4">
                  {generalError && (
                    <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                      {generalError}
                    </div>
                  )}

                  {/* Vehicle Select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Fleet Vehicle
                    </label>
                    <select
                      required
                      value={fuelVehicleId}
                      onChange={(e) => setFuelVehicleId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
                    >
                      <option value="">Choose vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name_model} ({v.registration_number})</option>
                      ))}
                    </select>
                    {formErrors.fuel_vehicle && <p className="text-xs text-error mt-1">{formErrors.fuel_vehicle[0]}</p>}
                  </div>

                  {/* Trip Link (Optional) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Link Dispatch Trip (Optional)
                    </label>
                    <select
                      value={fuelTripId}
                      onChange={(e) => setFuelTripId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
                    >
                      <option value="">Not linked to trip</option>
                      {trips.filter(t => t.status === 'dispatched' || t.status === 'completed').map(t => (
                        <option key={t.id} value={t.id}>
                          Trip #{t.id} ({t.source} ➔ {t.destination})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Liters */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Fuel Liters
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={liters}
                      onChange={(e) => setLiters(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      placeholder="80"
                    />
                    {formErrors.liters && <p className="text-xs text-error mt-1">{formErrors.liters[0]}</p>}
                  </div>

                  {/* Cost */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Refueling cost (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-bold text-xs">₹</span>
                      <input
                        type="number"
                        required
                        value={fuelCost}
                        onChange={(e) => setFuelCost(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                        placeholder="7600"
                      />
                    </div>
                    {formErrors.fuel_cost && <p className="text-xs text-error mt-1">{formErrors.fuel_cost[0]}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={fuelDate}
                      onChange={(e) => setFuelDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    Log Fuel Audit
                  </button>
                </form>
              </div>

              {/* Records List Table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden lg:col-span-2">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider p-5 border-b border-gray-150">Refuel Records</h3>
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-150 text-left text-sm font-medium text-on-surface">
                    <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-on-surface-variant sticky top-0">
                      <tr>
                        <th className="px-6 py-3.5">Vehicle</th>
                        <th className="px-6 py-3.5">Linked Trip</th>
                        <th className="px-6 py-3.5">Liters</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5 text-right">Total Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {fuelLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            {(log.vehicle_detail || log.vehicle) ? (
                              <div>
                                <div className="font-bold">{(log.vehicle_detail || log.vehicle).name_model}</div>
                                <div className="text-xs font-mono text-primary font-bold">{(log.vehicle_detail || log.vehicle).registration_number}</div>
                              </div>
                            ) : 'Unknown'}
                          </td>
                          <td className="px-6 py-3.5 text-on-surface-variant font-bold">
                            {log.trip_id ? `Trip #${log.trip_id}` : 'N/A'}
                          </td>
                          <td className="px-6 py-3.5 font-mono">{log.liters} L</td>
                          <td className="px-6 py-3.5 text-xs text-on-surface-variant">{log.log_date}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-on-surface">{formatCurrency(log.cost)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Tab Content: GENERAL EXPENSES */}
          {activeTab === 'expenses' && (
            <>
              {/* Form Card */}
              <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider">Log General Expense</h3>
                
                <form onSubmit={handleLogExpense} className="space-y-4">
                  {generalError && (
                    <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                      {generalError}
                    </div>
                  )}

                  {/* Vehicle Select */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Fleet Vehicle
                    </label>
                    <select
                      required
                      value={expVehicleId}
                      onChange={(e) => setExpVehicleId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
                    >
                      <option value="">Choose vehicle...</option>
                      {vehicles.map(v => (
                        <option key={v.id} value={v.id}>{v.name_model} ({v.registration_number})</option>
                      ))}
                    </select>
                    {formErrors.exp_vehicle && <p className="text-xs text-error mt-1">{formErrors.exp_vehicle[0]}</p>}
                  </div>

                  {/* Trip Link (Optional) */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Link Dispatch Trip (Optional)
                    </label>
                    <select
                      value={expTripId}
                      onChange={(e) => setExpTripId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
                    >
                      <option value="">Not linked to trip</option>
                      {trips.filter(t => t.status === 'dispatched' || t.status === 'completed').map(t => (
                        <option key={t.id} value={t.id}>
                          Trip #{t.id} ({t.source} ➔ {t.destination})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Expense Type */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Expense Type
                    </label>
                    <select
                      value={expType}
                      onChange={(e) => setExpType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium cursor-pointer"
                    >
                      <option value="toll">Tolls / State Tax</option>
                      <option value="maintenance">Maintenance Service</option>
                      <option value="other">Other Allowances</option>
                    </select>
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Expense Amount (INR)
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-bold text-xs">₹</span>
                      <input
                        type="number"
                        required
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                        placeholder="800"
                      />
                    </div>
                    {formErrors.exp_amount && <p className="text-xs text-error mt-1">{formErrors.exp_amount[0]}</p>}
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={expDate}
                      onChange={(e) => setExpDate(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                      Remarks / Description
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium"
                      placeholder="Mumbai toll tax..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex justify-center py-2.5 px-4 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    Log Expense
                  </button>
                </form>
              </div>

              {/* Records List Table */}
              <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden lg:col-span-2">
                <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider p-5 border-b border-gray-150">Expense Audits</h3>
                <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-150 text-left text-sm font-medium text-on-surface">
                    <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-on-surface-variant sticky top-0">
                      <tr>
                        <th className="px-6 py-3.5">Vehicle</th>
                        <th className="px-6 py-3.5">Expense Type</th>
                        <th className="px-6 py-3.5">Remarks</th>
                        <th className="px-6 py-3.5">Date</th>
                        <th className="px-6 py-3.5 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {expenses.map((exp) => (
                        <tr key={exp.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            {(exp.vehicle_detail || exp.vehicle) ? (
                              <div>
                                <div className="font-bold">{(exp.vehicle_detail || exp.vehicle).name_model}</div>
                                <div className="text-xs font-mono text-primary font-bold">{(exp.vehicle_detail || exp.vehicle).registration_number}</div>
                              </div>
                            ) : 'Unknown'}
                          </td>
                          <td className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                            {formatExpType(exp.expense_type)}
                          </td>
                          <td className="px-6 py-3.5 text-xs text-on-surface-variant truncate max-w-xs">{exp.description}</td>
                          <td className="px-6 py-3.5 text-xs text-on-surface-variant">{exp.expense_date}</td>
                          <td className="px-6 py-3.5 text-right font-bold text-on-surface">{formatCurrency(exp.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Tab Content: PER-VEHICLE COST LIST SUMMARY */}
          {activeTab === 'summary' && (
            <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden lg:col-span-3">
              <h3 className="font-bold text-sm text-on-surface uppercase tracking-wider p-5 border-b border-gray-150">Per-Vehicle Cost Summaries</h3>
              
              {vehicleCostSummary.length === 0 ? (
                <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">
                  <AlertCircle className="h-8 w-8 text-outline mx-auto mb-2" />
                  No costs recorded yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-150 text-left text-sm font-medium text-on-surface">
                    <thead className="bg-gray-50 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      <tr>
                        <th className="px-6 py-4">Vehicle Model</th>
                        <th className="px-6 py-4">Registration Number</th>
                        <th className="px-6 py-4 text-right">Fuel Cost</th>
                        <th className="px-6 py-4 text-right">Maintenance Cost</th>
                        <th className="px-6 py-4 text-right">Other Expenses</th>
                        <th className="px-6 py-4 text-right">Aggregate Costs</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150">
                      {vehicleCostSummary.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 font-bold">{s.name}</td>
                          <td className="px-6 py-4 font-mono text-xs font-bold text-primary">{s.reg}</td>
                          <td className="px-6 py-4 text-right font-semibold text-on-surface-variant">{formatCurrency(s.fuel)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-on-surface-variant">{formatCurrency(s.maintenance)}</td>
                          <td className="px-6 py-4 text-right font-semibold text-on-surface-variant">{formatCurrency(s.other)}</td>
                          <td className="px-6 py-4 text-right font-bold text-primary">{formatCurrency(s.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default FuelExpenses;
