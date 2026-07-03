// Firebase App (the core Firebase SDK) is always required
import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { 
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  CACHE_SIZE_UNLIMITED
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut
} from 'firebase/auth';

// Clean and validate environment variables
const cleanProjectId = (id) => (id || '').replace(/["]/g, '').trim();

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: cleanProjectId(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

console.log('Firebase Project ID:', firebaseConfig.projectId);

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(firebaseApp);
const db = initializeFirestore(firebaseApp, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
    cacheSizeBytes: CACHE_SIZE_UNLIMITED
  })
});
const storage = getStorage(firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Set auth language
auth.languageCode = 'en';

console.log('Firebase initialized with persistence enabled');

// Phone Authentication functions
const setUpRecaptcha = async (phoneNumber) => {
  try {
    // Clear any existing reCAPTCHA verifier
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }

    // Create a new reCAPTCHA verifier
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible',
      'callback': () => console.log('reCAPTCHA verified'),
      'expired-callback': () => console.log('reCAPTCHA expired')
    });
    
    const appVerifier = window.recaptchaVerifier;
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
    
    console.log('OTP sent successfully');
    return confirmationResult;
  } catch (error) {
    console.error('Error in setUpRecaptcha:', error);
    throw error;
  }
};

const verifyOtp = async (verificationId, otp) => {
  try {
    const credential = PhoneAuthProvider.credential(verificationId, otp);
    return await signInWithCredential(auth, credential);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    throw error;
  }
};

// Google Sign In
const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Sign out
const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { 
  auth, 
  db, 
  storage, 
  googleProvider,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithCredential,
  PhoneAuthProvider,
  verifyOtp,
  signInWithGoogle,
  signOut,
  setUpRecaptcha
};
