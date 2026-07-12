import React, { useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicle, deleteVehicle } from '../../../api/vehicles';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Search, Plus, Edit, Trash2, X, AlertCircle } from 'lucide-react';

export const VehiclesList = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  
  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  
  // Form fields
  const [regNo, setRegNo] = useState('');
  const [nameModel, setNameModel] = useState('');
  const [vehicleType, setVehicleType] = useState('heavy_duty_truck');
  const [capacity, setCapacity] = useState('');
  const [odometer, setOdometer] = useState('');
  const [cost, setCost] = useState('');
  const [status, setStatus] = useState('available');
  const [region, setRegion] = useState('west');

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');

  const fetchVehicles = async () => {
    setLoading(true);
    try {
      const res = await getVehicles({
        search,
        vehicle_type: filterType,
        status: filterStatus
      });
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [search, filterType, filterStatus]);

  const openCreateModal = () => {
    setIsEditing(false);
    setSelectedId(null);
    setRegNo('');
    setNameModel('');
    setVehicleType('heavy_duty_truck');
    setCapacity('');
    setOdometer('');
    setCost('');
    setStatus('available');
    setRegion('west');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const openEditModal = (vehicle) => {
    setIsEditing(true);
    setSelectedId(vehicle.id);
    setRegNo(vehicle.registration_number);
    setNameModel(vehicle.name_model);
    setVehicleType(vehicle.vehicle_type);
    setCapacity(vehicle.max_load_capacity);
    setOdometer(vehicle.odometer);
    setCost(vehicle.acquisition_cost);
    setStatus(vehicle.status);
    setRegion(vehicle.region || 'west');
    setFormErrors({});
    setGeneralError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    // Client-side validations
    const errors = {};
    if (!regNo) errors.registration_number = ['Registration number is required'];
    if (!nameModel) errors.name_model = ['Vehicle name/model is required'];
    if (!capacity || parseFloat(capacity) <= 0) errors.max_load_capacity = ['Capacity must be a positive number'];
    if (!odometer || parseFloat(odometer) < 0) errors.odometer = ['Odometer cannot be negative'];
    if (!cost || parseFloat(cost) <= 0) errors.acquisition_cost = ['Acquisition cost must be positive'];

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      registration_number: regNo,
      name_model: nameModel,
      vehicle_type: vehicleType,
      max_load_capacity: parseFloat(capacity),
      odometer: parseFloat(odometer),
      acquisition_cost: parseFloat(cost),
      status,
      region
    };

    try {
      if (isEditing) {
        await updateVehicle(selectedId, payload);
      } else {
        await createVehicle(payload);
      }
      setShowModal(false);
      fetchVehicles();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'An error occurred while saving.');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to retire this vehicle?')) {
      try {
        await deleteVehicle(id);
        fetchVehicles();
      } catch (err) {
        alert(err.error?.message || 'Failed to retire vehicle');
      }
    }
  };

  const formatTypeLabel = (type) => {
    const types = {
      heavy_duty_truck: 'Heavy Duty Truck',
      medium_duty_truck: 'Medium Duty Truck',
      pickup: 'Pickup Truck',
      dumper: 'Dumper/Tipper',
      mini_truck: 'Mini Truck'
    };
    return types[type] || type;
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header and Add Action */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Vehicle Directory</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1.5">Manage and track fleet vehicles</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
        >
          <Plus className="h-4.5 w-4.5" />
          <span>Register Vehicle</span>
        </button>
      </div>

      {/* Filters & Search Row */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by vehicle reg number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium transition-colors"
          />
        </div>

        {/* Type & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="">All Types</option>
            <option value="heavy_duty_truck">Heavy Duty Truck</option>
            <option value="medium_duty_truck">Medium Duty Truck</option>
            <option value="pickup">Pickup</option>
            <option value="dumper">Dumper</option>
            <option value="mini_truck">Mini Truck</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="text-xs font-semibold bg-gray-50 border border-gray-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="available">Available</option>
            <option value="on_trip">On Trip</option>
            <option value="in_shop">In Shop</option>
            <option value="retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Vehicles Table Card */}
      <div className="bg-white rounded-xl border border-gray-150 shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Loading vehicles...</div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <AlertCircle className="h-10 w-10 text-outline mx-auto mb-3" />
            <h4 className="font-bold text-on-surface text-base">No vehicles found</h4>
            <p className="text-xs text-on-surface-variant mt-1.5">Try clearing filters or add a new vehicle to the registry.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-150">
              <thead className="bg-gray-50 text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <tr>
                  <th className="px-6 py-4">Reg Number</th>
                  <th className="px-6 py-4">Vehicle Details</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4 text-right">Odometer</th>
                  <th className="px-6 py-4 text-right">Max Load</th>
                  <th className="px-6 py-4 text-right">Acquisition Cost</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 text-sm font-medium text-on-surface">
                {vehicles.map((v) => (
                  <tr key={v.id} className="hover:bg-gray-50/50 transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap font-bold text-primary font-mono">{v.registration_number}</td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-sm">{v.name_model}</div>
                        <div className="text-xs text-on-surface-variant mt-0.5 capitalize">Region: {v.region}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold">{formatTypeLabel(v.vehicle_type)}</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">{v.odometer?.toLocaleString()} km</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap">{v.max_load_capacity?.toLocaleString()} kg</td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-on-surface-variant">{formatCurrency(v.acquisition_cost)}</td>
                    <td className="px-6 py-4 text-center whitespace-nowrap"><StatusBadge status={v.status} /></td>
                    <td className="px-6 py-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(v)}
                          className="p-1.5 rounded-lg text-primary hover:bg-primary/10 cursor-pointer transition-colors"
                          title="Edit Details"
                        >
                          <Edit className="h-4.5 w-4.5" />
                        </button>
                        {v.status !== 'retired' && (
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="p-1.5 rounded-lg text-error hover:bg-error/10 cursor-pointer transition-colors"
                            title="Retire Vehicle"
                          >
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal Overlay */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full overflow-hidden transform transition-all">
            {/* Modal Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">
                {isEditing ? 'Modify Vehicle Details' : 'Register New Fleet Vehicle'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Registration Number */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Registration Number
                  </label>
                  <input
                    type="text"
                    required
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="MH-12-QE-1002"
                  />
                  {formErrors.registration_number && (
                    <p className="text-xs text-error mt-1">{formErrors.registration_number[0]}</p>
                  )}
                </div>

                {/* Vehicle Name/Model */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Vehicle Name/Model
                  </label>
                  <input
                    type="text"
                    required
                    value={nameModel}
                    onChange={(e) => setNameModel(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Tata Prima 4925.S"
                  />
                  {formErrors.name_model && (
                    <p className="text-xs text-error mt-1">{formErrors.name_model[0]}</p>
                  )}
                </div>

                {/* Vehicle Type */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Vehicle Type
                  </label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="heavy_duty_truck">Heavy Duty Truck</option>
                    <option value="medium_duty_truck">Medium Duty Truck</option>
                    <option value="pickup">Pickup</option>
                    <option value="dumper">Dumper/Tipper</option>
                    <option value="mini_truck">Mini Truck</option>
                  </select>
                </div>

                {/* Region */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Operational Region
                  </label>
                  <select
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="north">North</option>
                    <option value="south">South</option>
                    <option value="east">East</option>
                    <option value="west">West</option>
                  </select>
                </div>

                {/* Capacity (kg) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Max Capacity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="40000"
                  />
                  {formErrors.max_load_capacity && (
                    <p className="text-xs text-error mt-1">{formErrors.max_load_capacity[0]}</p>
                  )}
                </div>

                {/* Odometer (km) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Odometer (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="12000"
                  />
                  {formErrors.odometer && (
                    <p className="text-xs text-error mt-1">{formErrors.odometer[0]}</p>
                  )}
                </div>

                {/* Acquisition Cost (INR) */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Acquisition Cost (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="4500000"
                  />
                  {formErrors.acquisition_cost && (
                    <p className="text-xs text-error mt-1">{formErrors.acquisition_cost[0]}</p>
                  )}
                </div>

                {/* Status selector */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Operational Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="available">Available</option>
                    <option value="on_trip">On Trip</option>
                    <option value="in_shop">In Shop</option>
                    <option value="retired">Retired</option>
                  </select>
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
                  {isEditing ? 'Save Changes' : 'Register Vehicle'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehiclesList;
