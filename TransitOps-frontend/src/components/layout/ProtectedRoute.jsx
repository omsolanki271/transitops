import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isRoleAllowed, normalizeRole } from '../../rbac/permissions';

export const ProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    // Redirect to login page and keep track of prior location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !isRoleAllowed(normalizeRole(user.role), allowedRoles)) {
    // User role is not allowed, redirect to main dashboard
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
