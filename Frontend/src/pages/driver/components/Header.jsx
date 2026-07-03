// src/pages/driver/Header.jsx
import React, { memo, useState } from "react";
import { Menu } from "lucide-react";

const Header = memo(({ driverName, onMenuClick }) => {
  const [isOnline, setIsOnline] = useState(true);

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              type="button"
              onClick={onMenuClick}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <Menu className="block h-6 w-6" aria-hidden="true" />
            </button>
            <h1 className="text-xl font-bold text-gray-900 ml-2 md:ml-0">
              Driver Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-medium text-gray-700">
                Welcome back, <span className="font-semibold">{driverName}</span>
              </p>
            </div>
            <button
              onClick={() => setIsOnline(!isOnline)}
              className={`px-3 py-1.5 text-xs md:text-sm font-semibold text-white rounded-full transition-colors duration-200 ${
                isOnline 
                  ? "bg-emerald-500 hover:bg-emerald-600" 
                  : "bg-gray-500 hover:bg-gray-600"
              }`}
            >
              {isOnline ? "ONLINE 🟢" : "OFFLINE 🔴"}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
});

Header.displayName = 'Header';
export default Header;
