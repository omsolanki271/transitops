import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  Receipt, 
  BarChart3, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  // Role nav permissions config
  const navItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Vehicles',
      path: '/vehicles',
      icon: Truck,
      allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Drivers',
      path: '/drivers',
      icon: Users,
      allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Trips',
      path: '/trips',
      icon: Map,
      allowedRoles: ['fleet_manager', 'driver', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Maintenance',
      path: '/maintenance',
      icon: Wrench,
      allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst']
    },
    {
      name: 'Fuel & Expenses',
      path: '/expenses',
      icon: Receipt,
      allowedRoles: ['fleet_manager', 'driver', 'financial_analyst']
    },
    {
      name: 'Reports & Analytics',
      path: '/reports',
      icon: BarChart3,
      allowedRoles: ['fleet_manager', 'safety_officer', 'financial_analyst']
    }
  ];

  const filteredNavItems = navItems.filter(item => 
    !user || item.allowedRoles.includes(user.role)
  );

  return (
    <div 
      className={`bg-dark-gray text-white flex flex-col h-screen transition-all duration-300 relative border-r border-gray-800 ${
        isCollapsed ? 'w-16' : 'w-[280px]'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-800 overflow-hidden">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <span className="font-bold text-lg tracking-wider text-surface-bright">TransitOps</span>
          </div>
        )}
        {isCollapsed && (
          <div className="mx-auto bg-primary text-white p-1.5 rounded-lg flex items-center justify-center">
            <ShieldCheck className="h-6 w-6" />
          </div>
        )}
      </div>

      {/* Nav List */}
      <nav className="flex-1 px-2 py-4 space-y-1 select-none overflow-y-auto">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-250 hover:bg-white/10 ${
                  isActive 
                    ? 'bg-white/15 text-primary-fixed-dim font-semibold border-l-4 border-primary' 
                    : 'text-gray-400 hover:text-white'
                }`
              }
            >
              <Icon className="h-6 w-6 shrink-0 stroke-[2px]" />
              {!isCollapsed && (
                <span className="text-sm font-medium leading-none truncate">{item.name}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute bottom-6 -right-3.5 bg-primary text-white hover:bg-primary-container p-1 rounded-full border-2 border-dark-gray shadow-md cursor-pointer transition-colors duration-200"
        title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>
    </div>
  );
};
