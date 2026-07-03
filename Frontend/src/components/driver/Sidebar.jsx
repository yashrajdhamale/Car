import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUser } from "../../context/UserContext";
import { auth } from "../../config/firebase";
import { PaperAirplaneIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  InboxIcon,
  CalendarIcon,
  ClockIcon,
  MapIcon,
  CurrencyDollarIcon,
  UserIcon,
  Cog6ToothIcon as SettingsIcon,
  QuestionMarkCircleIcon as HelpCircle,
  ArrowLeftCircleIcon as ChevronLeft,
  ArrowRightCircleIcon as ChevronRight,
  ArrowRightOnRectangleIcon as LogOut,
  TruckIcon as Car,
  UserCircleIcon,
  DocumentTextIcon,
  PaperAirplaneIcon as AirplaneIcon,
} from "@heroicons/react/24/outline";

/* ---------- SSR-safe window size hook ---------- */
const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({ width: 0 });

  useEffect(() => {
    const handleResize = () => setWindowSize({ width: window.innerWidth || 0 });
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return windowSize;
};

// Base navigation items that will be conditionally shown
// ✅ Accept pathname as a parameter so it's defined here
const getNavItems = (driverId, pathname) => [
  {
    name: "Dashboard", 
    icon: HomeIcon, 
    path: `/driver/dashboard`,
    current: pathname === '/driver/dashboard',
    roles: ['driver', 'admin']
  },
  {
    name: 'Airport Transfers',
    icon: AirplaneIcon,
    path: '/driver/airport-transfers',
    current: pathname === '/driver/airport-transfers',
    roles: ['driver']
  },
  { 
    name: "Ride Requests", 
    icon: InboxIcon, 
    path: `/driver/requests`,
    roles: ['driver'],
    badge: 'new'
  },
  // { 
  //   name: "Airport Transfers", 
  //   icon: AirplaneIcon,
  //   path: `/driver/airport-transfers`,
  //   roles: ['driver'],
  //   badge: 'new'
  // },
  { 
    name: "Upcoming Trips", 
    icon: CalendarIcon, 
    path: `/driver/upcoming`,
    roles: ['driver']
  },
  { 
    name: "Trip History", 
    icon: ClockIcon, 
    path: `/driver/history`,
    roles: ['driver']
  },
  { 
    name: "My Routes", 
    icon: MapIcon, 
    path: `/driver/routes`,
    roles: ['driver', 'admin'],
    active: true
  },
  { 
    name: "Holiday Routes", 
    icon: MapIcon, 
    path: `/driver/holiday-routes`,
    roles: ['driver', 'admin']
  },
  { 
    name: "Earnings", 
    icon: CurrencyDollarIcon, 
    path: `/driver/earnings`,
    roles: ['driver']
  },
  { 
    name: "Profile", 
    icon: UserIcon, 
    path: `/driver/profile`,
    roles: ['driver', 'admin']
  },
  { 
    name: "Settings", 
    icon: SettingsIcon, 
    path: `/driver/settings`,
    roles: ['driver', 'admin']
  },
  { 
    name: "Support", 
    icon: HelpCircle, 
    path: "/support",
    roles: ['driver', 'admin']
  },
  { 
    name: "Terms & Conditions", 
    icon: DocumentTextIcon, 
    path: "/driver/terms",
    roles: ['driver', 'admin']
  },
  { 
    name: "Logout", 
    icon: LogOut, 
    path: "/logout",
    roles: ['driver', 'admin']
  },
].filter(item => item.roles.length === 0 || item.roles.includes('driver')); // Show items with no role restriction or for drivers

// Skeleton loader component for sidebar items
const SidebarSkeleton = ({ count = 1 }) => (
  <div className="space-y-2 px-4 py-2">
    {Array(count).fill(0).map((_, i) => (
      <div key={i} className="h-10 bg-gray-700 rounded-md animate-pulse"></div>
    ))}
  </div>
);

const Sidebar = ({
  isOpen = false,
  onToggle = () => {},
  onCollapseChange = () => {},
  onLogout = () => {},
  collapsed = false,
}) => {
  const { user, userData, loading } = useUser();
  const { width } = useWindowSize();
  const isMobile = width < 768;
  const location = useLocation();
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);
  const [isHydrated, setIsHydrated] = useState(false);
  const pathname = location.pathname;

  // Handle hydration to prevent flash of unstyled content
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // ✅ Now getNavItems receives pathname and can safely use it
  const navItems = getNavItems(user?.uid, pathname);

  const toggleCollapse = () => {
    onCollapseChange(!collapsed);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      if (onLogout) {
        await onLogout();
      } else {
        navigate("/login");
      }
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Fetch unread notifications count
  useEffect(() => {
    if (!user?.uid) return;
    
    const fetchUnreadCount = async () => {
      try {
        // Example: const count = await getUnreadNotificationsCount(user.uid);
        // setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };
    
    fetchUnreadCount();
  }, [user?.uid]);

  // Get user's display name or email
  const displayName = userData?.displayName || 
                     userData?.name || 
                     user?.email?.split('@')[0] || 
                     'Driver';

  const handleNavClick = () => {
    if (isMobile) onToggle?.();
  };

  const handleLogoutClick = async (e) => {
    e.preventDefault();
    handleLogout();
    handleNavClick();
  };

  const sidebarWidthClass = collapsed ? "w-20" : "w-64";

  const sidebarClasses = `
    ${sidebarWidthClass}
    bg-gradient-to-b from-gray-900 to-gray-800 text-gray-100 h-full fixed left-0 top-0 pt-16
    overflow-y-auto border-r border-gray-800 shadow-xl transition-all
    duration-300 ease-in-out z-30 transform-gpu
    ${isMobile ? (isOpen ? "translate-x-0" : "-translate-x-full") : "translate-x-0"}
    ${!isHydrated ? 'opacity-0' : 'opacity-100 transition-opacity duration-200'}
  `;

  const renderNavItems = () => {
    if (loading) {
      return <SidebarSkeleton count={8} />;
    }

    if (!user) {
      return (
        <div className="p-4 text-center text-gray-400">
          Please sign in to view navigation
        </div>
      );
    }

    return navItems.map((item) => {
      const isActive = location.pathname.startsWith(item.path);
      const Icon = item.icon;
      const hasBadge = item.badge || (item.name === 'Ride Requests' && unreadCount > 0);
      
      const itemClass = `
        flex items-center px-4 py-3 rounded-r-lg transition-colors relative group
        ${
          isActive
            ? "bg-gray-800 text-white border-l-4 border-blue-500 shadow-inner"
            : "text-gray-300 hover:bg-gray-800 hover:text-white hover:bg-opacity-80"
        }
        ${item.active ? 'font-medium' : ''}
      `;

      const renderBadge = () => {
        if (item.name === 'Ride Requests' && unreadCount > 0) {
          return (
            <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {unreadCount}
            </span>
          );
        }
        return null;
      };

      if (item.name === "Logout") {
        return (
          <button
            key={item.name}
            onClick={handleLogout}
            className={`w-full text-left ${itemClass}`}
          >
            <Icon className="h-5 w-5 flex-shrink-0" />
            {!collapsed && (
              <span
                className={`ml-3 font-medium transition-opacity duration-200 ${
                  collapsed ? "opacity-0" : "opacity-100"
                }`}
              >
                {item.name}
              </span>
            )}
            {collapsed && (
              <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition">
                {item.name}
              </span>
            )}
          </button>
        );
      }

      return (
        <Link
          key={item.name}
          to={item.path}
          onClick={handleNavClick}
          className={itemClass}
          title={collapsed ? item.name : ""}
        >
          <div className="relative">
            <Icon className="h-5 w-5 flex-shrink-0" />
            {hasBadge && (
              <span className="absolute -top-1 -right-1 h-2 w-2 bg-red-500 rounded-full"></span>
            )}
          </div>
          {!collapsed && (
            <div className="flex items-center flex-1">
              <span
                className={`ml-3 transition-opacity duration-200 ${
                  collapsed ? "opacity-0" : "opacity-100"
                }`}
              >
                {item.name}
              </span>
              {renderBadge()}
            </div>
          )}
          {collapsed && (
            <span className="absolute left-full ml-2 px-2 py-1 rounded bg-gray-800 text-white text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition z-50">
              {item.name}
              {hasBadge && (
                <span className="ml-1 bg-red-500 text-white text-xs px-1 rounded-full">
                  {item.badge || unreadCount}
                </span>
              )}
            </span>
          )}
          {isActive && collapsed && (
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-blue-500 rounded-r" />
          )}
        </Link>
      );
    });
  };

  if (loading) {
    return (
      <div className={`fixed top-0 left-0 h-full bg-gray-900 text-white z-30 ${
        collapsed ? 'w-16' : 'w-64'
      } flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="md:relative">
      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20"
          onClick={onToggle}
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 left-0 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white transition-all duration-300 ease-in-out z-30 flex flex-col ${
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${collapsed ? "w-16" : "w-64"}`}
        style={{
          boxShadow: "2px 0 10px rgba(0, 0, 0, 0.1)",
        }}
        aria-hidden={isMobile && !isOpen}
      >
        {/* Collapse toggle */}
        {!isMobile && (
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-20 bg-gray-800 rounded-full p-1.5 text-white shadow-lg hover:bg-blue-600 transition-colors z-40"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        )}

        <div className="flex-1 overflow-y-auto">
          {/* Logo/Brand */}
          <div className="p-4 border-b border-gray-700">
            {!collapsed ? (
              <div className="mb-4 mt-2">
                <h2 className="text-2xl font-bold flex items-center">
                  <span className="bg-blue-600 p-2 rounded-lg mr-3 shadow">
                    <Car className="h-6 w-6" />
                  </span>
                  {userData?.role === 'admin' ? 'Admin' : 'Driver'} Panel
                </h2>
                {!collapsed && user?.email && (
                  <p className="text-xs text-gray-400 mt-1 truncate">{user.email}</p>
                )}
              </div>
            ) : (
              <div className="flex justify-center py-4">
                <Car className="h-6 w-6 text-blue-400" />
              </div>
            )}

            <nav 
              role="navigation" 
              aria-label="Main navigation" 
              className="space-y-1 mt-4"
            >
              {renderNavItems()}
            </nav>
          </div>
        </div>

        {/* User Profile */}
        {!collapsed && user && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-gray-700 flex items-center justify-center">
                <UserCircleIcon className="h-8 w-8 text-gray-300" />
              </div>
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium text-white truncate">
                  {displayName}
                </p>
                <p className="text-xs text-gray-400">
                  {userData?.role === 'admin' ? 'Administrator' : 'Driver'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="mt-3 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
