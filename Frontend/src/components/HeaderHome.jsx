import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, X, ChevronDown, Car, History } from "lucide-react";
import { auth, db } from "@config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNotification } from "../context/NotificationContext";
import logoimg from "../assets/images/cabroute.png";
import { Capacitor } from '@capacitor/core';

// Menu Items
const guestMenuItems = [
  { name: "Home", href: "/", icon: null },
  { name: "Local Pickup", href: "/pickup", icon: <Car size={16} /> },
  { name: "Airport Transfer", href: "/local-pickup", icon: <Car size={16} /> },
  { name: "Outstation", href: "/outstation", icon: null },
  { name: "Car For Holidays", href: "/search-holidays", icon: null },
  { name: "International Car Search", href: "/international", icon: null },
  { name: "Contact", href: "/contact", icon: null },
];

const userMenuItems = [
  { name: "Home", href: "/", icon: null },
  { name: "Local Pickup", href: "/pickup", icon: <Car size={16} /> },
  { name: "Airport Transfer", href: "/local-pickup", icon: <Car size={16} /> },
  { name: "Outstation", href: "/outstation", icon: null },
  { name: "Car For Holidays", href: "/search-holidays", icon: null },
  { name: "International Car Search", href: "/international", icon: null },
  { name: "My Bookings", href: "/user-dashboard", icon: <History size={16} /> },
  { name: "Contact", href: "/contact", icon: null },
];

