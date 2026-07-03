import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate, 
  useLocation,
  Outlet, 
  useNavigate
} from 'react-router-dom';
import { HeaderHome, Footer } from '@components';
import Header from "./components/Header";
import MainLayout from "./components/MainLayout";
import DriverLayout from "./components/driver/DriverLayout";
import ProtectedDriverRoute from "./components/driver/ProtectedDriverRoute";
import { UserProvider } from './context/UserContext';
import { NotificationProvider, NotificationDisplay } from './context/NotificationContext';
import { NavigationProvider } from './context/NavigationContext';
import { auth, db } from './config/firebase';
import { getAuth } from 'firebase/auth';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getUserDocument } from './config/functions';
import TestRideRequest from './components/TestRideRequest';
import { 
  Home, 
  About, 
  Contact, 
  Blog, 
  Register, 
  NotFound, 
  SiteMap, 
  PdfHome, 
  NotAuthorized, 
  LocalTransferPage, 
  BookingStatus 
} from "@pages";
import BookingPage from "./components/BookingPage";
import DriverDashboard from './pages/driver/DriverDashboard';
import RideRequests from './pages/driver/RideRequests';
import UpcomingTrips from './pages/driver/UpcomingTrips';
import TripHistory from './pages/driver/TripHistory';
import InterestedRoutes from './pages/driver/InterestedRoutes';
import Earnings from './pages/driver/Earnings';
import Profile from './pages/driver/Profile';
import Settings from './pages/driver/Settings';
import NewLogin from "./pages/NewLogin";
import DriverSignup from "./pages/DriverSignup";
import AccountPending from "./pages/AccountPending";
import { 
  AEditPacakge, 
  ANewPacakge, 
  AdminHolidayHome, 
  AdminHolidayPackages, 
  ALogin, 
  AHolidayData, 
  ANavBar, 
  Admin 
} from '@admin';
import { 
  LocationDetails, 
  LocationInfo, 
  BookNow, 
  BookingCompleted, 
  HolidayForm, 
  FileUpload 
} from "@holiday";
import VehiclePage from './components/VehiclePage';
import VehicleRateAdmin from './components/VehicleRateAdmin';
import BookingForm from './components/BookingForm';
import BookingTester from './components/BookingTester';
import FirestoreTestPage from './components/FirestoreTestPage';
import OutstationPage from './components/OutstationPage';
import Packages  from './components/Packages';
import CarForHolidayPage from './components/CarForHolidayPage';
import { Search } from 'lucide-react';
import SearchHolidaysPage from './components/SearchHolidaysPage';


// Custom hook for authentication state
function useAuthState() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const userDocCache = useRef(null);
  const authCheckInProgress = useRef(false);

  const fetchUserData = useCallback(async (user) => {
    console.log('fetchUserData called with user:', user?.uid);
    
    if (!user) {
      console.log('No user, setting userData to null');
      if (isMounted.current) {
        setUserData(null);
        setLoading(false);
      }
      // Clear any cached data when no user is present
      sessionStorage.removeItem('driver_redirect');
      return null;
    }
    
    // Check if this is a driver redirect
    const isDriverRedirect = sessionStorage.getItem('driver_redirect') === 'true';
    if (isDriverRedirect) {
      console.log('Driver redirect detected, forcing refresh');
      sessionStorage.removeItem('driver_redirect');
      window.location.href = '/driver-dashboard';
      return null;
    }

    if (authCheckInProgress.current) {
      console.log('Auth check already in progress, skipping');
      return userDocCache.current; // Return cached data if available
    }
    
    console.log('Starting auth check for user:', user.uid);
    authCheckInProgress.current = true;
    
    // Set loading to true when starting to fetch
    if (isMounted.current) {
      setLoading(true);
    }

    try {
      console.log('Fetching fresh user data for:', user.uid);
      const userDoc = await getUserDocument(user.uid);
      console.log('Retrieved user document:', userDoc);
      
      if (!isMounted.current) return null;

      // Ensure we have a normalized user object
      const normalizedUser = userDoc ? {
        ...userDoc,
        uid: user.uid, // Ensure uid is always set
        role: (userDoc.role || userDoc.type || 'user').toLowerCase().trim(),
        status: userDoc.status || 'active' // Ensure status has a default
      } : null;
      
      userDocCache.current = normalizedUser;

      if (isMounted.current) {
        console.log('Setting user data:', normalizedUser);
        setUserData(normalizedUser);
        setLoading(false);
      }
      return normalizedUser;
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (isMounted.current) {
        setLoading(false);
        // Only clear data if there was an actual error, not just missing document
        if (error.code !== 'not-found') {
          setUserData(null);
          userDocCache.current = null;
        }
      }
      return null;
    } finally {
      if (isMounted.current) {
        authCheckInProgress.current = false;
      }
    }
  }, []);

  // Handle authentication state changes
  useEffect(() => {
    console.log('Setting up auth state listener');
    
    const handleAuthStateChanged = async (user) => {
      console.log('Auth state changed:', user ? `User ${user.uid}` : 'No user');
      if (user) {
        await fetchUserData(user);
      } else if (isMounted.current) {
        console.log('No user, clearing auth state');
        setUserData(null);
        setLoading(false);
        userDocCache.current = null;
      }
    };

    // Initial check with current user
    const currentUser = auth.currentUser;
    console.log('Initial auth check, current user:', currentUser?.uid || 'none');
    handleAuthStateChanged(currentUser);

    // Subscribe to auth state changes
    const unsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);

    // Cleanup
    return () => {
      console.log('Cleaning up auth state listener');
      isMounted.current = false;
      unsubscribe();
    };
  }, [fetchUserData]);

  return { userData, loading };
}

