import React, { useState, useEffect } from 'react';
import { getTrips, createTrip, dispatchTrip, completeTrip, cancelTrip } from '../../../api/trips';
import { getAvailableVehiclesForDispatch } from '../../../api/vehicles';
import { getAvailableDriversForDispatch } from '../../../api/drivers';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Search, Plus, MapPin, Navigation, Calendar, User, Truck, X, Eye, ShieldAlert, CheckCircle2, AlertTriangle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { canPerformAction } from '../../../rbac/permissions';

export const TripsList = () => {
  const { user } = useAuth();
  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Modals state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);

  // Create Form fields
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');
  const [cargoWeight, setCargoWeight] = useState('');
  const [plannedDistance, setPlannedDistance] = useState('');
  const [revenue, setRevenue] = useState('');

  // Complete Form fields
  const [finalOdo, setFinalOdo] = useState('');
  const [fuelConsumed, setFuelConsumed] = useState('');
  const [actualDistance, setActualDistance] = useState('');

  const [formErrors, setFormErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const canCreateTrip = canPerformAction(user?.role, 'trips', 'create');
  const canDispatchTrip = canPerformAction(user?.role, 'trips', 'dispatch');
  const canCompleteTrip = canPerformAction(user?.role, 'trips', 'complete');
  const canCancelTrip = canPerformAction(user?.role, 'trips', 'cancel');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tripsResult, vehiclesResult, driversResult] = await Promise.allSettled([
        getTrips({ search, status: filterStatus }),
        getAvailableVehiclesForDispatch(),
        getAvailableDriversForDispatch()
      ]);
      if (tripsResult.status === 'fulfilled') setTrips(tripsResult.value.data);
      if (vehiclesResult.status === 'fulfilled') setVehicles(vehiclesResult.value.data);
      if (driversResult.status === 'fulfilled') setDrivers(driversResult.value.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search, filterStatus]);

  // Helper: check if driver license is expired
  const isLicenseExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  // Filter available resources for trip assignment
  const availableVehicles = vehicles;
  const availableDrivers = drivers;

  const openCreateModal = () => {
    setSource('');
    setDestination('');
    setVehicleId('');
    setDriverId('');
    setCargoWeight('');
    setPlannedDistance('');
    setRevenue('');
    setFormErrors({});
    setGeneralError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!source) errors.source = ['Source location is required'];
    if (!destination) errors.destination = ['Destination location is required'];
    if (!vehicleId) errors.vehicle_id = ['Vehicle selection is required'];
    if (!driverId) errors.driver_id = ['Driver selection is required'];
    if (!cargoWeight || parseFloat(cargoWeight) <= 0) errors.cargo_weight = ['Cargo weight must be positive'];
    if (!plannedDistance || parseFloat(plannedDistance) <= 0) errors.planned_distance = ['Planned distance must be positive'];
    if (!revenue || parseFloat(revenue) <= 0) errors.revenue = ['Revenue must be positive'];

    // Enforce business rule: Cargo Weight <= Vehicle Capacity
    if (vehicleId && cargoWeight) {
      const selectedVehicle = vehicles.find(v => v.id === parseInt(vehicleId));
      if (selectedVehicle && parseFloat(cargoWeight) > parseFloat(selectedVehicle.max_load_capacity)) {
        errors.cargo_weight = [`Cargo exceeds vehicle capacity of ${parseFloat(selectedVehicle.max_load_capacity).toLocaleString()} kg`];
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      source,
      destination,
      vehicle: parseInt(vehicleId),
      driver: parseInt(driverId),
      cargo_weight: parseFloat(cargoWeight),
      planned_distance: parseFloat(plannedDistance),
      revenue: parseFloat(revenue)
    };

    try {
      await createTrip(payload);
      setShowCreateModal(false);
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to create trip');
      }
    }
  };

  const handleDispatch = async (id) => {
    if (window.confirm('Dispatch this trip? Selected vehicle and driver will be set to "On Trip".')) {
      try {
        await dispatchTrip(id);
        fetchData();
      } catch (err) {
        alert(err.error?.message || 'Dispatch failed');
      }
    }
  };

  const openCompleteModal = (trip) => {
    setSelectedTrip(trip);
    // Suggest default values
    const vehicle = trip.vehicle_detail || trip.vehicle;
    const currentOdo = vehicle?.odometer || 0;
    setFinalOdo(String(currentOdo + trip.planned_distance));
    setActualDistance(String(trip.planned_distance));
    setFuelConsumed(String(Math.round(trip.planned_distance / 3))); // Mock guess on fuel
    setFormErrors({});
    setGeneralError('');
    setShowCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault();
    setFormErrors({});
    setGeneralError('');

    const errors = {};
    if (!finalOdo || parseFloat(finalOdo) <= 0) errors.final_odometer = ['Odometer value is required'];
    if (!fuelConsumed || parseFloat(fuelConsumed) <= 0) errors.fuel_consumed = ['Fuel consumption is required'];
    if (!actualDistance || parseFloat(actualDistance) <= 0) errors.actual_distance = ['Actual distance is required'];

    // Enforce odometer must increase
    const vehicle = selectedTrip?.vehicle_detail || selectedTrip?.vehicle;
    const currentOdo = vehicle?.odometer || 0;
    if (parseFloat(finalOdo) <= currentOdo) {
      errors.final_odometer = [`Odometer must be greater than current vehicle odometer (${currentOdo.toLocaleString()} km)`];
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const payload = {
      final_odometer: parseFloat(finalOdo),
      fuel_consumed: parseFloat(fuelConsumed),
      actual_distance: parseFloat(actualDistance)
    };

    try {
      await completeTrip(selectedTrip.id, payload);
      setShowCompleteModal(false);
      fetchData();
    } catch (err) {
      if (err.error?.fields) {
        setFormErrors(err.error.fields);
      } else {
        setGeneralError(err.error?.message || 'Failed to complete trip');
      }
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Are you sure you want to CANCEL this trip? Driver and vehicle status will be returned to "Available".')) {
      try {
        await cancelTrip(id);
        fetchData();
      } catch (err) {
        alert(err.error?.message || 'Cancellation failed');
      }
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 select-none">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-on-surface m-0 leading-none">Trip Dispatcher</h2>
          <p className="text-xs text-on-surface-variant font-medium mt-1.5 font-sans">Dispatch, track, and close vehicle transport trips</p>
        </div>
        {canCreateTrip && (
          <button
            onClick={openCreateModal}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Plus className="h-4.5 w-4.5" />
            <span>Plan Transport Trip</span>
          </button>
        )}
      </div>

      {/* Search & Filter Row */}
      <div className="bg-white p-4 rounded-xl border border-gray-150 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-on-surface-variant">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search by source or destination..."
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
            <option value="">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="dispatched">Dispatched</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Trips Cards/List */}
      {loading ? (
        <div className="text-center py-16 text-sm font-semibold text-on-surface-variant">Loading trip registries...</div>
      ) : trips.length === 0 ? (
        <div className="bg-white text-center py-16 rounded-xl border border-gray-150 shadow-sm">
          <AlertCircle className="h-10 w-10 text-outline mx-auto mb-3" />
          <h4 className="font-bold text-on-surface text-base">No trips scheduled</h4>
          <p className="text-xs text-on-surface-variant mt-1.5">Create a transport trip to dispatch vehicles.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {trips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-xl border border-gray-150 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative">
              {/* Card Title & Status */}
              <div className="flex justify-between items-start gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 text-primary p-2 rounded-lg">
                    <Navigation className="h-4.5 w-4.5 rotate-45" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base leading-tight">Trip #{trip.id}</h4>
                    <p className="text-xs text-on-surface-variant mt-0.5">Est. Revenue: {formatCurrency(trip.revenue)}</p>
                  </div>
                </div>
                <StatusBadge status={trip.status} />
              </div>

              {/* Source & Destination Route */}
              <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between gap-4 text-sm font-semibold">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-outline" />
                  <span>{trip.source}</span>
                </div>
                <div className="flex-1 border-t-2 border-dashed border-gray-300 mx-2" />
                <div className="flex items-center gap-2 text-right">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{trip.destination}</span>
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-4 text-xs font-semibold">
                {/* Vehicle */}
                <div className="flex items-center gap-2 border border-gray-150 rounded-lg p-2.5">
                  <Truck className="h-4 w-4 text-on-surface-variant" />
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider leading-none">Vehicle</p>
                    <p className="text-on-surface mt-1 truncate max-w-[150px]" title={(trip.vehicle_detail || trip.vehicle)?.name_model}>
                      {(trip.vehicle_detail || trip.vehicle) ? `${(trip.vehicle_detail || trip.vehicle).name_model} (${(trip.vehicle_detail || trip.vehicle).registration_number})` : 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Driver */}
                <div className="flex items-center gap-2 border border-gray-150 rounded-lg p-2.5">
                  <User className="h-4 w-4 text-on-surface-variant" />
                  <div>
                    <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider leading-none">Driver</p>
                    <p className="text-on-surface mt-1 truncate max-w-[150px]">
                      {(trip.driver_detail || trip.driver) ? (trip.driver_detail || trip.driver).name : 'Unassigned'}
                    </p>
                  </div>
                </div>

                {/* Cargo weight */}
                <div className="border border-gray-100 rounded-lg p-2.5">
                  <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider leading-none">Cargo Load</p>
                  <p className="text-on-surface font-bold text-sm mt-1">{trip.cargo_weight.toLocaleString()} kg</p>
                </div>

                {/* Planned Distance */}
                <div className="border border-gray-100 rounded-lg p-2.5">
                  <p className="text-on-surface-variant text-[10px] uppercase font-bold tracking-wider leading-none">Distance</p>
                  <p className="text-on-surface font-bold text-sm mt-1">Planned: {trip.planned_distance} km</p>
                </div>
              </div>

              {/* Completion Log Details (if completed) */}
              {trip.status === 'completed' && (
                <div className="bg-green-500/5 rounded-xl border border-green-500/10 p-3 text-xs space-y-1.5 font-semibold text-green-800">
                  <div className="flex justify-between">
                    <span>Actual Distance:</span>
                    <span className="font-bold">{trip.actual_distance} km</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fuel Consumed:</span>
                    <span className="font-bold">{trip.fuel_consumed} L</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Final Odometer:</span>
                    <span className="font-bold">{trip.final_odometer?.toLocaleString()} km</span>
                  </div>
                </div>
              )}

              {/* Conditional Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                {trip.status === 'draft' && canCancelTrip && (
                  <>
                    <button
                      onClick={() => handleCancel(trip.id)}
                      className="px-3.5 py-2 border border-error/20 text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel Trip
                    </button>
                  </>
                )}

                {trip.status === 'draft' && canDispatchTrip && (
                  <>
                    <button
                      onClick={() => handleDispatch(trip.id)}
                      className="px-3.5 py-2 bg-primary text-white hover:bg-primary-container text-xs font-bold rounded-lg shadow-sm hover:shadow cursor-pointer transition-all"
                    >
                      Dispatch Trip
                    </button>
                  </>
                )}

                {trip.status === 'dispatched' && canCancelTrip && (
                  <>
                    <button
                      onClick={() => handleCancel(trip.id)}
                      className="px-3.5 py-2 border border-error/20 text-error hover:bg-error-container hover:text-on-error-container text-xs font-bold rounded-lg cursor-pointer transition-colors"
                    >
                      Cancel Trip
                    </button>
                  </>
                )}

                {trip.status === 'dispatched' && canCompleteTrip && (
                  <>
                    <button
                      onClick={() => openCompleteModal(trip)}
                      className="px-3.5 py-2 bg-green-600 text-white hover:bg-green-700 text-xs font-bold rounded-lg shadow-sm hover:shadow cursor-pointer transition-all"
                    >
                      Complete Trip
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Plan Trip Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">Plan New Cargo Trip</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Source */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Source Location
                  </label>
                  <input
                    type="text"
                    required
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Mumbai (MH)"
                  />
                  {formErrors.source && (
                    <p className="text-xs text-error mt-1">{formErrors.source[0]}</p>
                  )}
                </div>

                {/* Destination */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Destination Location
                  </label>
                  <input
                    type="text"
                    required
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="Pune (MH)"
                  />
                  {formErrors.destination && (
                    <p className="text-xs text-error mt-1">{formErrors.destination[0]}</p>
                  )}
                </div>

                {/* Vehicle Picker */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Assign Vehicle (Available Only)
                  </label>
                  <select
                    required
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="">Select vehicle...</option>
                    {availableVehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.name_model} ({v.registration_number}) - Cap: {v.max_load_capacity.toLocaleString()} kg
                      </option>
                    ))}
                  </select>
                  {formErrors.vehicle_id && (
                    <p className="text-xs text-error mt-1">{formErrors.vehicle_id[0]}</p>
                  )}
                </div>

                {/* Driver Picker */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Assign Driver (Available Only)
                  </label>
                  <select
                    required
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium cursor-pointer"
                  >
                    <option value="">Select driver...</option>
                    {availableDrivers.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} (Safety Score: {d.safety_score})
                      </option>
                    ))}
                  </select>
                  {formErrors.driver_id && (
                    <p className="text-xs text-error mt-1">{formErrors.driver_id[0]}</p>
                  )}
                </div>

                {/* Cargo Weight */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Cargo Weight (kg)
                  </label>
                  <input
                    type="number"
                    required
                    value={cargoWeight}
                    onChange={(e) => setCargoWeight(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="12000"
                  />
                  {formErrors.cargo_weight && (
                    <p className="text-xs text-error mt-1">{formErrors.cargo_weight[0]}</p>
                  )}
                </div>

                {/* Planned Distance */}
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Planned Distance (km)
                  </label>
                  <input
                    type="number"
                    required
                    value={plannedDistance}
                    onChange={(e) => setPlannedDistance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="150"
                  />
                  {formErrors.planned_distance && (
                    <p className="text-xs text-error mt-1">{formErrors.planned_distance[0]}</p>
                  )}
                </div>

                {/* Revenue */}
                <div className="col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                    Estimated Revenue (INR)
                  </label>
                  <input
                    type="number"
                    required
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                    placeholder="45000"
                  />
                  {formErrors.revenue && (
                    <p className="text-xs text-error mt-1">{formErrors.revenue[0]}</p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-on-surface hover:bg-gray-50 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-primary to-secondary text-white font-semibold rounded-xl text-sm shadow-md hover:shadow-lg transition-colors cursor-pointer"
                >
                  Draft Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Trip Modal */}
      {showCompleteModal && selectedTrip && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-dark-gray/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-gray-150 max-w-md w-full overflow-hidden transform transition-all">
            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50 px-6 py-4 border-b border-gray-150">
              <h3 className="text-base font-bold text-on-surface m-0">Close & Complete Trip #{selectedTrip.id}</h3>
              <button
                onClick={() => setShowCompleteModal(false)}
                className="text-on-surface-variant hover:text-on-surface p-1 rounded-lg hover:bg-gray-200 cursor-pointer transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleComplete} className="p-6 space-y-4">
              {generalError && (
                <div className="bg-error-container border border-error/20 text-on-error-container text-xs rounded-xl p-3 font-medium">
                  {generalError}
                </div>
              )}

              <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 text-xs text-on-surface-variant space-y-1">
                <p className="font-bold text-on-surface">Vehicle Details:</p>
                <p>Model: {(selectedTrip.vehicle_detail || selectedTrip.vehicle)?.name_model}</p>
                <p>Starting Odometer: {(selectedTrip.vehicle_detail || selectedTrip.vehicle)?.odometer?.toLocaleString()} km</p>
                <p>Planned Distance: {selectedTrip.planned_distance} km</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Actual Distance Completed (km)
                </label>
                <input
                  type="number"
                  required
                  value={actualDistance}
                  onChange={(e) => setActualDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
                {formErrors.actual_distance && (
                  <p className="text-xs text-error mt-1">{formErrors.actual_distance[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Final Odometer Reading (km)
                </label>
                <input
                  type="number"
                  required
                  value={finalOdo}
                  onChange={(e) => setFinalOdo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
                {formErrors.final_odometer && (
                  <p className="text-xs text-error mt-1">{formErrors.final_odometer[0]}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-on-surface-variant mb-1.5">
                  Fuel Consumed (Liters)
                </label>
                <input
                  type="number"
                  required
                  value={fuelConsumed}
                  onChange={(e) => setFuelConsumed(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-medium"
                />
                {formErrors.fuel_consumed && (
                  <p className="text-xs text-error mt-1">{formErrors.fuel_consumed[0]}</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowCompleteModal(false)}
                  className="px-4 py-2.5 border border-gray-200 text-on-surface hover:bg-gray-50 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-green-600 text-white font-semibold rounded-xl text-sm shadow-md hover:bg-green-700 cursor-pointer"
                >
                  Complete Trip Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripsList;
