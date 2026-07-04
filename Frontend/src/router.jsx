import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider, 
  Navigate, 
  useLocation, 
  Outlet, 
  useNavigate 
} from 'react-router-dom';
import { HeaderHome } from '@components';
import MainLayout from "./components/MainLayout";
import DriverLayout from "./components/driver/DriverLayout";
import ProtectedDriverRoute from "./components/driver/ProtectedDriverRoute";
import { UserProvider } from './context/UserContext';
import { NotificationProvider } from './context/NotificationContext';
import { NavigationProvider } from './context/NavigationContext';
import { auth, db } from './config/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { getUserDocument } from './config/functions';
import TestRideRequest from './components/TestRideRequest';
import Home from './pages/Home';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import SiteMap from './pages/SiteMap';
import PdfHome from './pages/PdfHome';
import NotAuthorized from './pages/NotAuthorized';
import LocalTransferPage from './pages/LocalTransferPage';
import BookingStatus from './pages/BookingStatus';
import BookingPage from './pages/BookingPage';
import Admin from './admin/Admin';
import AEditPacakge from './admin/AEditPacakge';
import ANewPacakge from './admin/ANewPacakge';
import AdminHolidayHome from './admin/AdminHolidayHome';
import AdminHolidayPackages from './admin/AdminHolidayPackages';
import ALogin from './admin/ALogin';
import AHolidayData from './admin/AHolidayData';
import ANavBar from "./admin/components/ANavBar";
import FindDriverPage from './pages/FindDriverPage';
import AirportTransferRequests from './pages/driver/AirportTransferRequests';
import PaymentPage from './pages/PaymentPage.jsx';
import TrackRidepage from './pages/TrackRidepage.jsx';
import LocalPickupPage from './modules/localPickup';
import OutstationBooking from "./components/OutstationBooking";
import DriverDashboard from './pages/driver/DriverDashboard.jsx';
import InterestedRoutes from './pages/driver/InterestedRoutes';
import HolidayRoutesPage from './pages/driver/HolidayRoutesPage';
import DriverProfile from './pages/driver/DriverProfile';
import NewLogin from "./pages/NewLogin";
import { 
  LocationDetails, LocationInfo, BookNow, BookingCompleted, 
  HolidayForm, FileUpload 
} from "@holiday";
import VehiclePage from './components/VehiclePage';
import FirestoreTestPage from './components/FirestoreTestPage';
import OutstationPage from './components/OutstationPage';
import Packages from './components/Packages';
import BookingForm from './components/BookingForm';
import CarForHolidayPage from './components/CarForHolidayPage';
import { Search } from 'lucide-react';
import SearchHolidaysPage from './components/SearchHolidaysPage';
import DriverSignup from './pages/DriverSignup';
import TermsAndConditions from './pages/driver/TermsAndConditions';
import Holidaybookpage from './components/Holidaybookpage';
import BookingTester from './components/BookingTester';
import VehicleRateAdmin from './components/VehicleRateAdmin';
import Payment from './components/Payment';
import UserDashboard from './pages/UserDashboard';
import BookingDetails from './pages/BookingDetails';
import DebugFirestore from './pages/DebugFirestore.js';
import OutstationTrackingPage from '../src/pages/driver/Outstationtrackingpage.jsx';
import ScheduledRideConfirmation from './components/ScheduledRideConfirmation.js';
import AgencyRegister from './pages/AgencyRegister';
import AgencyLogin from './pages/AgencyLogin';
import AgencyVerifyEmail from './pages/AgencyVerifyEmail';
import AgencyVerifyPhone from './pages/AgencyVerifyPhone';
import AgencyDashboard from './pages/AgencyDashboard';

// ✅ Language Selector
import LanguageSelector from './components/LanguageSelector';


// ---- Custom hook for authentication ----
function useAuthState() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);
  const userDocCache = useRef(null);
  const authCheckInProgress = useRef(false);

  const fetchUserData = useCallback(async (user) => {
    if (!user) {
      if (isMounted.current) {
        setUserData(null);
        setLoading(false);
      }
      sessionStorage.removeItem('driver_redirect');
      return null;
    }

    if (authCheckInProgress.current) return userDocCache.current;

    authCheckInProgress.current = true;
    if (isMounted.current) setLoading(true);

    try {
      const userDoc = await getUserDocument(user.uid);
      const normalizedUser = userDoc ? {
        ...userDoc,
        uid: user.uid,
        role: (userDoc.role || userDoc.type || 'user').toLowerCase().trim(),
        status: userDoc.status || 'active'
      } : null;

      userDocCache.current = normalizedUser;
      if (isMounted.current) {
        setUserData(normalizedUser);
        setLoading(false);
      }
      return normalizedUser;
    } catch (error) {
      console.error('Error fetching user data:', error);
      if (isMounted.current) {
        setLoading(false);
        if (error.code !== 'not-found') {
          setUserData(null);
          userDocCache.current = null;
        }
      }
      return null;
    } finally {
      authCheckInProgress.current = false;
    }
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        await fetchUserData(user);
      } else if (isMounted.current) {
        setUserData(null);
        setLoading(false);
        userDocCache.current = null;
      }
    });

    return () => {
      isMounted.current = false;
      unsubscribe();
    };
  }, [fetchUserData]);

  return { userData, loading };
}