// Protected Route Component
const ProtectedRoute = React.memo(({ children, requiredRole = null }) => {
  const { userData, loading } = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);
  const [authChecked, setAuthChecked] = useState(false);
  const authCheckComplete = useRef(false);

  const currentUser = auth.currentUser;
  
  // Get user data safely with fallbacks
  const userRole = userData ? (userData.role || userData.type || 'user').toLowerCase().trim() : 'guest';
  const userStatus = userData?.status || 'active';
  const requiredRoleLower = requiredRole ? requiredRole.toLowerCase().trim() : null;
  const currentPath = location.pathname;
  const isDriverRoute = currentPath.startsWith('/driver-dashboard');

  // Handle authentication and authorization
  useEffect(() => {
    let isMounted = true;
    let authCheckTimeout;
    
    const checkAuth = async () => {
      if (loading) {
        // If still loading, wait a bit and try again
        authCheckTimeout = setTimeout(checkAuth, 100);
        return;
      }
      
      // If no user is logged in, redirect to login
      if (!currentUser) {
        // Give auth state a moment to update
        if (loading) {
          authCheckTimeout = setTimeout(checkAuth, 100);
          return;
        }
        
        if (!hasNavigated.current) {
          console.log('No authenticated user found, redirecting to login');
          hasNavigated.current = true;
          navigate('/login', { 
            state: { 
              from: location.pathname,
              message: 'Please log in to access this page' 
            },
            replace: true 
          });
        }
        return;
      }

      // For driver dashboard access
      if (isDriverRoute) {
        if (userRole === 'driver' || userRole === 'drivers') {
          console.log('Driver accessing dashboard');
          try {
            await updateDoc(doc(db, 'users', currentUser.uid), {
              status: 'active',
              lastActive: serverTimestamp()
            });
            authCheckComplete.current = true;
            setAuthChecked(true);
          } catch (error) {
            console.error('Error updating driver status:', error);
            authCheckComplete.current = true;
            setAuthChecked(true); // Still allow access if update fails
          }
          return;
        } else {
          console.log('Non-driver trying to access driver dashboard');
          if (!hasNavigated.current) {
            hasNavigated.current = true;
            navigate('/', { replace: true });
          }
          return;
        }
      }

      // Role-based access control for other protected routes
      if (requiredRoleLower && userRole !== requiredRoleLower) {
        console.log(`Access denied: ${userRole} cannot access ${requiredRoleLower} route`);
        if (!hasNavigated.current) {
          hasNavigated.current = true;
          // Redirect drivers to their dashboard if they try to access other protected routes
          if (userRole === 'driver' || userRole === 'drivers') {
            navigate('/driver-dashboard', { replace: true });
          } else {
            navigate('/', { replace: true });
          }
        }
        return;
      }

      // If we get here, the user is authorized
      authCheckComplete.current = true;
      setAuthChecked(true);
    };

    checkAuth();

    return () => {
      isMounted = false;
      if (authCheckTimeout) {
        clearTimeout(authCheckTimeout);
      }
    };
  }, [
    currentUser, 
    userRole, 
    userStatus,
    requiredRoleLower, 
    location.pathname,
    location.state,
    navigate, 
    loading,
    isDriverRoute
  ]);

  // Show loading state while checking auth
  if (loading || !authCheckComplete.current) {
    // If we're already on the login page, don't show loading to prevent flicker
    if (location.pathname === '/login') {
      return null;
    }
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If we've made it here, the user is authorized to access the route
  return children;
});

