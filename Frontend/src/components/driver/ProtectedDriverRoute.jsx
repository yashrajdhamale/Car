import React, { useEffect, useState, useMemo } from 'react';
import { useLocation, Navigate, Outlet } from 'react-router-dom';
import { useUser } from '../../context/UserContext';
import { auth } from '../../config/firebase';

const ProtectedDriverRoute = () => {
  const { user, userData, loading: userLoading, error } = useUser();
  const [isVerifying, setIsVerifying] = useState(true);
  const location = useLocation();

  // Add a small delay to allow auth state to settle
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVerifying(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Memoize the user role check
  const { isDriverUser, userRole } = useMemo(() => {
    if (!userData) return { isDriverUser: false, userRole: null };
    
    const role = userData.role || userData.type || '';
    const normalizedRole = String(role).toLowerCase().trim();
    
    return {
      isDriverUser: normalizedRole === 'driver' || 
                   normalizedRole === 'drivers' ||
                   (userData.vehicle && (userData.vehicle.type || userData.vehicle.vehicleType)),
      userRole: normalizedRole
    };
  }, [userData]);

  // Debug logging
  useEffect(() => {
    console.log('ProtectedDriverRoute - State:', {
      userLoading,
      isVerifying,
      hasUser: !!user,
      userId: user?.uid,
      userRole,
      isDriverUser,
      path: location.pathname
    });
  }, [userLoading, isVerifying, user, userRole, isDriverUser, location.pathname]);

  // Show loading state while verifying or user data is loading
  if (userLoading || isVerifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700 font-medium mb-2">Verifying your session</p>
        <p className="text-sm text-gray-500">Please wait while we check your credentials</p>
      </div>
    );
  }

  // Show error state if there's an error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-red-500 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Error</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          {error.message || 'An error occurred while verifying your credentials'}
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Refresh Page
          </button>
          <button
            onClick={() => auth.signOut().then(() => (window.location.href = '/login'))}
            className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    console.log('[ProtectedDriverRoute] No authenticated user, redirecting to login');
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  // If user exists but no userData yet, wait a bit more
  if (user && !userData) {
    console.log('[ProtectedDriverRoute] User authenticated but data not loaded yet');
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-lg text-gray-700 font-medium mb-2">Loading your profile</p>
        <p className="text-sm text-gray-500">This should only take a moment...</p>
      </div>
    );
  }
  
  // Check if user is a driver
  if (!isDriverUser) {
    console.log('[ProtectedDriverRoute] User is not a driver, redirecting to home');
    return <Navigate to="/" replace />;
  }
  
  console.log('User is authorized as a driver, rendering dashboard');
  return <Outlet />;
};

export default ProtectedDriverRoute;