import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getDrivers = async (filters = {}) => {
  if (isMockMode()) {
    let drivers = mockDb.getDrivers();
    
    // Apply client filters if present
    if (filters.status) {
      drivers = drivers.filter(d => d.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      drivers = drivers.filter(d => 
        d.name.toLowerCase().includes(q) || 
        d.license_number.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: drivers,
      meta: { page: 1, page_size: 20, total: drivers.length }
    };
  }

  // Live call
  return apiClient.get('/drivers/', { params: filters });
};

export const getDriver = async (id) => {
  if (isMockMode()) {
    const driver = mockDb.getDriver(id);
    if (!driver) throw { success: false, error: { message: 'Driver not found' } };
    return { success: true, data: driver };
  }
  return apiClient.get(`/drivers/${id}/`);
};

export const createDriver = async (driverData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createDriver(driverData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/drivers/', driverData);
};

export const updateDriver = async (id, driverData) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.updateDriver(id, driverData);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.patch(`/drivers/${id}/`, driverData);
};
