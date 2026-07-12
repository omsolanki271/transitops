import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getDashboardSummary = async (filters = {}) => {
  if (isMockMode()) {
    const summary = mockDb.getDashboardSummary(filters);
    return {
      success: true,
      data: summary
    };
  }
  return apiClient.get('/dashboard/summary/', { params: filters });
};

export const getReportsExportUrl = (reportType) => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1/';
  return `${baseUrl}reports/export/?format=csv&report=${reportType}`;
};