const HeaderHome = () => {
  const { addNotification } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  const menuItems = user ? userMenuItems : guestMenuItems;
  const isApp = Capacitor.isNativePlatform();

  // Auth Listener
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const defaultUserData = {
          displayName:
            currentUser.displayName ||
            currentUser.email?.split("@")[0] ||
            "User",
          role: "customer",
          status: "active",
        };
        setUserData(defaultUserData);

        try {
          // First try to get user data from the users collection
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              ...data,
              displayName:
                currentUser.displayName ||
                data.displayName ||
                defaultUserData.displayName,
              role: (data.role || data.type || defaultUserData.role).toLowerCase(),
              status: data.status || defaultUserData.status,
            });
          } else {
            // If not found in users collection, try the drivers collection
            const driverDoc = await getDoc(doc(db, "drivers", currentUser.uid));
            if (driverDoc.exists()) {
              const data = driverDoc.data();
              setUserData({
                ...data,
                displayName:
                  currentUser.displayName ||
                  data.displayName ||
                  data.name ||
                  defaultUserData.displayName,
                role: 'driver',
                status: data.status || defaultUserData.status,
              });
            }
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          // fallback from cache
          const cachedUserData = localStorage.getItem(
            `user_${currentUser.uid}`
          );
          if (cachedUserData) {
            setUserData(JSON.parse(cachedUserData));
          }
        }
      } else {
        setUserData(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Cache user data
  useEffect(() => {
    if (user?.uid && userData) {
      localStorage.setItem(`user_${user.uid}`, JSON.stringify(userData));
    }
  }, [userData, user?.uid]);

  const handleNavigation = (e, link) => {
    e.preventDefault();
    if (link === "/international") {
      addNotification("Coming Soon!!", "warning");
      return;
    }
    navigate(link);
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setUserData(null);
      setIsDropdownOpen(false);
      addNotification("Logged out successfully", "success");
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
      addNotification(error.message, "error");
    }
  };

  const getUserDashboardPath = () => {
    if (!userData) return "/";
    switch (userData.role?.toLowerCase()) {
      case "driver":
        return "/driver-dashboard";
      case "admin":
      case "agency":
      case "travelagency":
        return `/${userData.role}-dashboard`;
      default:
        return "/user-dashboard"; // Changed to user dashboard for regular users
    }
  };

  const handleBookNow = () => {
    navigate('/local-pickup');
  };
  // If running as native app, render bottom tab bar instead of header
if (isApp) {
  return (
    <>
      {/* Top App Bar */}
      <header className="bg-white text-gray-900 shadow-sm fixed w-full z-50 top-0">
        <div className="flex items-center justify-between px-4 py-3" style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}>
          {/* Logo */}
          <button onClick={() => navigate("/")} className="focus:outline-none">
            <img src={logoimg} alt="Logo" className="h-9 w-auto object-contain" />
          </button>

          {/* Location pill (Uber/Ola style) */}
          <button
            onClick={() => navigate('/pickup')}
            className="flex items-center gap-2 bg-gray-100 rounded-full px-4 py-2 text-sm text-gray-600 flex-1 mx-3"
          >
            <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0"></span>
            <span className="truncate">Where do you want to go?</span>
          </button>

          {/* User Avatar */}
          {user ? (
            <button
              onClick={() => navigate(getUserDashboardPath())}
              className="h-9 w-9 rounded-full bg-orange-300 flex items-center justify-center font-semibold text-white flex-shrink-0"
            >
              {userData?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
            </button>
          ) : (
            <button
              onClick={() => navigate('/login')}
              className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0"
            >
              <LogIn size={18} className="text-gray-600" />
            </button>
          )}
        </div>
      </header>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 flex items-center justify-around px-2 py-2 safe-area-bottom">
        {[
          { name: 'Home', href: '/', icon: '🏠' },
          { name: 'Rides', href: '/pickup', icon: '🚗' },
          { name: 'Holidays', href: '/search-holidays', icon: '✈️' },
          { name: 'Bookings', href: '/user-dashboard', icon: '📋' },
          { name: 'Contact', href: '/contact', icon: '💬' },
        ].map((item) => (
          <button
            key={item.href}
            onClick={(e) => handleNavigation(e, item.href)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              location.pathname === item.href
                ? 'text-orange-500'
                : 'text-gray-500'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
    </>
  );
}

  return (
    <header className="bg-brown-800 text-white shadow-md fixed w-full z-50">
      <div className="w-full px-4 py-3 flex items-center">
        {/* Mobile Menu Button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="text-white p-2 rounded-md hover:bg-brown-700 focus:outline-none"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Logo - Always on the left */}
        <div className="flex-shrink-0 mr-4">
          <button 
            onClick={() => navigate("/")}
            className="p-1 rounded-full transition-colors hover:bg-brown-500 focus:outline-none"
          >
            <img
              src={logoimg}
              alt="Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </button>
        </div>

        {/* Desktop Navigation - Left aligned */}
        <nav className="hidden lg:flex items-center space-x-2 xl:space-x-4 ml-4 flex-1">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={`px-3 py-2 text-sm xl:text-base rounded-full font-medium transition-colors whitespace-nowrap flex items-center gap-1 ${
                location.pathname === item.href
                  ? "bg-brown-700 text-white"
                  : "text-white hover:bg-brown-700 hover:text-white"
              }`}
            >
              {item.icon && <span className="mr-1">{item.icon}</span>}
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Actions - Aligned to the right */}
        <div className="flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-3 py-2 bg-white text-brown-700 rounded-lg hover:bg-brown-100 focus:outline-none"
              >
                <div className="h-8 w-8 rounded-full bg-orange-300 flex items-center justify-center font-semibold">
                  {userData?.displayName?.[0]?.toUpperCase() ||
                    user?.email?.[0]?.toUpperCase()}
                </div>
                <span className="hidden md:inline text-sm font-medium">
                  {userData?.displayName || user?.email?.split("@")[0]}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-900">
                      {userData?.displayName || user?.email?.split("@")[0]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1) || 'User'}
                    </p>
                  </div>
                  <div className="py-2">
                    <Link
                      to={getUserDashboardPath()}
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span>📊</span>
                      <span>Dashboard</span>
                    </Link>
                    
                    {/* My Rides Link in Dropdown */}
                    <Link
                      to="/user-dashboard"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <History size={14} />
                      <span>My Rides</span>
                    </Link>
                    
                    <div className="border-t border-gray-100 my-2"></div>
                    
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <LogOut size={14} />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="px-4 py-2 text-sm font-medium text-white bg-brown-700 rounded-lg hover:bg-brown-600 transition-colors whitespace-nowrap"
              >
                Sign In
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 z-40 transition-opacity duration-300 mobile-menu-overlay ${isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} style={{ left: 0, right: 'auto' }}
        onClick={() => setIsMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50" />
        <div
          className={`fixed top-0 left-0 h-full w-4/5 max-w-xs bg-white shadow-xl transform transition-transform duration-300 mobile-drawer ${ isMenuOpen ? 'translate-x-0' : '-translate-x-full' }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-col h-full">
            {/* Mobile Menu Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Menu</h2>
              <button
                onClick={() => setIsMenuOpen(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="h-10 w-10 rounded-full bg-orange-300 flex items-center justify-center font-semibold text-lg">
                    {userData?.displayName?.[0]?.toUpperCase() ||
                      user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {userData?.displayName || user?.email?.split("@")[0]}
                    </p>
                    <p className="text-sm text-gray-500">
                      {userData?.role?.charAt(0).toUpperCase() + userData?.role?.slice(1) || 'User'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Navigation */}
            <nav className="flex-1 overflow-y-auto py-2">
              {menuItems.map((item, idx) => (
                <Link
                  key={`mobile-${idx}`}
                  to={item.href}
                  onClick={(e) => handleNavigation(e, item.href)}
                  className={`flex items-center justify-between px-6 py-3 text-gray-700 hover:bg-gray-50 ${
                    location.pathname === item.href ? 'bg-gray-100 font-medium' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {item.icon && item.icon}
                    <span>{item.name}</span>
                  </div>
                  <ChevronDown size={16} className="text-gray-400 transform -rotate-90" />
                </Link>
              ))}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-gray-200">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderHome;