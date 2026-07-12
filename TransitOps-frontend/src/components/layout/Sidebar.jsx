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
import { getVisibleNavItems } from '../../rbac/permissions';

export const Sidebar = () => {
  const { user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);

  const navIconMap = {
    Dashboard: LayoutDashboard,
    Vehicles: Truck,
    Drivers: Users,
    Trips: Map,
    Maintenance: Wrench,
    'Fuel & Expenses': Receipt,
    'Reports & Analytics': BarChart3
  };

  const navItems = getVisibleNavItems(user?.role).map((item) => ({
    ...item,
    icon: navIconMap[item.name] || LayoutDashboard
  }));

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
        {navItems.map((item) => {
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
