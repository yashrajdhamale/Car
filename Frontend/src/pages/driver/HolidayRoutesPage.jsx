import React from 'react';
import { useUser } from '../../context/UserContext';
import HolidayRoutesSection from './components/HolidayRoutesSection';
import Sidebar from '../../components/driver/Sidebar';
import HeaderHome from '../../components/HeaderHome';

// Static cities data (you can fetch this from your API)
const cities = [
  'Mumbai', 'Pune', 'Goa', 'Delhi', 'Bangalore', 
  'Hyderabad', 'Chennai', 'Kolkata', 'Jaipur', 'Udaipur',
  'Shimla', 'Manali', 'Ooty', 'Munnar', 'Darjeeling'
];

const HolidayRoutesPage = () => {
  const { user } = useUser();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <HeaderHome onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      
      <div className="flex h-full">
        {/* Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          onToggle={setSidebarOpen}
          collapsed={sidebarCollapsed}
          onCollapseChange={setSidebarCollapsed}
        />

        {/* Main content */}
        <div className={`flex-1 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-900">Holiday Routes</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your holiday packages and routes
                </p>
              </div>

              <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
                <HolidayRoutesSection 
                  driverId={user.uid} 
                  cities={cities} 
                />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HolidayRoutesPage;
