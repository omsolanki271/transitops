import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getVehicles = async (filters = {}) => {
  if (isMockMode()) {
    let vehicles = mockDb.getVehicles();
    
    // Apply client filters if present
    if (filters.status) {
      vehicles = vehicles.filter(v => v.status === filters.status);
    }
    if (filters.vehicle_type) {
      vehicles = vehicles.filter(v => v.vehicle_type === filters.vehicle_type);
    }
    if (filters.region) {
      vehicles = vehicles.filter(v => v.region === filters.region);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      vehicles = vehicles.filter(v => 
        v.registration_number.toLowerCase().includes(q) || 
        v.name_model.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: vehicles,
      meta: { page: 1, page_size: 20, total: vehicles.length }
    };
  }

  // Live call
  return apiClient.get('/vehicles/', { params: filters });
};

export const getVehicle = async (id) => {
  if (isMockMode()) {
    const vehicle = mockDb.getVehicle(id);
    if (!vehicle) throw { success: false, error: { message: 'Vehicle not found' } };
    return { success: true, data: vehicle };
  }
  return apiClient.get(`/vehicles/${id}/`);
};

export const createVehicle = async (vehicleData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createVehicle(vehicleData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/vehicles/', vehicleData);
};

export const updateVehicle = async (id, vehicleData) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.updateVehicle(id, vehicleData);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.patch(`/vehicles/${id}/`, vehicleData);
};

export const deleteVehicle = async (id) => {
  if (isMockMode()) {
    mockDb.deleteVehicle(id);
    return { success: true, message: 'Vehicle retired successfully' };
  }
  return apiClient.delete(`/vehicles/${id}/`);
};
