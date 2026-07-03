import React, { useEffect, useState } from "react";
import { Routes, Route, Outlet, Navigate } from "react-router-dom";
import { auth } from './config/firebase';
import { getUserDocument } from './config/functions';
import { useDriverStatus } from './hooks/useDriverStatus';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './config/firebase';
import { isNativeApp, initializePlatformStyles } from './utils/platform';

initializePlatformStyles();

import './styles/web/web-theme.css';

if (isNativeApp) {
  import('./styles/app/app-theme.css');
}

import { Footer, Header, HeaderHome } from "@components";
import MainLayout from "./components/MainLayout";
import { Home, About, Contact, Blog, Register, NotFound, SiteMap, PdfHome, NotAuthorized, A, B, C, LocalTransferPage } from "@pages";
import NewLogin from "./pages/NewLogin";
import DriverSignup from "./pages/DriverSignup";
import DriverRegister from "./pages/DriverRegister";
import DriverDashboard from "./pages/driver/Dashboard.new";
import { AEditPacakge, ANewPacakge, AdminHolidayHome, AdminHolidayPackages, ALogin, AHolidayData, ANavBar, Admin } from '@admin';
import { LocationDetails, LocationInfo, BookNow, BookingCompleted, HolidayForm, FileUpload } from "@holiday";
import BookingConfirmation from "./pages/BookingConfirmation";
import TestEmail from "./pages/TestEmail";
import { NotificationProvider } from "./context/NotificationContext";
import BookingPage from "./components/BookingPage";
import { NavigationProvider } from './context/NavigationContext';
import UserContextProvider from './context/UserContextProvider';
import VehicleRateAdmin from "./VehicleRateAdmin";
import BookingForm from "./components/BookingForm";
import TestConnection from "./components/TestConnection";
import FirestoreTestPage from "./components/FirestoreTestPage";
import OutstationPage from "./components/OutstationPage";
import Packages from "./components/Packages";
import CarForHolidayPage from "./components/CarForHolidayPage";
import SearchHolidaysPage from "./components/SearchHolidaysPage";
import Holidaybookpage from "./components/Holidaybookpage";
import AgencyRegister from "./pages/AgencyRegister";
import AgencyLogin from "./pages/AgencyLogin";
import AgencyVerifyPhone from "./pages/AgencyVerifyPhone";
import AgencyDashboard from "./pages/AgencyDashboard";
import AgencyVerifyEmail from "./pages/AgencyVerifyEmail";


// ✅ Language Selector
import LanguageSelector from "./components/LanguageSelector";

// Protected Route Component
const ProtectedRoute = ({ children, requiredRole = null }) => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const [userDoc, driverDoc] = await Promise.all([
            getUserDocument(user.uid),
            getDoc(doc(db, 'drivers', user.uid))
          ]);

          if (!userDoc) {
            setLoading(false);
            return;
          }

          setUserData(userDoc);

          const userRole = userDoc.role || userDoc.type;
          const isDriverApproved = driverDoc.exists() && driverDoc.data()?.status === 'active';

          if (requiredRole && userRole !== requiredRole) {
            setLoading(false);
            return;
          }

          if (requiredRole === 'driver' && !isDriverApproved) {
            setLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [requiredRole]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return children;
};

