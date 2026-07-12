import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getTrips = async (filters = {}) => {
  if (isMockMode()) {
    let trips = mockDb.getTrips();
    
    // Apply client filters
    if (filters.status) {
      trips = trips.filter(t => t.status === filters.status);
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      trips = trips.filter(t => 
        t.source.toLowerCase().includes(q) || 
        t.destination.toLowerCase().includes(q)
      );
    }

    return {
      success: true,
      data: trips,
      meta: { page: 1, page_size: 20, total: trips.length }
    };
  }
  return apiClient.get('/trips/', { params: filters });
};

export const getTrip = async (id) => {
  if (isMockMode()) {
    const trip = mockDb.getTrip(id);
    if (!trip) throw { success: false, error: { message: 'Trip not found' } };
    return { success: true, data: trip };
  }
  return apiClient.get(`/trips/${id}/`);
};

export const createTrip = async (tripData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createTrip(tripData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/trips/', tripData);
};

export const dispatchTrip = async (id) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.dispatchTrip(id);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post(`/trips/${id}/dispatch/`);
};

export const completeTrip = async (id, completionData) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.completeTrip(id, completionData);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post(`/trips/${id}/complete/`, completionData);
};

export const cancelTrip = async (id) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.cancelTrip(id);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post(`/trips/${id}/cancel/`);
};
