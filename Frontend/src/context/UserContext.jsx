import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

// Create the context
export const UserContext = createContext();

// Provider component
export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(null);
  const isMounted = useRef(true);
  
  // Helper function to check if user is a driver (memoized)
  const isDriver = useCallback(() => {
    if (!userData) return false;
    
    // Check for driver role in multiple possible fields
    const role = userData.role || userData.type || '';
    const normalizedRole = String(role).toLowerCase().trim();
    
    // Check for driver indicators
    return normalizedRole === 'driver' || 
           normalizedRole === 'drivers' ||
           (userData.vehicle && (userData.vehicle.type || userData.vehicle.vehicleType));
  }, [userData]);

  // Fetch user data from Firestore with deduplication
  const fetchUserData = useCallback(async (authUser, forceRefresh = false) => {
    if (!authUser) {
      if (isMounted.current) {
        setUser(null);
        setUserData(null);
        setLoading(false);
      }
      return null;
    }
    
    // Check if this is a duplicate request
    const requestKey = `fetch_${authUser.uid}_${forceRefresh}`;
    const now = Date.now();
    
    // Skip if we have a recent request for the same user
    if (lastFetchRef.current?.key === requestKey && 
        now - lastFetchRef.current.timestamp < 5000) {
      return;
    }
    
    lastFetchRef.current = { key: requestKey, timestamp: now };
    
    if (isMounted.current) {
      setLoading(true);
    }

    try {
      const userDocRef = doc(db, 'users', authUser.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!isMounted.current) return;
      
      if (userDoc.exists()) {
        const data = userDoc.data();
        
        if (isMounted.current) {
          setUser(authUser);
          setUserData(data);
        }
      } else {
        if (isMounted.current) {
          setUser(authUser);
          setUserData({ role: 'unassigned' });
        }
      }
    } catch (err) {
      console.error('Error fetching user data:', err);
      if (isMounted.current) {
        setError(err);
        setUser(null);
        setUserData(null);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, []); // Empty dependency array as we don't use any external variables

  // Handle auth state changes
  useEffect(() => {
    isMounted.current = true;
    let isSubscribed = true;
    let unsubscribe = null;
    let currentRequest = null;
    
    const handleAuthStateChanged = async (authUser) => {
      if (!isSubscribed || !isMounted.current) return;
      
      try {
        if (authUser) {
          // Check if this is a driver redirect
          const isDriverRedirect = sessionStorage.getItem('driver_redirect') === 'true';
          
          // Cancel any in-flight requests
          if (currentRequest) {
            currentRequest.cancel('New auth state change');
          }
          
          // Create a new request with cancellation
          const controller = new AbortController();
          currentRequest = { cancel: (reason) => controller.abort(reason) };
          
          // Fetch user data
          await fetchUserData(authUser);
          
          // Clear the current request
          currentRequest = null;
          
          // If this was a driver redirect, clear the flag
          if (isDriverRedirect) {
            sessionStorage.removeItem('driver_redirect');
          }
        } else {
          // Reset state for logged out user
          if (isMounted.current) {
            setUser(null);
            setUserData(null);
            setLoading(false);
            sessionStorage.removeItem('driver_redirect');
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError' && isMounted.current) {
          console.error('Error in auth state change:', err);
          setError(err);
          setLoading(false);
        }
      }
    };

    // Subscribe to auth state changes
    unsubscribe = auth.onAuthStateChanged(handleAuthStateChanged);
    
    // Check current user immediately if not loading from SSR
    if (typeof window !== 'undefined') {
      const currentUser = auth.currentUser;
      if (currentUser) {
        handleAuthStateChanged(currentUser);
      } else if (isMounted.current) {
        setLoading(false);
      }
    } else if (isMounted.current) {
      setLoading(false);
    }

    // Cleanup function
    return () => {
      isSubscribed = false;
      isMounted.current = false;
      if (unsubscribe) {
        unsubscribe();
      }
      if (currentRequest) {
        currentRequest.cancel('Component unmounted');
      }
    };
  }, [fetchUserData]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(() => ({
    user,
    userData,
    loading,
    error,
    isDriver: isDriver(),
    refreshUserData: () => user && fetchUserData(user, true)
  }), [user, userData, loading, error, isDriver, fetchUserData]);

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using the user context
export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};