function App() {
  useDriverStatus();

  return (
    <UserContextProvider>
      <NotificationProvider>
        <NavigationProvider>

          {/* ✅ Language Selector - fixed position top right */}
          <LanguageSelector />

          <Routes>

            {/* Home Page */}
            <Route path="/" element={
              <MainLayout currentIndex={0}>
                <div style={{ marginTop: '50px' }}>
                  <Home />
                </div>
              </MainLayout>
            } />

            {/* Local Pickup */}
            <Route path="/local-pickup" element={
              <MainLayout currentIndex={1}>
                <LocalTransferPage />
              </MainLayout>
            } />

            <Route path="/sitemap" element={
              <MainLayout currentIndex={0}>
                <SiteMap />
              </MainLayout>
            } />

            <Route path="/location/:locate" element={
              <MainLayout currentIndex={0}>
                <LocationInfo />
              </MainLayout>
            } />

            <Route path="/about" element={
              <MainLayout currentIndex={0}>
                <About />
              </MainLayout>
            } />

            <Route path="/contact" element={
              <MainLayout currentIndex={0}>
                <Contact />
              </MainLayout>
            } />

            <Route path="/blog" element={
              <MainLayout currentIndex={0}>
                <Blog />
              </MainLayout>
            } />

            <Route path="/BookNow" element={
              <MainLayout currentIndex={0}>
                <BookNow location_id={"324532242"} />
              </MainLayout>
            } />

            <Route path="/locationdetails" element={
              <MainLayout currentIndex={0}>
                <LocationDetails />
              </MainLayout>
            } />

            <Route path="/driver-signup" element={
              <MainLayout currentIndex={0}>
                <DriverSignup />
              </MainLayout>
            } />

            <Route path="/driver/register" element={
              <MainLayout currentIndex={0}>
                <DriverRegister />
              </MainLayout>
            } />

            {/* Public routes */}
            <Route path="/login" element={<NewLogin />} />
            <Route path="/register" element={<Register />} />
            <Route path="/not-authorized" element={<NotAuthorized />} />
            <Route path="/booking-completed" element={<BookingCompleted />} />
            <Route path="/booking-confirmation" element={<BookingConfirmation />} />
            <Route path="/holidays/form" element={<HolidayForm />} />
            <Route path="/vehicle-rates" element={<VehicleRateAdmin />} />
            <Route path="/test-connection" element={<TestConnection />} />
            <Route path="/firestore-test" element={<FirestoreTestPage />} />
            <Route path="/test-email" element={<TestEmail />} />
            <Route path="/booking-page" element={<BookingPage />} />
            <Route path="/booking-form" element={<BookingForm />} />
            <Route path="/book" element={<Holidaybookpage />} />
            <Route path="/carforholidays" element={<CarForHolidayPage />} />
            <Route path="/outstation/:id" element={<OutstationPage />} />
            <Route path="/search-holidays" element={<SearchHolidaysPage />} />
            <Route path="/packages" element={<Packages />} />

            {/* Protected routes */}
            <Route path="/driver-dashboard" element={
              <ProtectedRoute requiredRole="driver">
                <MainLayout currentIndex={0}>
                  <DriverDashboard />
                </MainLayout>
              </ProtectedRoute>
            } />
            <Route path="/agency-register" element={<AgencyRegister />} />
            <Route path="/agency-login" element={<AgencyLogin />} />
            <Route path="/agency-verify-phone" element={<AgencyVerifyPhone />} />
            <Route path="/agency-dashboard" element={<AgencyDashboard />} />
            <Route
                path="/agency-verify-email"
                element={<AgencyVerifyEmail />}
            />
            {/* Admin routes */}
            <Route path="admin" element={
              <>
                <ANavBar />
                <Outlet />
              </>
            }>
              <Route index element={<Admin />} />
              <Route path="holiday" element={<AdminHolidayHome />} />
              <Route path="holiday/packages" element={<AdminHolidayPackages />} />
              <Route path="holiday/addpackage" element={<ANewPacakge />} />
              <Route path="holiday/editpackage" element={<AEditPacakge />} />
              <Route path="holiday/approval" element={<AHolidayData />} />
            </Route>

            <Route path="admin/login" element={<ALogin />} />
            <Route path="pdf" element={<PdfHome />} />
            <Route path="pdftest" element={<PdfHome />} />
            <Route path="pdftest2" element={<FileUpload />} />

            {/* Testing */}
            <Route path="/a" element={<A />} />
            <Route path="/b" element={<B />} />
            <Route path="/c" element={<C />} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />

          </Routes>

        </NavigationProvider>
      </NotificationProvider>
    </UserContextProvider>
  );
}

export default App;