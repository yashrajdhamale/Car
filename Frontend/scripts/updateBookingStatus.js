import { initializeApp } from 'firebase/app';
import { getFirestore, doc, updateDoc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Firebase
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateBookingStatus(bookingId) {
  try {
    const bookingRef = doc(db, 'bookings', bookingId);
    
    // First, get the current booking data
    const bookingSnap = await getDoc(bookingRef);
    if (!bookingSnap.exists()) {
      console.error('No such booking document!');
      return;
    }
    
    console.log('Current booking data:', bookingSnap.data());
    
    // Update the booking status
    await updateDoc(bookingRef, {
      status: 'searching_driver',
      driverStatus: 'searching',
      updatedAt: new Date().toISOString()
    });
    
    console.log(`Successfully updated booking ${bookingId} to 'searching_driver' status`);
  } catch (error) {
    console.error('Error updating booking status:', error);
  }
}

// Get booking ID from command line arguments
const bookingId = process.argv[2];
if (!bookingId) {
  console.error('Please provide a booking ID as an argument');
  process.exit(1);
}

// Run the update
updateBookingStatus(bookingId)
  .then(() => {
    console.log('Update completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
