import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getMaintenanceLogs = async (filters = {}) => {
  if (isMockMode()) {
    let logs = mockDb.getMaintenanceLogs();
    
    if (filters.status) {
      logs = logs.filter(l => l.status === filters.status);
    }
    if (filters.vehicle_id) {
      logs = logs.filter(l => l.vehicle_id === parseInt(filters.vehicle_id));
    }

    return {
      success: true,
      data: logs,
      meta: { page: 1, page_size: 20, total: logs.length }
    };
  }
  return apiClient.get('/maintenance-logs/', { params: filters });
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
  return apiClient.post('/maintenance-logs/', logData);
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
  return apiClient.post(`/maintenance-logs/${id}/close/`);
};
