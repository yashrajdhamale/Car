import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '@config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const NotAuthorized = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const from = location.state?.from?.pathname || '/';

  const [debugInfo, setDebugInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Use ref instead of state to track mounted
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;

    const checkUserAndRedirect = async () => {
      const user = auth.currentUser;

      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login', {
          replace: true,
          state: { from: location.pathname }
        });
        return;
      }

      try {
        const [userDoc, driverDoc] = await Promise.all([
          getDoc(doc(db, 'users', user.uid)),
          getDoc(doc(db, 'drivers', user.uid))
        ]);

        if (!isMountedRef.current) return;

        const userData = userDoc.data() || {};
        const driverData = driverDoc.exists() ? driverDoc.data() : null;
        const userRole = userData.role || userData.type;
        const currentPath = window.location.pathname;

        console.log('User document:', userData);
        console.log('Driver document:', driverData);

        const debugData = {
          userId: user.uid,
          email: user.email,
          userDoc: userData,
          driverDoc: driverData,
          locationState: location.state,
          requiredRole: location.state?.requiredRole,
          userRole: userRole,
          timestamp: new Date().toISOString(),
          authState: {
            isAnonymous: user.isAnonymous,
            emailVerified: user.emailVerified,
            metadata: user.metadata
          }
        };

        // Driver redirect logic
        if (userRole === 'driver' && driverData?.status === 'active') {
          if (!currentPath.startsWith('/driver-dashboard')) {
            console.log('Driver is active, redirecting to dashboard');
            navigate('/driver-dashboard', {
              replace: true,
              state: { from: location.pathname, skipAuthCheck: true }
            });
            return; // Important: Return after navigation
          }
          console.log('Already on dashboard, preventing redirect loop');
          return;
        }

        // Not authorized
        setDebugInfo({
          ...debugData,
          error: 'User not authorized'
        });
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching documents:', error);
        if (isMountedRef.current) {
          setDebugInfo({
            error: error.message,
            timestamp: new Date().toISOString()
          });
          setIsLoading(false);
        }
      }
    };

    checkUserAndRedirect();

    // Log route info
    console.log('NotAuthorized route state:', {
      pathname: window.location.pathname,
      state: location.state,
      from: location.state?.from,
      search: window.location.search
    });

    return () => {
      isMountedRef.current = false;
    };
  }, [location.state, navigate, location.pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking your access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Access Denied
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don't have permission to access this page.
        </p>
        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Return to Home
          </button>
        </div>
      </div>

      {debugInfo && (
        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-4xl">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Debug Information</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-700">User Info</h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-auto text-xs mt-1">
                  {JSON.stringify({
                    email: debugInfo.email,
                    userId: debugInfo.userId,
                    role: debugInfo.userRole,
                    emailVerified: debugInfo.authState?.emailVerified
                  }, null, 2)}
                </pre>
              </div>
              <div>
                <h4 className="font-medium text-gray-700">Access Details</h4>
                <pre className="bg-gray-50 p-3 rounded-md overflow-auto text-xs mt-1">
                  {JSON.stringify({
                    requiredRole: debugInfo.requiredRole,
                    currentPath: window.location.pathname,
                    redirectedFrom: debugInfo.locationState?.from,
                    timestamp: new Date(debugInfo.timestamp).toLocaleString()
                  }, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotAuthorized;
