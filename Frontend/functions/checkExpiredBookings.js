import { logger } from 'firebase-functions';
import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Checks for bookings that have been in 'searching_driver' status for more than 2 minutes
 * and updates their status to 'expired'
 */
const checkExpiredBookings = async (context) => {
  const now = admin.firestore.Timestamp.now();
  const twoMinutesAgo = new admin.firestore.Timestamp(
    now.seconds - 120, // 2 minutes in seconds
    now.nanoseconds
  );

  console.log('Checking for expired bookings...');
  
  try {
    // Query for bookings that are still searching for a driver and were created more than 2 minutes ago
    const bookingsRef = db.collection('airportTransfers');
    const snapshot = await bookingsRef
      .where('status', '==', 'searching_driver')
      .where('createdAt', '<=', twoMinutesAgo)
      .get();

    if (snapshot.empty) {
      console.log('No expired bookings found.');
      return null;
    }

    console.log(`Found ${snapshot.size} expired bookings.`);
    
    // Update all expired bookings in a batch
    const batch = db.batch();
    const updates = [];

    snapshot.forEach(doc => {
      const bookingRef = bookingsRef.doc(doc.id);
      updates.push({
        id: doc.id,
        ...doc.data()
      });
      
      batch.update(bookingRef, {
        status: 'expired',
        statusUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        cancellationReason: 'No driver accepted the ride within the time limit',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    // Commit the batch update
    await batch.commit();
    
    console.log(`Successfully updated ${updates.length} bookings to 'expired' status.`);
    return updates;
  } catch (error) {
    logger.error('Error checking for expired bookings:', error);
    throw new Error(`Failed to check for expired bookings: ${error.message}`);
  }
};

export default checkExpiredBookings;
