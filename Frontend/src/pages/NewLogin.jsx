import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { serverTimestamp } from 'firebase/firestore';
import { doc, setDoc, updateDoc, collection, query, where, getDocs, getDoc } from 'firebase/firestore';
import { ArrowRight, Loader2, Mail, Phone, Wifi, WifiOff } from 'lucide-react';

import { 
  auth, 
  signInWithGoogle, 
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from '@config/firebase';
import { db } from '../config/firebase';
import { getUserDocument } from '@config/functions';
import { useNotification } from '../context/NotificationContext';
import { ScrollToTop } from '@components';

function NewLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addNotification } = useNotification();

  const [userType, setUserType] = useState('customer');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOtpField, setShowOtpField] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' or 'phone'

  const isEmailLogin = loginMethod === 'email';
  const isPhoneLogin = loginMethod === 'phone';
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidPhone = (phone) => /^[0-9]{10}$/.test(phone);

  // Removed global reCAPTCHA initialization - will be created on demand

  // Add a ref to store the reCAPTCHA verifier
  const recaptchaVerifierRef = React.useRef(null);
  const [recaptchaReady, setRecaptchaReady] = React.useState(false);
  const [recaptchaError, setRecaptchaError] = React.useState(null);

  // Initialize reCAPTCHA when auth is available
  React.useEffect(() => {
    if (!auth) {
      console.error('Firebase auth is not available');
      setRecaptchaError('Authentication service is not available');
      return;
    }

    const initializeRecaptcha = async () => {
      try {
        // Clear any existing reCAPTCHA
        if (window.recaptchaVerifier) {
          try { 
            window.recaptchaVerifier.clear();
            window.recaptchaVerifier = null;
          } catch (e) {
            console.warn('Error clearing existing reCAPTCHA:', e);
          }
        }
        
        // Initialize reCAPTCHA with proper error handling
        const recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response) => {
            console.log('reCAPTCHA verified:', response);
          },
          'expired-callback': () => {
            console.log('reCAPTCHA expired');
            addNotification('Verification expired. Please try again.', 'error');
          }
        });
        
        window.recaptchaVerifier = recaptchaVerifier;
        recaptchaVerifierRef.current = recaptchaVerifier;
        setRecaptchaReady(true);
        setRecaptchaError(null);
        console.log('reCAPTCHA initialized successfully');
        
      } catch (error) {
        console.error('Error initializing reCAPTCHA:', error);
        setRecaptchaError('Failed to initialize security verification');
        addNotification('Failed to initialize security verification. Please refresh the page.', 'error');
      }
    };

    // Add a small delay to ensure the DOM is ready
    const timer = setTimeout(() => {
      initializeRecaptcha();
    }, 500);

    // Cleanup function
    return () => {
      clearTimeout(timer);
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
          window.recaptchaVerifier = null;
        } catch (e) {
          console.warn('Error cleaning up reCAPTCHA:', e);
        }
      }
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
          recaptchaVerifierRef.current = null;
        } catch (e) {
          console.warn('Error cleaning up reCAPTCHA ref:', e);
        }
      }
      setRecaptchaReady(false);
    };
  }, [auth]);  // Only re-run if auth changes

  const handleSendOtp = async () => {
    if (!isValidPhone(identifier)) {
      addNotification('Please enter a valid 10-digit phone number', 'error');
      return;
    }

    if (!recaptchaReady) {
      if (recaptchaError) {
        addNotification(recaptchaError, 'error');
      } else {
        addNotification('Security verification is not ready. Please try again in a moment.', 'error');
      }
      return;
    }

    try {
      setIsSendingOtp(true);
      
      const phoneNumber = `+91${identifier}`;
      
      try {
        // Use the pre-initialized reCAPTCHA verifier
        const confirmation = await signInWithPhoneNumber(
          auth,
          phoneNumber,
          window.recaptchaVerifier
        );
        
        console.log('reCAPTCHA verification successful');
        
        setConfirmationResult(confirmation);
        setShowOtpField(true);
        addNotification('OTP sent successfully!', 'success');
      } catch (error) {
        console.error('Error in reCAPTCHA verification:', error);
        
        // Reset reCAPTCHA on error
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch (e) {}
          window.recaptchaVerifier = null;
        }
        
        // Re-initialize reCAPTCHA for next attempt
        window.recaptchaVerifier = new RecaptchaVerifier('recaptcha-container', {
          'size': 'invisible',
          'callback': () => console.log('reCAPTCHA verified'),
          'expired-callback': () => console.log('reCAPTCHA expired')
        }, auth);
        
        recaptchaVerifierRef.current = window.recaptchaVerifier;
        
        // Rethrow with user-friendly message
        if (error.code === 'auth/too-many-requests') {
          throw new Error('Too many attempts. Please try again later.');
        } else if (error.code === 'auth/invalid-phone-number') {
          throw new Error('Invalid phone number format.');
        } else {
          throw new Error('Failed to send OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error sending OTP:', error);
      
      // Clean up on error
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          console.log('Error cleaning up reCAPTCHA on error:', e);
        }
        recaptchaVerifierRef.current = null;
      }
      
      // User-friendly error messages
      if (error.code === 'auth/too-many-requests') {
        addNotification('Too many attempts. Please try again later.', 'error');
      } else if (error.code === 'auth/invalid-phone-number') {
        addNotification('Invalid phone number format. Please enter a valid 10-digit number.', 'error');
      } else if (error.code === 'auth/invalid-recaptcha-token' || 
                 error.code === 'auth/captcha-check-failed') {
        addNotification('Security verification failed. Please try again.', 'error');
      } else if (error.code === 'auth/quota-exceeded') {
        addNotification('SMS quota exceeded. Please try again later.', 'error');
      } else {
        addNotification('Failed to send OTP. Please try again.', 'error');
      }
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      addNotification('Please enter a valid 6-digit OTP', 'error');
      return;
    }

    try {
      setIsLoading(true);
      await confirmationResult.confirm(otp);
      await handleLoginSuccess(auth.currentUser);
    } catch (error) {
      console.error('Error verifying OTP:', error);
      addNotification('Invalid OTP. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsGoogleLoading(true);
      const result = await signInWithGoogle();
      if (result) {
        // Check if user document exists
        const userDoc = await getUserDocument(result.uid);
        if (!userDoc) {
          // Create new user document with default values
          await setDoc(doc(db, 'users', result.uid), {
            email: result.email,
            displayName: result.displayName || '',
            photoURL: result.photoURL || '',
            type: 'user', // Default user type
            status: 'active', // or 'pending' if you need to approve users
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
        } else {
          // Update last login time for existing users
          await updateDoc(doc(db, 'users', result.uid), {
            lastLogin: new Date().toISOString()
          });
        }
        await handleLoginSuccess(result);
      }
    } catch (error) {
      console.error('Google Sign In Error:', error);
      addNotification('Failed to sign in with Google. Please try again.', 'error');
    } finally {
      setIsGoogleLoading(false);
    }
  };

 const handleLoginSuccess = async (user) => {
  try {
    setIsLoading(true);
    console.log('Login successful, processing user:', user.uid);

    const pendingBooking = localStorage.getItem('pendingHolidayBooking');
    if (pendingBooking) {
      try {
        const bookingData = JSON.parse(pendingBooking);
        localStorage.removeItem('pendingHolidayBooking');

        if (location.state?.from?.pathname) {
          navigate(location.state.from.pathname, {
            state: {
              ...(location.state.from.state || {}),
              ...bookingData,
              requiresLogin: false,
            },
            replace: true,
          });
        } else {
          navigate('/book', {
            state: {
              ...bookingData,
              requiresLogin: false,
            },
            replace: true,
          });
        }
        return;
      } catch (error) {
        console.error('Error processing pending booking:', error);
        localStorage.removeItem('pendingHolidayBooking');
      }
    }

    const from = location.state?.from?.pathname || location.state?.from || '/';

    let userData = {};
    let driverData = null;

    try {
      const userDocSnap = await getDoc(doc(db, 'users', user.uid));
      const driverDocSnap = await getDoc(doc(db, 'drivers', user.uid));

      if (userDocSnap.exists()) {
        userData = userDocSnap.data();
      }

      if (driverDocSnap.exists()) {
        driverData = driverDocSnap.data();
      }

      if (!userDocSnap.exists()) {
        const phoneNumber = user.phoneNumber || '';
        const displayName = user.displayName || user.email?.split('@')[0] || 'User';
        const nameParts = displayName.split(' ');

        const newUserData = {
          uid: user.uid,
          email: user.email || '',
          displayName,
          phoneNumber,
          contactNumber1: phoneNumber,
          photoURL: user.photoURL || '',
          firstName: nameParts[0] || '',
          lastName: nameParts.slice(1).join(' ') || '',
          role: 'user',
          status: 'active',
          emailVerified: user.emailVerified || false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastLogin: serverTimestamp(),
        };

        await setDoc(doc(db, 'users', user.uid), newUserData, { merge: true });
        userData = newUserData;
      }
    } catch (error) {
      console.error('Error handling user data:', error);
    }

    if (!userData) userData = {};

    let userRole = userData?.role || userData?.type || 'customer';
    userRole = String(userRole).toLowerCase().trim();

    const isDriver =
      userRole === 'driver' ||
      userRole === 'drivers' ||
      !!driverData ||
      !!userData?.isDriver ||
      !!userData?.vehicle;

    if (isDriver) {
      const normalizedDriverStatus =
        String(driverData?.status || userData?.status || 'pending').toLowerCase().trim();

      await setDoc(
        doc(db, 'users', user.uid),
        {
          lastLogin: serverTimestamp(),
          updatedAt: serverTimestamp(),
          emailVerified: user.emailVerified || userData?.emailVerified || false,
        },
        { merge: true }
      );

      if (driverData) {
        await setDoc(
          doc(db, 'drivers', user.uid),
          {
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }

      if (normalizedDriverStatus !== 'active') {
        await firebaseSignOut(auth);
        addNotification(
          'Your driver account is pending approval. Please wait for admin verification before login.',
          'warning'
        );
        navigate('/login', { replace: true });
        return;
      }

      addNotification('Login successful!', 'success');
      window.location.href = '/driver/dashboard';
      return;
    }

    const phoneNumber = user.phoneNumber || userData?.phoneNumber || userData?.contactNumber1 || '';
    const displayName = user.displayName || userData?.displayName || user.email?.split('@')[0] || 'User';
    const nameParts = displayName.split(' ');

    const userUpdate = {
      ...userData,
      role: userRole,
      status: userData?.status || 'active',
      lastLogin: serverTimestamp(),
      updatedAt: serverTimestamp(),
      email: user.email || userData?.email || '',
      displayName,
      phoneNumber,
      contactNumber1: phoneNumber,
      firstName: userData?.firstName || nameParts[0] || '',
      lastName: userData?.lastName || nameParts.slice(1).join(' ') || '',
      emailVerified: user.emailVerified || userData?.emailVerified || false,
      createdAt: userData?.createdAt || serverTimestamp(),
    };

    await setDoc(doc(db, 'users', user.uid), userUpdate, { merge: true });

    sessionStorage.clear();

    if (
      userRole === 'agency' &&
      (!userData.emailVerified || !userData.phoneVerified)
    ) {
      addNotification(
        'Please complete email and phone verification first.',
        'error'
      );
      await firebaseSignOut(auth);
      return;
    }

    let redirectPath = from || '/';
    if (['admin', 'agency', 'travelagency', 'travel_agency'].includes(userRole)) {
      redirectPath = '/agency-dashboard';
    }

    addNotification('Login successful!', 'success');

    setTimeout(() => {
      window.location.href = redirectPath;
    }, 100);
  } catch (error) {
    console.error('Error in login success handler:', error);
    if (!String(error?.message || '').includes('auth/network-request-failed')) {
      addNotification('An error occurred during login. Please try again.', 'error');
    }
  } finally {
    setIsLoading(false);
  }
};
  const handleForgotPassword = async () => {
    if (!identifier) {
      addNotification('Please enter your email or phone number', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      // Find user by email or phone
      const userDoc = await findUserByIdentifier(identifier);
      
      if (!userDoc) {
        // Don't reveal if user exists or not for security
        addNotification('If an account exists with this email, a password reset link has been sent.', 'info');
        return;
      }
      
      const userData = userDoc.data();
      let userEmail = userData.email;
      
      // If identifier is a phone number, try to find associated email
      if (isValidPhone(identifier) && !userEmail) {
        addNotification('Please use your email address to reset your password.', 'error');
        return;
      }
      
      if (!userEmail) {
        // This should not happen as we already checked for userDoc
        addNotification('No email address found for this account. Please contact support.', 'error');
        return;
      }
      
      // Send password reset email
      try {
        console.log('Sending password reset email to:', userEmail);
        await sendPasswordResetEmail(auth, userEmail);
        addNotification('Password reset link has been sent to your email', 'success');
        setShowForgotPassword(false);
        setIdentifier('');
      } catch (error) {
        console.error('Error sending password reset email:', error);
        if (error.code === 'auth/user-not-found') {
          // Don't reveal if user exists or not for security
          addNotification('If an account exists with this email, a password reset link has been sent.', 'info');
        } else if (error.code === 'auth/too-many-requests') {
          addNotification('Too many attempts. Please try again later.', 'error');
        } else if (error.code === 'auth/invalid-email') {
          addNotification('Invalid email address. Please check and try again.', 'error');
        } else {
          addNotification('Failed to send password reset email. Please try again.', 'error');
        }
      }
      
    } catch (error) {
      console.error('Error in password reset:', error);
      addNotification('An error occurred. Please try again later.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to find user by email or phone
  const findUserByIdentifier = async (identifier) => {
    try {
      // First, try to find by email
      let usersRef = collection(db, 'users');
      let q = query(usersRef, where('email', '==', identifier));
      let querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      }
      
      // If not found by email, try by phone
      q = query(usersRef, where('phoneNumber', '==', identifier));
      querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        return querySnapshot.docs[0];
      }
      
      return null;
    } catch (error) {
      console.error('Error finding user:', error);
      throw new Error('Error finding user account');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (showForgotPassword) {
      await handleForgotPassword();
      return;
    }

    if (showOtpField) {
      await handleVerifyOtp();
      return;
    }

    // For phone login, send OTP first
    if (isPhoneLogin) {
      await handleSendOtp();
      return;
    }

    if (!identifier || !password) {
      addNotification('Please fill in all fields', 'error');
      return;
    }
    
    // Check network connectivity
    if (!navigator.onLine) {
      addNotification('No internet connection. Please check your network and try again.', 'error');
      return;
    }

    try {
      setIsLoading(true);
      
      let userEmail = identifier;
      
      // If input looks like a phone number, find associated email
      if (isValidPhone(identifier)) {
        const userDoc = await findUserByIdentifier(identifier);
        if (!userDoc || !userDoc.data()?.email) {
          // Don't reveal if user exists or not for security
          addNotification('Invalid email or password', 'error');
          setIsLoading(false);
          return;
        }
        userEmail = userDoc.data().email;
      } else if (!isValidEmail(identifier)) {
        addNotification('Please enter a valid email address', 'error');
        setIsLoading(false);
        return;
      }
      
      console.log('Attempting to sign in with:', { email: userEmail });
      
      // Add timeout for the auth request
      const authPromise = signInWithEmailAndPassword(auth, userEmail, password);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout. Please check your internet connection.')), 10000)
      );
      
      try {
        const userCredential = await Promise.race([authPromise, timeoutPromise]);
        console.log('Sign in successful:', userCredential.user);
        
        // Handle the login success with the user object
        await handleLoginSuccess(userCredential.user);
        return; // Exit early since handleLoginSuccess will handle the redirect
      } catch (authError) {
        console.error('Authentication error:', authError);
        
        // Handle specific auth errors
        if (authError.code === 'auth/wrong-password') {
          addNotification('Incorrect password. Please try again.', 'error');
          return;
        }
        
        // Handle network errors
        if (authError.code === 'auth/network-request-failed' || authError.message.includes('timeout')) {
          addNotification('Network error. Please check your internet connection and try again.', 'error');
          return;
        }
        
              // Handle other auth errors
        if (authError.code) {
          addNotification('Invalid email or password', 'error');
        } else if (authError.code === 'auth/too-many-requests') {
          addNotification('Too many failed attempts. Please try again later or reset your password.', 'error');
        } else if (authError.code === 'auth/user-disabled') {
          addNotification('This account has been disabled. Please contact support.', 'error');
        } else if (authError.message.includes('timeout')) {
          addNotification(authError.message, 'error');
        } else {
          addNotification(authError.message || 'Failed to sign in', 'error');
        }
        
        // Check for pending booking in localStorage
        const pendingBooking = localStorage.getItem('pendingHolidayBooking');
        if (pendingBooking) {
          try {
            const bookingData = JSON.parse(pendingBooking);
            console.log('Found pending booking data, redirecting...');
            
            // Redirect to booking page with the saved data
            navigate('/book', { 
              state: {
                ...bookingData,
                requiresLogin: true // Keep requiresLogin as true since login failed
              },
              replace: true
            });
            return;
          } catch (error) {
            console.error('Error processing pending booking:', error);
            localStorage.removeItem('pendingHolidayBooking');
          }
        }
        
        // Re-throw the error to be caught by the outer catch block
        throw authError;
      }
      
      console.log('User signed in, checking verification...');
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('Email not verified, but proceeding with login...');
        // We'll still allow login but show a warning
        addNotification('Please verify your email to access all features. Check your inbox for the verification email.', 'warning');
      }
      
      console.log('User signed in, checking verification...');
      
      // Check if email is verified
      if (!userCredential.user.emailVerified) {
        console.log('Email not verified, but proceeding with login...');
        // We'll still allow login but show a warning
        addNotification('Please verify your email to access all features. Check your inbox for the verification email.', 'warning');
      }
      
      console.log('Email verified, fetching user data...');
      
      // Get user data to check type and status
      let userData;
      try {
        userData = await getUserDocument(userCredential.user.uid);
        console.log('User data:', userData);
        
        // Ensure user data has required fields
        if (!userData) {
          console.error('No user data found for:', userCredential.user.uid);
          // Create minimal user data if not exists
          userData = {
            role: userType, // Use 'role' to match registration
            status: 'active', // Default status
            email: userCredential.user.email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          
          // Save the new user data
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            ...userData,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          });
          
          console.log('Created new user data:', userData);
        }
        
        // Normalize user role and type for comparison
        const userRole = String(userData.role || userData.type || 'user').toLowerCase().trim();
        const normalizedUserType = userType.toLowerCase().trim();
        
        console.log('Checking user role:', { userRole, userType: normalizedUserType, userData });
        
        // Special handling for different role variations
        const isDriver = userRole === 'driver' || userRole === 'drivers';
        const isCustomer = userRole === 'user' || userRole === 'customer';
        const isMatchingRole = 
          (isDriver && normalizedUserType === 'driver') ||
          (isCustomer && normalizedUserType === 'customer') ||
          userRole === normalizedUserType;
        
        if (!isMatchingRole) {
          console.log(`User role mismatch: expected ${normalizedUserType}, got ${userRole}`);
          await firebaseSignOut(auth);
          addNotification(`Please login using the correct credentials for ${normalizedUserType} account.`, 'error');
          return;
        }
        
        // Ensure status is set, default to 'approved' if missing
        if (!userData.status) {
          console.log('No status found, setting default status to approved');
          userData.status = 'approved';
          // Update the document with the default status
          await setDoc(doc(db, 'users', userCredential.user.uid), 
            { status: 'approved', updatedAt: new Date().toISOString() },
            { merge: true }
          );
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        await firebaseSignOut(auth);
        addNotification('Error loading your account information. Please try again.', 'error');
        return;
      }
      
      
      console.log('All checks passed, checking user role');
      
      // Check if user is a driver
      const userRole = userData?.role || userData?.type || '';
      const normalizedRole = String(userRole).toLowerCase().trim();
      const isDriver = normalizedRole === 'driver' || normalizedRole === 'drivers';
      
      if (isDriver) {
        console.log('Driver detected, preparing for dashboard redirect');
        // Clear any cached data
        sessionStorage.clear();
        // Ensure user data is saved and up to date
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          role: 'driver',
          status: 'active',
          lastLogin: serverTimestamp()
        });
        // Force a full page reload to ensure all driver scripts load properly
        window.location.href = '/driver/dashboard';
        return;
      }
      
      // For non-driver users, proceed with normal login flow
      await handleLoginSuccess(userCredential.user);
    } catch (error) {
      console.error('Login error:', error);
      let message = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        message = 'Invalid email or password.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Try again later.';
      }
      addNotification(message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getSignupText = () => {
    switch (userType) {
      case 'driver':
        return 'Sign Up as Driver';
      case 'travelAgency':
        return 'Sign Up as Travel Agency';
      default:
        return 'Create an account';
    }
  };

  const getSignupPath = () => {
  switch (userType) {
    case "driver":
      return "/driver-signup";
    case "travelAgency":
      return "/agency-register";
    default:
      return "/register";
  }
};

  // Network status detection
  const updateNetworkStatus = useCallback((status) => {
    setIsOnline(status);
    if (!status) {
      addNotification('You are currently offline. Some features may not be available.', 'warning');
    } else {
      addNotification('Back online. Refreshing data...', 'success');
      // Optionally refresh data when coming back online
      if (auth.currentUser) {
        // Refresh user data
        auth.currentUser.reload();
      }
    }
  }, [addNotification]);

  useEffect(() => {
    const handleOnline = () => updateNetworkStatus(true);
    const handleOffline = () => updateNetworkStatus(false);

    // Set up network status listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updateNetworkStatus(navigator.onLine);

    // Cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array since we don't want this effect to re-run

  return (
    <div className="min-h-screen w-full relative overflow-hidden">
      <div 
        className="fixed inset-0 w-screen h-screen bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url("https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80")',
          minWidth: '100vw',
          minHeight: '100vh',
          margin: 0,
          padding: 0
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-md space-y-8 py-8 px-4 sm:px-6 lg:px-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
            {showForgotPassword ? 'Reset Password' : 'Sign in to your account'}
          </h2>
          {!showForgotPassword && (
            <p className="mt-2 text-center text-sm text-gray-200">
              Or{' '}
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="font-medium text-blue-400 hover:text-blue-300"
              >
                create a new account
              </button>
            </p>
          )}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white bg-opacity-90 py-8 px-4 shadow-xl rounded-lg sm:px-10 backdrop-blur-sm"
        >
          <div className={`mb-4 flex items-center justify-end ${isOnline ? 'text-green-500' : 'text-yellow-500'}`}>
            {isOnline ? (
              <span className="flex items-center">
                <Wifi className="mr-1 h-4 w-4" /> Online
              </span>
            ) : (
              <span className="flex items-center">
                <WifiOff className="mr-1 h-4 w-4" /> Offline
              </span>
            )}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Login As</label>
            <div className="grid grid-cols-3 gap-2">
              {['customer', 'driver', 'travelAgency'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setUserType(type)}
                  className={`py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                    userType === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {type === 'travelAgency' ? 'Agency' : type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Combined Email/Phone Input */}
          <p className="mb-2 text-sm text-gray-600">
            Enter your email or phone number
          </p>

          {/* Combined Email/Phone Input */}
          <div className="relative mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Email or phone number"
                autoComplete="username"
                className={`block w-full pl-10 pr-3 py-2 border ${
                  identifier && !isValidEmail(identifier) && !isValidPhone(identifier) ? 'border-red-300' : 'border-gray-300'
                } rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                value={identifier}
                onChange={(e) => {
                  // Auto-detect if input is phone number and format accordingly
                  const value = e.target.value;
                  if (/^\d*$/.test(value)) {
                    // If only numbers, treat as phone
                    setIdentifier(value.replace(/\D/g, '').slice(0, 10));
                    setLoginMethod('phone');
                  } else {
                    // Otherwise treat as email
                    setIdentifier(value);
                    setLoginMethod('email');
                  }
                }}
                disabled={isLoading}
                required
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isValidPhone(identifier) ? (
                  <Phone className="h-5 w-5 text-gray-400" />
                ) : (
                  <Mail className="h-5 w-5 text-gray-400" />
                )}
              </div>
            </div>
            {identifier && !isValidEmail(identifier) && !isValidPhone(identifier) && (
              <p className="mt-1 text-xs text-red-600">
                Please enter a valid email or 10-digit phone number
              </p>
            )}
            {isValidPhone(identifier) && (
              <p className="mt-1 text-xs text-gray-500">
                We'll send you an OTP to verify your number
              </p>
            )}
          </div>

          {/* Password / OTP */}
          {!showOtpField && !showForgotPassword && !isValidPhone(identifier) && (
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
          )}

          {!showForgotPassword && isValidPhone(identifier) && !showOtpField && (
            <button
              type="button"
              onClick={handleSendOtp}
              disabled={isSendingOtp || !isPhoneLogin}
              className="w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isSendingOtp ? 'Sending OTP...' : 'Send OTP'}
            </button>
          )}

          {showOtpField && (
            <input
              type="text"
              placeholder="Enter OTP"
              className="mb-4 w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              disabled={isLoading}
            />
          )}

          {/* Forgot Password Link */}
          {!showForgotPassword && !isValidPhone(identifier) ? (
            <div className="mb-4 text-right">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-500 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
          ) : showForgotPassword && (
            <div className="mb-4 flex justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setIdentifier('');
                }}
                className="text-sm text-blue-500 hover:underline flex items-center"
              >
                <ArrowRight className="h-4 w-4 mr-1 transform rotate-180" />
                Back to Login
              </button>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={
              isLoading || 
              (isValidPhone(identifier) && !showOtpField && !isValidPhone(identifier)) ||
              (isValidPhone(identifier) && showOtpField && !otp) ||
              (!isValidPhone(identifier) && (!identifier || !isValidEmail(identifier))) ||
              (!isValidPhone(identifier) && !password)
            }
            className="w-full mb-4 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {showForgotPassword
              ? isLoading
                ? 'Sending...'
                : 'Send Reset Link'
              : showOtpField
              ? 'Verify OTP'
              : isLoading
              ? 'Signing in...'
              : 'Sign In'}
          </button>

          {/* Divider with "or" */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isGoogleLoading}
            className="w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isGoogleLoading ? (
              <Loader2 className="animate-spin h-5 w-5 text-blue-500" />
            ) : (
              <>
                <img
                  src="https://www.google.com/favicon.ico"
                  alt="Google"
                  className="h-5 w-5 mr-2"
                />
                Continue with Google
              </>
            )}
          </button>

          {/* Signup Link */}
          {!showForgotPassword && (
            <div className="mt-6 text-center text-sm text-gray-600">
              New to our platform?{' '}
              <button
                type="button"
                onClick={() => navigate(getSignupPath())}
                className="font-medium text-green-600 hover:text-green-500"
              >
                {getSignupText()} <ArrowRight className="inline h-4 w-4" />
              </button>
            </div>
          )}
        </form>

        {/* reCAPTCHA container - must be in the DOM before initialization */}
        <div id="recaptcha-container" className="invisible absolute"></div>
        </div>
      </div>
    </div>
  );
}

export default ScrollToTop(NewLogin);