// Helper component
const InitialRedirect = ({ userData }) => {
  return <Home />;
};

// Wrapper for route
const InitialRedirectWrapper = () => {
  return (
    <ProtectedRoute>
      <InitialRedirect />
    </ProtectedRoute>
  );
};

// Providers
const AppProviders = ({ children }) => (
  <NotificationProvider>
    <NavigationProvider>
      <UserContextProvider>
        {children}
      </UserContextProvider>
    </NavigationProvider>
  </NotificationProvider>
);

// Root layout component is now imported from './layouts'

// Error boundary
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by error boundary:', error, errorInfo);
  }

  resetErrorBoundary = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback({ 
          error: this.state.error, 
          resetErrorBoundary: this.resetErrorBoundary 
        });
      }

      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center p-6">
            <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={this.resetErrorBoundary}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.defaultProps = {
  fallback: null
};

// Wrap with providers
const AppLayout = () => (
  <UserProvider>
    <NotificationProvider>
      <NavigationProvider>
        <MainLayout>
          <Outlet />
        </MainLayout>
      </NavigationProvider>
    </NotificationProvider>
  </UserProvider>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    errorElement: (
      <UserProvider>
        <NotificationProvider>
          <NavigationProvider>
            <MainLayout>
              <ErrorBoundary fallback={({ error, resetErrorBoundary }) => (
                <div className="min-h-screen flex items-center justify-center">
                  <div className="text-center p-6 max-w-md mx-auto bg-white rounded-lg shadow-lg">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h2>
                    <p className="text-gray-700 mb-4">{error.message}</p>
                    <button
                      onClick={resetErrorBoundary}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      Try again
                    </button>
                  </div>
                </div>
              )}>
                <Outlet />
              </ErrorBoundary>
            </MainLayout>
          </NavigationProvider>
        </NotificationProvider>
      </UserProvider>
    ),
              </button>
            </div>
          </div>
        )}>
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-red-600 mb-4">Page Error</h2>
              <p className="text-gray-700">An error occurred while loading this page.</p>
            </div>
          </div>
              </ErrorBoundary>
            </MainLayout>
          </NavigationProvider>
        </NotificationProvider>
      </UserProvider>
    ),
    children: [
      // Public routes
      { 
        index: true, 
        element: <Home /> 
      },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "blog", element: <Blog /> },
      { path: "register", element: <Register /> },
      { path: "sitemap", element: <SiteMap /> },
      { path: "pdf", element: <PdfHome /> },
      { path: "not-authorized", element: <NotAuthorized /> },
      { path: "local-transfer", element: <LocalTransferPage /> },
      { path: "booking-status", element: <BookingStatus /> },
      {
        path: "driver",
        children: [
          {
            element: (
              <ErrorBoundary>
                <ProtectedDriverRoute />
              </ErrorBoundary>
            ),
            children: [
              {
                path: "dashboard",
                element: (
                  <DriverLayout>
                    <DriverDashboard />
                  </DriverLayout>
                ),
              },
              {
                path: "test-request",
                element: (
                  <DriverLayout>
                    <TestRideRequest />
                  </DriverLayout>
                )
              },
              {
                path: "requests",
                element: (
                  <DriverLayout>
{{ ... }}
                    <RideRequests />
                  </DriverLayout>
                )
              },
              {
                path: "upcoming",
                element: (
                  <DriverLayout>
                    <UpcomingTrips />
                  </DriverLayout>
                )
              },
              {
                path: "history",
                element: (
                  <DriverLayout>
                    <TripHistory />
                  </DriverLayout>
                )
              },
              {
                path: "routes",
                element: (
                  <DriverLayout>
                    <InterestedRoutes />
                  </DriverLayout>
                )
              },
              {
                path: "earnings",
                element: (
                  <DriverLayout>
                    <Earnings />
                  </DriverLayout>
                )
              },
              {
                path: "profile",
                element: (
                  <DriverLayout>
                    <Profile />
                  </DriverLayout>
                )
              },
              {
                path: "settings",
                element: (
                  <DriverLayout>
                    <Settings />
                  </DriverLayout>
                )
              }
            ]
          }
        ]
      },
      {
        path: "sitemap",
        element: <SiteMap />
      },
      {
        path: "location/:locate",
        element: <LocationInfo />
      },
      {
        path: "about",
        element: <About />
      },

       {
        path: "outstation",
        element: <OutstationPage />
      },
      {
        path: "contact",
        element: <Contact />
      },
      {
        path: "blog",
        element: <Blog />
      },
      {
        path: "BookNow",
        element: <BookNow location_id={"324532242"} />
      },
      {
        path: "locationdetails",
        element: <LocationDetails />
      },

      
      {
        path: "search-holidays",
        element: <SearchHolidaysPage />
      },
      {
        path: "carforholidays",
        element: <CarForHolidayPage />
      },
               {
        path: "booking-form",
        element: <BookingForm/>
      },
      {
        path: "booking-page",
        element: <BookingPage />
      },
      {
        path: "local-pickup",
        element: <LocalTransferPage />
      },
      {
        path: "driver-signup",
        element: <DriverSignup />
      },
      {
        path: "firestore-test",
        element: <FirestoreTestPage />
      },
      {
        path: "booking-tester",
        element: <BookingTester />
      },
      {
        path: "login",
        element: <NewLogin />
      },
      {
        path: "register",
        element: <Register />
      },
      {
        path: "vehicles",
        element: (
          <>
            <HeaderHome />
            <VehiclePage />
            <Footer />
          </>
        )
      },
      {
        path: "vehicleadmin",
        element: <VehicleRateAdmin/>
      },
      {
        path:"packages",
        element:<Packages />

      },
      {
        path: "driver-dashboard",
        element: <Navigate to="/driver/dashboard" replace />
      },
      // Authentication routes
      { 
        path: "login", 
        element: <NewLogin /> 
      },
      // Account pending page removed - direct access to dashboards enabled
      { 
        path: "driver-signup", 
        element: <DriverSignup /> 
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute requiredRole="admin">
            <Admin />
          </ProtectedRoute>
        ),
        children: [
          { index: true, element: <AdminHolidayHome /> },
          { path: "holiday-packages", element: <AdminHolidayPackages /> },
          { path: "holiday-packages/new", element: <ANewPacakge /> },
          { path: "holiday-packages/edit/:id", element: <AEditPacakge /> },
          { path: "login", element: <ALogin /> },
          { path: "holiday-data", element: <AHolidayData /> },
          { path: "navbar", element: <ANavBar /> },
          { path: "vehicles", element: <VehiclePage /> },
          { path: "vehicle-rates", element: <VehicleRateAdmin /> },
          { path: "bookings", element: <BookingPage /> },
          { path: "booking-tester", element: <BookingTester /> },
          { path: "firestore-test", element: <FirestoreTestPage /> }
        ]
      },
      {
        path: "holiday",
        children: [
          { path: "location/:locate", element: <LocationInfo /> },
          { path: "location/:locate/details", element: <LocationDetails /> },
          { path: "book-now", element: <BookNow /> },
          { path: "booking-completed", element: <BookingCompleted /> },
          { path: "form", element: <HolidayForm /> },
          { path: "file-upload", element: <FileUpload /> }
        ]
      },
      { path: "pdftest2", element: <FileUpload /> },
      { path: "*", element: <NotFound /> }
    ]
  }
], {
  future: {
    v7_normalizeFormMethod: true,
    v7_relativeSplatPath: true,
    v7_startTransition: true
  }
});

export default function AppRouter() {
  return <RouterProvider router={router} />;
}

export { useAuthState };