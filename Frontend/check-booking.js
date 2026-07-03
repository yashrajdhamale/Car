import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { firebaseConfig } from './src/config/firebase.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const bookingId = 'kAfAF25VNz6SBp7hYawU';

async function checkBooking() {
  try {
    // Check holidayBookings first
    const holidayDoc = await getDoc(doc(db, 'holidayBookings', bookingId));
    if (holidayDoc.exists()) {
      console.log('Found in holidayBookings:', holidayDoc.data());
      return;
    }

    // Check regular bookings
    const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
    if (bookingDoc.exists()) {
      console.log('Found in bookings:', bookingDoc.data());
      return;
    }

    console.log('Booking not found in either collection');
  } catch (error) {
    console.error('Error checking booking:', error);
  } finally {
    process.exit(0);
  }
}

checkBooking();