// ---- Protected Route ----
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const { userData, loading } = useAuthState();
  const location = useLocation();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  const currentUser = auth.currentUser;
  const userRole = userData ? (userData.role || 'user').toLowerCase().trim() : 'guest';
  const requiredRoleLower = requiredRole ? requiredRole.toLowerCase().trim() : null;
  const isDriverRoute = location.pathname.startsWith('/driver-dashboard');

  useEffect(() => {
    if (loading) return;

    if (!currentUser) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate('/login', { state: { from: location.pathname }, replace: true });
      }
      return;
    }

    if (isDriverRoute && userRole !== 'driver') {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate('/', { replace: true });
      }
      return;
    }
    
    if (requiredRoleLower && userRole !== requiredRoleLower) {
      if (!hasNavigated.current) {
        hasNavigated.current = true;
        navigate('/', { replace: true });
      }
    }
  }, [currentUser, userRole, requiredRoleLower, location.pathname, loading, isDriverRoute, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  return children;
};

const getAuthenticatedRedirectPath = (userRole) => {
  const normalizedRole = (userRole || '').toLowerCase().trim();

  if (normalizedRole === 'driver') {
    return '/driver/dashboard';
  }

  if (normalizedRole === 'admin') {
    return '/admin';
  }

  if (['agency', 'travelagency', 'travel_agency'].includes(normalizedRole)) {
    return '/agency-dashboard';
  }

  return '/';
};

const GuestRoute = ({ children }) => {
  const { userData, loading } = useAuthState();
  const navigate = useNavigate();
  const hasNavigated = useRef(false);

  const currentUser = auth.currentUser;
  const redirectPath = getAuthenticatedRedirectPath(userData?.role || userData?.type);

  useEffect(() => {
    if (loading) return;

    if (currentUser && !hasNavigated.current) {
      hasNavigated.current = true;
      navigate(redirectPath, { replace: true });
    }
  }, [currentUser, loading, navigate, redirectPath]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-12 w-12 border-t-2 border-b-2 border-blue-500 rounded-full"></div>
      </div>
    );
  }

  if (currentUser) {
    return null;
  }

  return children;
};

// ---- Layout ----
const AppLayout = () => (
  <UserProvider>
    <NotificationProvider>
      <NavigationProvider>
        {/* ✅ Language Selector — fixed top-right, visible on all pages */}
        <LanguageSelector />
        <MainLayout>
          <Outlet />
        </MainLayout>
      </NavigationProvider>
    </NotificationProvider>
  </UserProvider>
);

