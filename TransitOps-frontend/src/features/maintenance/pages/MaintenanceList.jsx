import React, { useState, useEffect } from 'react';
import { getMaintenanceLogs, createMaintenanceLog, closeMaintenanceLog } from '../../../api/maintenance';
import { getVehicles } from '../../../api/vehicles';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Plus, Wrench, Calendar, DollarSign, X, CheckCircle, Search } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { canPerformAction } from '../../../rbac/permissions';

export const MaintenanceList = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [vehicleId, setVehicleId] = useState('');
  const [maintType, setMaintType] = useState('');
  const [description, setDescription] = useState('');
  const [cost, setCost] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [selectedMaint, setSelectedMaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const canCreateMaintenance = canPerformAction(user?.role, 'maintenance', 'create');
  const canCloseMaintenance = canPerformAction(user?.role, 'maintenance', 'close');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [logsRes, vehiclesRes] = await Promise.all([
        getMaintenanceLogs({ status: filterStatus }),
        getVehicles()
      ]);
      setLogs(logsRes.data);
      // Filter out retired vehicles for new logs
      setVehicles(vehiclesRes.data.filter(v => v.status !== 'retired'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus]);

  const openModal = () => {
    setVehicleId('');
    setMaintType('');
    setDescription('');
    setCost('');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!vehicleId) errors.vehicle = ['Vehicle selection is required'];
    if (!maintType) errors.maintenance_type = ['Maintenance type is required'];
    if (!description) errors.description = ['Description is required'];
    if (!cost || parseFloat(cost) <= 0) errors.cost = ['Cost must be a positive number'];

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle: parseInt(vehicleId),
      maintenance_type: maintType,
      description: description,
      cost: parseFloat(cost)
    };

    try {
      await createMaintenanceLog(payload);
      setShowModal(false);
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to schedule maintenance.');
      }
    }
  };

  const handleCloseLog = async (id) => {
    if (window.confirm('Mark this maintenance issue as closed? Vehicle status will be returned to "Available".')) {
      try {
        await closeMaintenanceLog(id);
        fetchData();
      } catch (err) {
        alert(err.error?.message || 'Failed to close maintenance');
      }
    }
  };

  // Client-side search filtering
  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const vehicle = log.vehicle_detail || log.vehicle;
    const matchesSearch = 
      log.maintenance_type.toLowerCase().includes(q) ||
      vehicle?.registration_number.toLowerCase().includes(q) ||
      vehicle?.name_model.toLowerCase().includes(q);
    return matchesSearch;
  });

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

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Maintenance Center</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">Schedule services, track costs, and close active repair jobs</p>
        </div>
        {canCreateMaintenance && (
          <button
            onClick={openModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Schedule Service</span>
          </button>
        )}
      </div>

      {/* Search Filter Header */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by vehicle, registration, or issue..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-colors"
          />
        </div>

        {/* Status Dropdowns */}
        <div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="">All Logs</option>
            <option value="open">Active / Open</option>
            <option value="closed">Closed / Resolved</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Loading maintenance logs...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">No maintenance logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service Type</th>
                  <th className="px-6 py-4">Description</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm font-medium text-on-surface">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                    {(log.vehicle_detail || log.vehicle) ? (
                      <div>
                        <div className="font-bold">{(log.vehicle_detail || log.vehicle).name_model}</div>
                        <div className="text-xs font-mono text-primary font-bold mt-0.5">{(log.vehicle_detail || log.vehicle).registration_number}</div>
                      </div>
                    ) : (
                      'Unknown Vehicle'
                    )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-on-surface">
                      <div className="flex items-center gap-1.5">
                        <Wrench className="h-4 w-4 text-primary shrink-0" />
                        <span>{log.maintenance_type}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={log.description}>{log.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(log.started_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-on-surface-variant">
                        <Calendar className="h-4 w-4" />
                        <span>{formatDate(log.closed_at)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-on-surface">{formatCurrency(log.cost)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-6 py-4 text-center whitespace-nowrap flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedMaint(log);
                          setShowDetailModal(true);
                        }}
                        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg text-on-surface hover:bg-gray-100 transition-colors cursor-pointer"
                      >
                        View Details
                      </button>
                      {log.status === 'open' && canCloseMaintenance && (
                        <button
                          onClick={() => handleCloseLog(log.id)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-700 hover:bg-green-500/20 text-xs font-bold rounded-lg border border-green-500/20 transition-colors cursor-pointer"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          <span>Close Issue</span>
                        </button>
                      )}
                      {log.status === 'closed' && (
                        <span className="text-xs text-on-surface-variant font-semibold">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">Schedule Vehicle Service</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              {/* Vehicle Select */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Select Fleet Vehicle
                </label>
                <select
                  required
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                >
                  <option value="">Choose vehicle...</option>
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.name_model} ({v.registration_number}) - Current status: {v.status}
                    </option>
                  ))}
                </select>
                {formErrors.vehicle && (
                  <p className="text-xs text-error mt-1">{formErrors.vehicle[0]}</p>
                )}
              </div>

              {/* Maintenance Type */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Maintenance / Service Type
                </label>
                <input
                  type="text"
                  required
                  value={maintType}
                  onChange={(e) => setMaintType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  placeholder="Engine Overhaul, Tire Rotation, Oil Change..."
                />
                {formErrors.maintenance_type && (
                  <p className="text-xs text-error mt-1">{formErrors.maintenance_type[0]}</p>
                )}
              </div>

              {/* Cost */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Estimated Repair Cost (INR)
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-bold text-xs">
                    ₹
                  </span>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="25000"
                  />
                </div>
                {formErrors.cost && (
                  <p className="text-xs text-error mt-1">{formErrors.cost[0]}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Issue Description & Diagnostic Remarks
                </label>
                <textarea
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  placeholder="Enter specific repair details..."
                />
                {formErrors.description && (
                  <p className="text-xs text-error mt-1">{formErrors.description[0]}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-on-surface hover:bg-gray-50 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
                >
                  Confirm Repair Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedMaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">Maintenance Log Details</h3>
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedMaint(null);
                }}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-sm text-on-surface">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 border-b border-gray-100 pb-2">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Vehicle</span>
                  <div className="font-bold text-base">{(selectedMaint.vehicle_detail || selectedMaint.vehicle)?.name_model}</div>
                  <div className="font-mono text-xs text-primary font-bold">{(selectedMaint.vehicle_detail || selectedMaint.vehicle)?.registration_number}</div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Service Type</span>
                  <span className="font-semibold">{selectedMaint.maintenance_type}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Estimated Cost</span>
                  <span className="font-bold text-green-700">{formatCurrency(selectedMaint.cost)}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedMaint.status} />
                  </div>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Start Date</span>
                  <span>{formatDate(selectedMaint.started_at)}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">End Date</span>
                  <span>{formatDate(selectedMaint.closed_at)}</span>
                </div>

                <div className="col-span-2 bg-gray-50 p-3 rounded-lg border border-gray-150">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Diagnostic Remarks / Description</span>
                  <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap">{selectedMaint.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowDetailModal(false);
                    setSelectedMaint(null);
                  }}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-on-surface font-semibold rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
