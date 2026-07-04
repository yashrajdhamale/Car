// code is working 

import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  signOut,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  signInWithCredential,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  sendPasswordResetEmail
} from "firebase/auth";

// 🔐 Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID, // carzi-holidays-f4be3
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// ✅ PREVENT MULTIPLE INITIALIZATION (CRITICAL FOR VITE)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ✅ ALWAYS use getFirestore (DO NOT use initializeFirestore)
const db = getFirestore(app);

// Other Firebase services
const storage = getStorage(app);
const functions = getFunctions(app);
const auth = getAuth(app);

// =======================
// AUTH HELPERS
// =======================

const firebaseSignOut = () => signOut(auth);
const signOutUser = firebaseSignOut; // backward compatibility

// Google Auth
const googleProvider = new GoogleAuthProvider();

const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// =======================
// PHONE AUTH
// =======================

const setUpRecaptcha = () => {
  if (window.recaptchaVerifier) {
    window.recaptchaVerifier.clear();
  }

  window.recaptchaVerifier = new RecaptchaVerifier(
    auth,
    "recaptcha-container",
    { size: "invisible" }
  );

  return window.recaptchaVerifier;
};

const verifyOtp = async (verificationId, otp) => {
  const credential = PhoneAuthProvider.credential(verificationId, otp);
  return signInWithCredential(auth, credential);
};

// =======================
// EXPORTS
// =======================

export {
  app,
  db,
  storage,
  functions,
  auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCustomToken,
  firebaseSignOut,
  signOutUser,
  updateProfile,
  verifyOtp,
  setUpRecaptcha,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  sendEmailVerification,
  signInWithGoogle,
  onAuthStateChanged,
  sendPasswordResetEmail
};

// alias
export { firebaseSignOut as signOut };