// ---- Router ----
const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: "about", element: <About /> },
      { path: "contact", element: <Contact /> },
      { path: "blog", element: <Blog /> },
      { path: "register", element: <GuestRoute><Register /></GuestRoute> },
      { path: "sitemap", element: <SiteMap /> },
      { path: "pdf", element: <PdfHome /> },
      { path: "not-authorized", element: <NotAuthorized /> },
      { path: "local-transfer", element: <LocalTransferPage /> },
      { path: "booking-status", element: <BookingStatus /> },

      // Driver routes
      {
        path: "driver",
        children: [
          { index: true, element: <Navigate to="dashboard" replace /> },
          { path: "dashboard", element: <DriverLayout><DriverDashboard /></DriverLayout> },
          { path: "profile", element: <DriverLayout><DriverProfile /></DriverLayout> },
          { path: "routes", element: <DriverLayout><InterestedRoutes /></DriverLayout> },
          { path: "holiday-routes", element: <DriverLayout><HolidayRoutesPage /></DriverLayout> },
          { path: "test-request", element: <DriverLayout><TestRideRequest /></DriverLayout> },
          { 
            path: "airport-transfers", 
            element: (
              <DriverLayout>
                <ProtectedRoute requiredRole="driver">
                  <AirportTransferRequests />
                </ProtectedRoute>
              </DriverLayout>
            ) 
          },
        ],
      },
      { path: "driver-dashboard", element: <Navigate to="/driver/dashboard" replace /> },

      // Auth
      { path: "login", element: <GuestRoute><NewLogin /></GuestRoute> },
      { path: "driver-signup", element: <GuestRoute><DriverSignup /></GuestRoute> },
      { path: "driver/terms", element: <TermsAndConditions /> },
      { path: "booking-tester", element: <BookingTester /> },

      { path: "search-holidays", element: <SearchHolidaysPage /> },
      {
        path: '/driver/airport-transfers',
        element: <ProtectedRoute><AirportTransferRequests /></ProtectedRoute>,
        role: 'driver'
      },
      { path: "carforholidays", element: <CarForHolidayPage /> },
      { path: "booking/:bookingId", element: <BookingPage /> },
      { path: "outstation-booking", element: <OutstationBooking /> },
      { path: "booking-form/:bookingId?", element: <BookingForm /> },
      { path: '/scheduled-confirmation/:bookingId', element: <ScheduledRideConfirmation /> },
      { path: "/pickup", element: <LocalPickupPage /> },
      { path: "/local-pickup", element: <LocalTransferPage /> },
      {
        path: "vehicles",
        element: (
          <>
            <HeaderHome />
            <VehiclePage />
          </>
        )
      },
      { path: "vehicleadmin", element: <VehicleRateAdmin /> },
      { path: "book", element: <Holidaybookpage /> },
      { path: "packages", element: <Packages /> },
      { path: "/debug-firestore", element: <DebugFirestore /> },
      { path: 'find-driver', element: <FindDriverPage /> },
      { path: 'payment', element: <PaymentPage /> },
      { path: 'track-ride', element: <TrackRidepage /> },
      { path: "/user-dashboard", element: <UserDashboard /> },
      { path: "/booking-details", element: <BookingDetails /> },
      { path: "firestore-test", element: <FirestoreTestPage /> },
      { path: "register", element: <GuestRoute><Register /></GuestRoute> },
      { path: 'booking-page', element: <BookingPage /> },
      { path: '/track-outstation/:bookingId', element: <OutstationTrackingPage /> },
      { path: "agency-register", element: <GuestRoute><AgencyRegister /></GuestRoute> },
      { path: "agency-login", element: <GuestRoute><AgencyLogin /></GuestRoute> },

      { path: "agency-verify-email", element: <GuestRoute><AgencyVerifyEmail /></GuestRoute> },

      { path: "agency-verify-phone", element: <GuestRoute><AgencyVerifyPhone /></GuestRoute> },

      {
        path: "agency-dashboard",
        element: (
          <ProtectedRoute>
            <AgencyDashboard />
          </ProtectedRoute>
        ),
      },
      // Admin routes
      {
        path: "admin",
        element: <ProtectedRoute requiredRole="admin"><Admin /></ProtectedRoute>,
        children: [
          { index: true, element: <AdminHolidayHome /> },
          { path: "holiday-packages", element: <AdminHolidayPackages /> },
          { path: "holiday-packages/new", element: <ANewPacakge /> },
          { path: "holiday-packages/edit/:id", element: <AEditPacakge /> },
          { path: "login", element: <GuestRoute><ALogin /></GuestRoute> },
          { path: "holiday-data", element: <AHolidayData /> },
          { path: "navbar", element: <ANavBar /> },
          { path: "vehicles", element: <VehiclePage /> },
          { path: "vehicle-rates", element: <VehicleRateAdmin /> },
          { path: "bookings", element: <BookingPage /> },
          { path: "booking-tester", element: <BookingTester /> },
          { path: "firestore-test", element: <FirestoreTestPage /> }
        ]
      },

      // Holiday routes
      {
        path: "holiday",
        children: [
          { index: true, element: <Navigate to="/holiday/location/all" replace /> },
          { path: "location/:locate", element: <LocationInfo /> },
          { path: "location/:locate/details", element: <LocationDetails /> },
          { path: "book-now", element: <BookNow /> },
          { path: "booking-completed", element: <BookingCompleted /> },
          { path: "form", element: <HolidayForm /> },
          { path: "file-upload", element: <FileUpload /> }
        ]
      },

      { path: "outstation", element: <OutstationPage /> },
      { path: "vehicles", element: <><HeaderHome /><VehiclePage /></> },
      { path: "vehicleadmin", element: <VehicleRateAdmin /> },
      { path: "packages", element: <Packages /> },
      { path: "booking-form", element: <BookingForm /> },
      { 
        path: "payment", 
        element: <Payment />,
        errorElement: <Navigate to="/" replace />
      },
      { path: "*", element: <NotFound /> }
    ]
  }
],
{
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
}
);

const AppRouter = () => <RouterProvider router={router} fallbackElement={<div>Loading...</div>} />;

export { useAuthState };
export default AppRouter;