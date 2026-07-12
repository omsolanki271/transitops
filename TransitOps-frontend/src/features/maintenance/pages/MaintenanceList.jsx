import React, { useState, useEffect } from 'react';
import { 
  getMaintenanceLogs, 
  createMaintenanceLog, 
  updateMaintenanceLog,
  deleteMaintenanceLog, 
  closeMaintenanceLog 
} from '../../../api/maintenance';
import { getVehicles } from '../../../api/vehicles';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { 
  Plus, 
  Wrench, 
  Calendar, 
  DollarSign, 
  X, 
  CheckCircle, 
  Search, 
  Edit, 
  Trash2, 
  Info,
  Clock,
  User,
  FileText,
  Paperclip
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { canPerformAction } from '../../../rbac/permissions';

export const MaintenanceList = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search, Filter, Sort, Pagination States
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  // Modal form states
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Form Field States
  const [vehicleId, setVehicleId] = useState('');
  const [serviceType, setServiceType] = useState('');
  const [description, setDescription] = useState('');
  const [workshop, setWorkshop] = useState('');
  const [mechanic, setMechanic] = useState('');
  const [cost, setCost] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('active');
  const [notes, setNotes] = useState('');
  const [attachments, setAttachments] = useState('');

  // Details Modal State
  const [selectedMaint, setSelectedMaint] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Toast notifications state
  const [toast, setToast] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  // RBAC checks
  const canCreateMaintenance = canPerformAction(user?.role, 'maintenance', 'create');
  const canUpdateMaintenance = canPerformAction(user?.role, 'maintenance', 'update');
  const canDeleteMaintenance = canPerformAction(user?.role, 'maintenance', 'delete');
  const canCloseMaintenance = canPerformAction(user?.role, 'maintenance', 'close');

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = {
        page: currentPage,
        page_size: pageSize,
        search: search || undefined,
        status: filterStatus !== 'all' ? filterStatus : undefined,
        ordering: sortBy
      };
      
      const [logsRes, vehiclesRes] = await Promise.all([
        getMaintenanceLogs(params),
        getVehicles()
      ]);
      
      setLogs(logsRes.data || []);
      setTotalItems(logsRes.meta?.total || logsRes.data?.length || 0);
      setVehicles(vehiclesRes.data || []);
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterStatus, sortBy, currentPage, pageSize]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const handleClearSearch = () => {
    setSearch('');
    setCurrentPage(1);
    setTimeout(fetchData, 50);
  };

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setVehicleId('');
    setServiceType('');
    setDescription('');
    setWorkshop('');
    setMechanic('');
    setCost('');
    setStartDate(new Date().toISOString().slice(0, 10));
    setEndDate('');
    setPriority('medium');
    setStatus('active');
    setNotes('');
    setAttachments('');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (log) => {
    setIsEditing(true);
    setSelectedId(log.id);
    setVehicleId(log.vehicle?.id || log.vehicle);
    setServiceType(log.service_type || log.maintenance_type || '');
    setDescription(log.description || '');
    setWorkshop(log.workshop || '');
    setMechanic(log.mechanic || '');
    setCost(log.cost ? parseFloat(log.cost).toString() : '');
    setStartDate(log.start_date || log.started_at?.slice(0, 10) || new Date().toISOString().slice(0, 10));
    setEndDate(log.end_date || log.closed_at?.slice(0, 10) || '');
    setPriority(log.priority || 'medium');
    setStatus(log.status || 'active');
    setNotes(log.notes || '');
    setAttachments(log.attachments || '');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!vehicleId) errors.vehicle = ['Vehicle is required'];
    if (!serviceType) errors.service_type = ['Service type is required'];
    if (!cost || parseFloat(cost) <= 0) errors.cost = ['Cost must be greater than zero'];
    if (!startDate) errors.start_date = ['Start date is required'];
    if (endDate && startDate && new Date(endDate) < new Date(startDate)) {
      errors.end_date = ['End date cannot be before start date'];
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      vehicle: parseInt(vehicleId),
      service_type: serviceType,
      maintenance_type: serviceType,
      description,
      workshop,
      mechanic,
      cost: parseFloat(cost),
      start_date: startDate,
      end_date: endDate || null,
      priority,
      status,
      notes,
      attachments
    };

    try {
      if (isEditing) {
        await updateMaintenanceLog(selectedId, payload);
        showToast('Maintenance updated.');
      } else {
        await createMaintenanceLog(payload);
        showToast('Maintenance record created.');
      }
      setShowModal(false);
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to save maintenance.');
      }
    }
  };

  const handleCloseLog = async (id) => {
    if (window.confirm('Mark this maintenance issue as completed? Vehicle status will be returned to "Available".')) {
      try {
        await closeMaintenanceLog(id);
        showToast('Maintenance closed successfully.');
        fetchData();
      } catch (err) {
        showToast(err.error?.message || 'Failed to close maintenance.', 'error');
      }
    }
  };

  const handleDeleteLog = async (id) => {
    if (window.confirm('Are you sure you want to delete this maintenance log? This action cannot be undone.')) {
      try {
        await deleteMaintenanceLog(id);
        showToast('Maintenance deleted.');
        fetchData();
      } catch (err) {
        showToast(err.error?.message || 'Failed to delete maintenance.', 'error');
      }
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

  const getPriorityColor = (pr) => {
    switch (pr?.toLowerCase()) {
      case 'low': return 'bg-gray-100 text-gray-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800 font-bold';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const totalPages = Math.ceil(totalItems / pageSize) || 1;

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
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Schedule Service</span>
          </button>
        )}
      </div>

      {/* Filters & Control bar */}
      <div className="bg-white p-5 rounded-xl border border-gray-150 shadow-sm flex flex-col lg:flex-row gap-4 justify-between lg:items-center">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md flex gap-2">
          <div className="relative flex-1 px-2" >
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search vehicle name, reg number, mechanic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-on-surface-variant hover:text-on-surface cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <button
            type="submit"
            className="px-3.5 py-2 bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg hover:bg-gray-100 cursor-pointer"
          >
            Go
          </button>
        </form>

        {/* Filters & Sorting */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="all">All Logs</option>
              <option value="scheduled">Scheduled</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_cost">Highest Cost</option>
              <option value="lowest_cost">Lowest Cost</option>
              <option value="vehicle_name">Vehicle Name</option>
            </select>
          </div>

          {/* Page Size */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Limit:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(parseInt(e.target.value));
                setCurrentPage(1);
              }}
              className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant flex items-center justify-center gap-2">
            <span className="h-5 w-5 border-2 border-primary border-t-transparent animate-spin rounded-full inline-block" />
            <span>Compiling service records...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-sm font-semibold text-on-surface-variant space-y-2">
            <Wrench className="h-10 w-10 text-on-surface-variant/40 mx-auto" />
            <p>No maintenance logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Vehicle</th>
                  <th className="px-6 py-4">Service Details</th>
                  <th className="px-6 py-4">Workshop & Mechanic</th>
                  <th className="px-6 py-4">Start Date</th>
                  <th className="px-6 py-4">End Date</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4 text-center">Priority</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm font-medium text-on-surface">
                {logs.map((log) => {
                  const logVehicle = log.vehicle_detail || log.vehicle;
                  return (
                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                      {/* Vehicle */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {logVehicle ? (
                          <div>
                            <div className="font-bold text-on-surface">{logVehicle.name_model}</div>
                            <div className="text-xs font-mono text-primary font-bold mt-0.5">{logVehicle.registration_number}</div>
                          </div>
                        ) : (
                          <span className="text-on-surface-variant font-medium">Unknown Vehicle</span>
                        )}
                      </td>

                      {/* Service Details */}
                      <td className="px-6 py-4">
                        <div className="font-bold flex items-center gap-1.5">
                          <Wrench className="h-4 w-4 text-primary shrink-0" />
                          <span>{log.service_type || log.maintenance_type}</span>
                        </div>
                        <div className="text-xs text-on-surface-variant font-medium max-w-[180px] truncate mt-0.5" title={log.description}>
                          {log.description}
                        </div>
                      </td>

                      {/* Workshop & Mechanic */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold">{log.workshop || 'Self Workshop'}</div>
                        <div className="text-xs text-on-surface-variant font-medium mt-0.5">{log.mechanic || 'System Mechanic'}</div>
                      </td>

                      {/* Start Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(log.start_date || log.started_at)}</span>
                        </div>
                      </td>

                      {/* End Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs text-on-surface-variant font-semibold">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDate(log.end_date || log.closed_at)}</span>
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 text-right whitespace-nowrap font-bold text-on-surface">
                        {formatCurrency(log.cost)}
                      </td>

                      {/* Priority */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 text-[10px] font-bold rounded-full uppercase ${getPriorityColor(log.priority)}`}>
                          {log.priority || 'medium'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center whitespace-nowrap">
                        <StatusBadge status={log.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-center whitespace-nowrap flex items-center justify-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedMaint(log);
                            setShowDetailModal(true);
                          }}
                          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-xs font-bold rounded-lg text-on-surface hover:bg-gray-100 transition-colors cursor-pointer"
                          title="View complete diagnostic logs"
                        >
                          View Details
                        </button>
                        
                        {log.status === 'active' && canCloseMaintenance && (
                          <button
                            onClick={() => handleCloseLog(log.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/10 text-green-700 hover:bg-green-500/20 text-xs font-bold rounded-lg border border-green-500/20 transition-colors cursor-pointer"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                            <span>Close</span>
                          </button>
                        )}

                        {log.status !== 'completed' && log.status !== 'cancelled' && canUpdateMaintenance && (
                          <button
                            onClick={() => openEditModal(log)}
                            className="p-1.5 bg-gray-50 border border-gray-200 hover:bg-gray-100 rounded-lg text-primary transition-colors cursor-pointer"
                            title="Edit log details"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                        )}

                        {canDeleteMaintenance && (
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className="p-1.5 bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 rounded-lg text-error transition-colors cursor-pointer"
                            title="Delete log"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination controls */}
        {logs.length > 0 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-150 flex items-center justify-between">
            <span className="text-xs text-on-surface-variant font-semibold">
              Showing Page {currentPage} of {totalPages} ({totalItems} records found)
            </span>
            <div className="flex gap-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1.5 bg-white border border-gray-200 hover:bg-gray-100 disabled:opacity-50 text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Schedule / Edit Service Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-xl w-full overflow-hidden transform transition-all animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">
                {isEditing ? 'Edit Maintenance Service Record' : 'Schedule Vehicle Maintenance Service'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Vehicle Select */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Fleet Vehicle *
                  </label>
                  <select
                    required
                    disabled={isEditing}
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer disabled:bg-gray-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Choose vehicle...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name_model} ({v.registration_number}) - {v.status.toUpperCase()}
                      </option>
                    ))}
                  </select>
                  {formErrors.vehicle && (
                    <p className="text-xs text-error mt-1">{formErrors.vehicle[0]}</p>
                  )}
                </div>

                {/* Service Type */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Service / Maintenance Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={serviceType}
                    onChange={(e) => setServiceType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="e.g. Engine Overhaul, Brake Pad Swap"
                  />
                  {formErrors.service_type && (
                    <p className="text-xs text-error mt-1">{formErrors.service_type[0]}</p>
                  )}
                </div>

                {/* Estimated Cost */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Estimated Cost (INR) *
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant font-bold text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      required
                      step="any"
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

                {/* Workshop */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Workshop
                  </label>
                  <input
                    type="text"
                    value={workshop}
                    onChange={(e) => setWorkshop(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="e.g. Workshop Station #4"
                  />
                </div>

                {/* Mechanic */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Mechanic Name
                  </label>
                  <input
                    type="text"
                    value={mechanic}
                    onChange={(e) => setMechanic(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="e.g. John Mechanic"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                  {formErrors.start_date && (
                    <p className="text-xs text-error mt-1">{formErrors.start_date[0]}</p>
                  )}
                </div>

                {/* Expected End Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Expected End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                  />
                  {formErrors.end_date && (
                    <p className="text-xs text-error mt-1">{formErrors.end_date[0]}</p>
                  )}
                </div>

                {/* Priority Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Priority Level
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>

                {/* Status Selection */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="active">Active</option>
                    {isEditing && (
                      <>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Description */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Diagnostic Remarks & Problem Description *
                  </label>
                  <textarea
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Describe specific fault codes, repairs required..."
                  />
                  {formErrors.description && (
                    <p className="text-xs text-error mt-1">{formErrors.description[0]}</p>
                  )}
                </div>

                {/* Notes */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Notes / Recommendations
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Enter additional remarks or service warnings..."
                  />
                </div>

                {/* Attachments */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Invoice / Diagnostic Document Link
                  </label>
                  <input
                    type="text"
                    value={attachments}
                    onChange={(e) => setAttachments(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="e.g. http://transitops.s3/invoices/maint_invoice_123.pdf"
                  />
                </div>
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
                  {isEditing ? 'Save Changes' : 'Confirm Service Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {showDetailModal && selectedMaint && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-2xl w-full overflow-hidden transform transition-all animate-scale-up">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0 flex items-center gap-1.5">
                <Info className="h-4.5 w-4.5 text-primary" />
                <span>Diagnostic Logs Details</span>
              </h3>
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
            <div className="p-6 space-y-5 text-sm text-on-surface max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Vehicle Details */}
                <div className="col-span-2 border-b border-gray-100 pb-3">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Vehicle Profile</span>
                  <div className="font-bold text-base text-on-surface">{(selectedMaint.vehicle_detail || selectedMaint.vehicle)?.name_model}</div>
                  <div className="font-mono text-xs text-primary font-bold mt-0.5">{(selectedMaint.vehicle_detail || selectedMaint.vehicle)?.registration_number}</div>
                </div>

                {/* Service Type */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Service Type</span>
                  <span className="font-bold flex items-center gap-1.5">
                    <Wrench className="h-4 w-4 text-primary shrink-0" />
                    <span>{selectedMaint.service_type || selectedMaint.maintenance_type}</span>
                  </span>
                </div>

                {/* Cost */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Estimated Cost</span>
                  <span className="font-extrabold text-green-700 text-base">{formatCurrency(selectedMaint.cost)}</span>
                </div>

                {/* Priority */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Priority</span>
                  <div className="mt-1">
                    <span className={`inline-flex px-2.5 py-0.5 text-[10px] font-bold rounded-full uppercase ${getPriorityColor(selectedMaint.priority)}`}>
                      {selectedMaint.priority || 'medium'}
                    </span>
                  </div>
                </div>

                {/* Status */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Status</span>
                  <div className="mt-1">
                    <StatusBadge status={selectedMaint.status} />
                  </div>
                </div>

                {/* Workshop */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Workshop</span>
                  <span className="font-semibold">{selectedMaint.workshop || 'Internal Workshop'}</span>
                </div>

                {/* Mechanic */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Mechanic</span>
                  <span className="font-semibold">{selectedMaint.mechanic || 'System Mechanic'}</span>
                </div>

                {/* Dates */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Start Date</span>
                  <span className="font-semibold flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> {formatDate(selectedMaint.start_date || selectedMaint.started_at)}</span>
                </div>

                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">End Date</span>
                  <span className="font-semibold flex items-center gap-1"><Calendar className="h-4 w-4 text-primary" /> {formatDate(selectedMaint.end_date || selectedMaint.closed_at)}</span>
                </div>

                {/* Created By */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Created By</span>
                  <span className="font-semibold flex items-center gap-1"><User className="h-4 w-4 text-primary" /> {selectedMaint.created_by?.email || selectedMaint.created_by}</span>
                </div>

                {/* Created Date */}
                <div>
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-0.5">Created Date</span>
                  <span className="font-semibold flex items-center gap-1"><Clock className="h-4 w-4 text-primary" /> {formatDate(selectedMaint.created_at)}</span>
                </div>

                {/* Diagnostic Remarks / Description */}
                <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-primary" /> Diagnostic Remarks / Description
                  </span>
                  <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-medium">{selectedMaint.description}</p>
                </div>

                {/* Notes */}
                {selectedMaint.notes && (
                  <div className="col-span-2 bg-gray-50 p-4 rounded-xl border border-gray-150 space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Recommendations & Notes</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-wrap font-medium">{selectedMaint.notes}</p>
                  </div>
                )}

                {/* Attachments */}
                {selectedMaint.attachments && (
                  <div className="col-span-2">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">Attachments / Invoices</span>
                    <a
                      href={selectedMaint.attachments}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-bold hover:underline cursor-pointer border border-primary/20 bg-primary/5 px-3 py-1.5 rounded-lg"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span>View Uploaded Invoice</span>
                    </a>
                  </div>
                )}

                {/* History Logs */}
                {selectedMaint.history && (
                  <div className="col-span-2 border-t border-gray-150 pt-3">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-primary" /> Audit History
                    </span>
                    <div className="bg-gray-900 text-gray-200 font-mono text-[10.5px] p-3 rounded-lg max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                      {selectedMaint.history}
                    </div>
                  </div>
                )}
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
                  Close Diagnostic File
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 flex items-center gap-2 text-white px-4 py-3 rounded-xl shadow-lg border animate-fade-in font-medium text-sm ${
          toast.type === 'success' 
            ? 'bg-green-600 border-green-500/20' 
            : 'bg-red-600 border-red-500/20'
        }`}>
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
};

export default MaintenanceList;
