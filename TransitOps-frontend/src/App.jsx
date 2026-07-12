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
import { ROUTE_ACCESS } from './rbac/permissions';

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
            
            <Route 
              path="dashboard" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.dashboard}>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="vehicles" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.vehicles}>
                  <VehiclesList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="drivers" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.drivers}>
                  <DriversList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="trips" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.trips}>
                  <TripsList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="maintenance" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.maintenance}>
                  <MaintenanceList />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="expenses" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.expenses}>
                  <FuelExpenses />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="reports" 
              element={
                <ProtectedRoute allowedRoles={ROUTE_ACCESS.reports}>
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
