import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

export const Layout = () => {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-mint-bg">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main workspace container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar header */}
        <Topbar />

        {/* Dynamic page workspace */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
