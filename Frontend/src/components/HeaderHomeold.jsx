import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn, LogOut, Menu, X, User, ChevronDown, ChevronRight } from "lucide-react";
import { auth, db } from "@config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useNotification } from "../context/NotificationContext";
import logoimg from "../assets/images/cabroute.png";

// Menu Items
const menuItems = [
  { name: "Home", href: "/" },
  { name: "Airport Transfer", href: "/local-pickup" },
  { name: "Outstation", href: "/outstation" },
  { name: "Car For Holidays", href: "/search-holidays" },
  { name: "International Car Search", href: "/international" },
  { name: "Contact", href: "/contact" },
];

const HeaderHome = () => {
  const { addNotification } = useNotification();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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
        return "/";
    }
  };

  // Close mobile menu when a navigation item is clicked
  const handleMobileNav = (e, link) => {
    setIsMenuOpen(false);
    handleNavigation(e, link);
  };

  return (
    <header className="w-full fixed top-0 left-0 right-0 z-50 bg-brown-600 shadow-md">
      <div className="container mx-auto px-4 h-16 md:h-20 flex items-center">
        {/* Mobile Menu Button */}
        <div
          className="fixed inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />
        <div
          className="fixed inset-0 z-50 flex justify-end"
        >
          <div
            className={`w-72 h-full bg-white shadow-lg p-6 transform transition-transform duration-300 ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="flex justify-between items-center mb-6">
              <img
                src="/assets/images/logo_travelog.png"
                alt="Travelog Logo"
                className="h-10"
              />
              <button onClick={() => setIsMenuOpen(false)}>
                <X className="h-6 w-6 text-gray-700" />
              </button>
            </div>
            <nav className="flex flex-col gap-3">
              {menuItems.map((item, idx) => (
                <Link
                  key={idx}
                  to={item.href}
                  onClick={(e) => {
                    setIsMenuOpen(false);
                    handleNavigation(e, item.href);
                  }}
                  className={`px-4 py-2 rounded-md font-medium ${
                    location.pathname === item.href
                      ? "bg-orange-50 text-orange-600"
                      : "hover:bg-orange-50 hover:text-orange-600"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>

            <div className="mt-auto pt-6 border-t">
              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md"
                >
                  <LogOut className="h-5 w-5" />
                  Logout
                </button>
              ) : (
                <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                  <button className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 border border-orange-600 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors">
                    <LogIn className="h-5 w-5" />
                    Login
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>
        {/* Logo */}
        <div className="flex-1 flex justify-center lg:justify-start px-4">
          <button 
            onClick={() => navigate("/")}
            className="p-1 rounded-full transition-colors hover:bg-brown-500"
          >
            <img
              src={logoimg}
              alt="Logo"
              className="h-10 md:h-12 w-auto object-contain"
            />
          </button>
        </div>

        {/* Desktop Menu */}
        <nav className="hidden lg:flex space-x-2 xl:space-x-4">
          {menuItems.map((item, idx) => (
            <Link
              key={idx}
              to={item.href}
              onClick={(e) => handleNavigation(e, item.href)}
              className={`px-3 py-2 text-sm xl:text-base rounded-full font-medium transition-colors whitespace-nowrap ${
                location.pathname === item.href
                  ? "bg-brown-700 text-white"
                  : "text-white hover:bg-brown-700 hover:text-white"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>

        {/* Right Section */}
        <div className="flex items-center justify-end px-2 md:px-4">
          {user ? (
            <div className="relative">
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center mb-6">
            <img
              src="/assets/images/logo_travelog.png"
              alt="Travelog Logo"
              className="h-10"
            />
            <button onClick={() => setIsMenuOpen(false)}>
              <X className="h-6 w-6 text-gray-700" />
            </button>
          </div>
          <nav className="flex flex-col gap-3">
            {menuItems.map((item, idx) => (
              <Link
                key={idx}
                to={item.href}
                onClick={(e) => {
                  setIsMenuOpen(false);
                  handleNavigation(e, item.href);
                }}
                className={`px-4 py-2 rounded-md font-medium ${
                  location.pathname === item.href
                    ? "bg-orange-50 text-orange-600"
                    : "hover:bg-orange-50 hover:text-orange-600"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-6 border-t">
            {user ? (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-md"
              >
                <LogOut className="h-5 w-5" />
                Logout
              </button>
            ) : (
              <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                <button className="w-full flex items-center justify-center gap-2 bg-white text-orange-600 border border-orange-600 hover:bg-gray-50 px-4 py-2 rounded-md transition-colors">
                  <LogIn className="h-5 w-5" />
                  Login
                </button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default HeaderHome;



