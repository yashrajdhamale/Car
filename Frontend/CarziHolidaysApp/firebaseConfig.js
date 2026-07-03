// Import the functions you need from the SDKs you need
import { initializeApp } from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAee-TmtHeEI0jOJGUUqLyMMP7nvRUYzMA",
  authDomain: "carzi-holidays-f4be3.firebaseapp.com",
  projectId: "carzi-holidays-f4be3",
  storageBucket: "carzi-holidays-f4be3.appspot.com",
  messagingSenderId: "938487746105",
  appId: "938487746105:web:e6294b4e83a2d4cd1387e8",
  databaseURL: "https://carzi-holidays-f4be3.firebaseio.com"
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// Initialize Firebase services
const authInstance = auth();
const db = firestore();

// Enable offline persistence for Firestore
db.enablePersistence()
  .then(() => console.log('Firestore persistence enabled'))
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support all of the features required to enable persistence');
    }
  });

// Export the services
export { 
  authInstance as auth, 
  db, 
  firestore 
};

// Export default the Firebase app
export default app;