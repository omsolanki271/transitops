import apiClient, { isMockMode } from './client';
import { mockDb } from './mockDb';

export const getExpenses = async (filters = {}) => {
  if (isMockMode()) {
    let expenses = mockDb.getExpenses();
    
    if (filters.vehicle_id) {
      expenses = expenses.filter(e => e.vehicle_id === parseInt(filters.vehicle_id));
    }
    if (filters.expense_type) {
      expenses = expenses.filter(e => e.expense_type === filters.expense_type);
    }

    return {
      success: true,
      data: expenses,
      meta: { page: 1, page_size: 20, total: expenses.length }
    };
  }
  return apiClient.get('/expenses/', { params: filters });
};

export const createExpense = async (expenseData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createExpense(expenseData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/expenses/', expenseData);
};

export const getFuelLogs = async (filters = {}) => {
  if (isMockMode()) {
    let logs = mockDb.getFuelLogs();
    
    if (filters.vehicle_id) {
      logs = logs.filter(l => l.vehicle_id === parseInt(filters.vehicle_id));
    }

    return {
      success: true,
      data: logs,
      meta: { page: 1, page_size: 20, total: logs.length }
    };
  }
  return apiClient.get('/fuel-logs/', { params: filters });
};

export const createFuelLog = async (fuelData) => {
  if (isMockMode()) {
    try {
      const created = mockDb.createFuelLog(fuelData);
      return { success: true, data: created };
    } catch (err) {
      return Promise.reject(err);
    }
  }
  return apiClient.post('/fuel-logs/', fuelData);
};
