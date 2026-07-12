import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getMaintenanceLogs = async (params = {}) => {
  if (isMockMode()) {
    let logs = mockDb.getMaintenanceLogs();
    
    if (params.status && params.status !== 'all') {
      logs = logs.filter(l => l.status === params.status);
    }
    if (params.vehicle_id) {
      logs = logs.filter(l => l.vehicle_id === parseInt(params.vehicle_id));
    }

    return {
      success: true,
      data: logs,
      meta: { page: 1, page_size: params.page_size || 20, total: logs.length }
    };
  }
  return apiClient.get('/maintenance/', { params });
};

export const getMaintenanceLog = async (id) => {
  if (isMockMode()) {
    const log = mockDb.getMaintenanceLog(id);
    return { success: true, data: log };
  }
  return apiClient.get(`/maintenance/${id}/`);
};

export const createMaintenanceLog = async (logData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createMaintenanceLog(logData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/maintenance/', logData);
};

export const updateMaintenanceLog = async (id, logData) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.updateMaintenanceLog(id, logData);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.put(`/maintenance/${id}/`, logData);
};

export const deleteMaintenanceLog = async (id) => {
  if (isMockMode()) {
    try {
      mockDb.deleteMaintenanceLog(id);
      return { success: true, message: 'Deleted' };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.delete(`/maintenance/${id}/`);
};

export const closeMaintenanceLog = async (id) => {
  if (isMockMode()) {
    try {
      const updated = mockDb.closeMaintenanceLog(id);
      return { success: true, data: updated };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.patch(`/maintenance/${id}/close/`);
};
