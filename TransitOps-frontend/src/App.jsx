import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Layout } from './components/layout/Layout';
import { Login } from './features/auth/pages/Login';
import { Dashboard } from './features/dashboard/pages/Dashboard';
import { VehiclesList } from './features/vehicles/pages/VehiclesList';
import { DriversList } from './features/drivers/pages/DriversList';
import { TripsList } from './features/trips/pages/TripsList';
import { MaintenanceList } from './features/maintenance/pages/MaintenanceList';
import { FuelExpenses } from './features/fuel-expenses/pages/FuelExpenses';
import { Reports } from './features/reports/pages/Reports';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Unprotected Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected Main Panel Routes */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            
            <Route path="dashboard" element={<Dashboard />} />
            
            <Route 
              path="vehicles" 
              element={
                <ProtectedRoute allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                  <VehiclesList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="drivers" 
              element={
                <ProtectedRoute allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                  <DriversList />
                </ProtectedRoute>
              } 
            />
            
            <Route path="trips" element={<TripsList />} />
            
            <Route 
              path="maintenance" 
              element={
                <ProtectedRoute allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                  <MaintenanceList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="expenses" 
              element={
                <ProtectedRoute allowedRoles={['fleet_manager', 'driver', 'financial_analyst']}>
                  <FuelExpenses />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={['fleet_manager', 'safety_officer', 'financial_analyst']}>
                  <Reports />
                </ProtectedRoute>
              } 
            />
          </Route>

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
