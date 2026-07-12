import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LogOut, User as UserIcon } from 'lucide-react';
import { getRoleLabel } from '../../rbac/permissions';

export const Topbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  // Get dynamic title based on active path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard Analytics';
    if (path.startsWith('/vehicles')) return 'Vehicle Registry';
    if (path.startsWith('/drivers')) return 'Driver Management';
    if (path.startsWith('/trips')) return 'Trip Management';
    if (path.startsWith('/maintenance')) return 'Maintenance Logs';
    if (path.startsWith('/expenses')) return 'Fuel & Expenses';
    if (path.startsWith('/reports')) return 'Reports & Analytics';
    return 'TransitOps';
  };

  return (
    <header className="bg-sage-nav border-b border-gray-200 h-16 px-6 flex items-center justify-between select-none">
      {/* Page Title */}
      <h1 className="text-xl font-bold text-on-surface m-0 tracking-tight leading-none">
        {getPageTitle()}
      </h1>

      {/* Profile & Actions */}
      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3 pr-4 border-r border-gray-300">
            {/* User Details */}
            <div className="text-right">
              <p className="text-sm font-semibold text-on-surface leading-tight">
                {user.name}
              </p>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">
                {user.email}
              </p>
            </div>

            {/* Role Badge */}
            <span className="bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
              {getRoleLabel(user.role)}
            </span>

            {/* Profile Avatar */}
            <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/25">
              <UserIcon className="h-4.5 w-4.5" />
            </div>
          </div>
        )}

        {/* Logout Button */}
        <button
          onClick={logout}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-error hover:bg-error-container hover:text-on-error-container transition-colors duration-200 cursor-pointer"
          title="Sign Out"
        >
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};
