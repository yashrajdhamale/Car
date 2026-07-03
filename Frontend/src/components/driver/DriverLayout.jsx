import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const DriverLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const location = useLocation();
  
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.endsWith('/driver') || path.endsWith('/driver/dashboard')) return 'Dashboard';
    if (path.includes('/driver/requests')) return 'Ride Requests';
    if (path.includes('/driver/upcoming')) return 'Upcoming Trips';
    if (path.includes('/driver/history')) return 'Trip History';
    if (path.includes('/driver/routes')) return 'Interested Routes';
    if (path.includes('/driver/earnings')) return 'Earnings';
    if (path.includes('/driver/settings')) return 'Settings';
    return 'Driver Dashboard';
  };
  
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarCollapse = (isCollapsed) => {
    setSidebarCollapsed(isCollapsed);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile sidebar */}
      <div className="fixed inset-0 flex z-40 md:hidden">
        <div
          className={`fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity ${
            sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
        <div
          className={`fixed inset-y-0 left-0 flex flex-col w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          aria-hidden={!sidebarOpen}
        >
          <Sidebar
            isOpen={sidebarOpen}
            onToggle={setSidebarOpen}
            onCollapseChange={setSidebarCollapsed}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className={`flex flex-col ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
          <Sidebar
            isOpen={true}
            onToggle={setSidebarOpen}
            onCollapseChange={setSidebarCollapsed}
            collapsed={sidebarCollapsed}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          pageTitle={getPageTitle()}
          onToggleSidebar={toggleSidebar}
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children || <Outlet />}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DriverLayout;
