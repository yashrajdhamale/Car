const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const admin = require('firebase-admin');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'carzi-holidays-f4be3',
    storageBucket: 'carzi-holidays-f4be3.appspot.com'
  });
}

exports.onBookingCreated = onDocumentCreated(
  {
    document: 'bookings/{bookingId}',
    region: 'us-central1',
    memory: '1GiB',
    timeoutSeconds: 540,
    maxInstances: 10
  },
  async (event) => {
    const snap = event.data;
    const bookingId = event.params.bookingId;
    console.log('🚀 Booking created:', bookingId);

    const booking = snap.data();
    // Only process holiday bookings to avoid outstation overlap
    if (!booking || booking.type !== 'holiday') {
      console.log('onBookingCreated: skipping non-holiday booking');
      return null;
    }
    if (!booking.from || !booking.to) {
      console.log('❌ Missing from or to location in booking document');
      return null;
    }

    const pickup = booking.from.toLowerCase().trim();
    const drop = booking.to.toLowerCase().trim();
    console.log(`🔍 Processing booking from ${pickup} to ${drop}`);

    try {
      const db = getFirestore();
      const routesRef = db.collection('routes');

      // Helper function to capitalize the first letter of a string
      const capitalizeFirstLetter = (string) => {
        return string.charAt(0).toUpperCase() + string.slice(1);
      };

      console.log('🔍 Querying routes with conditions:', {
        active: true,
        from: [pickup, capitalizeFirstLetter(pickup)],
        to: [drop, capitalizeFirstLetter(drop)]
      });

      // Get all active routes and filter in memory
      const allActiveRoutes = await routesRef
        .where('isActive', '==', true)
        .get();

      console.log(`🔍 Found ${allActiveRoutes.size} active routes`);

      // Filter routes that match the booking's from and to locations (case-insensitive)
      const matchingRoutes = allActiveRoutes.docs.filter(doc => {
        const route = doc.data();
        const fromMatch = route.from && (
          route.from.toLowerCase() === pickup || 
          route.from === capitalizeFirstLetter(pickup)
        );
        const toMatch = route.to && (
          route.to.toLowerCase() === drop || 
          route.to === capitalizeFirstLetter(drop)
        );
        const hasDriverId = route.driverId && typeof route.driverId === 'string' && route.driverId.trim() !== '';
        return fromMatch && toMatch && hasDriverId;
      });

      console.log(`✅ Found ${matchingRoutes.length} valid matching routes`);

      if (matchingRoutes.length === 0) {
        console.log('❌ No valid driver routes found for this booking.');
        await db.collection('bookings').doc(bookingId).update({ status: 'no_drivers_found' });
        return null;
      }

      let matchCount = 0;
      const batch = db.batch();

      // Create a ride request document first (holiday only)
      const rideRequestRef = db.collection('rideRequests').doc(bookingId);
      const rideRequestData = {
        bookingId,
        from: pickup,
        to: drop,
        customerName: booking.customerName || '',
        contact: booking.contact || '',
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
        bookingDate: booking.bookingDate || null,
        vehicleType: booking.vehicleType || null,
        notes: booking.notes || ''
      };
      
      // Add the ride request to the batch
      batch.set(rideRequestRef, rideRequestData);

      for (const routeDoc of matchingRoutes) {
        const route = routeDoc.data();
        const driverId = route.driverId;

        if (!driverId) {
          console.warn('⚠️ Skipping route with missing or invalid driverId:', route);
          continue;
        }

        console.log(`✅ Processing route for driver ${driverId}`);

        try {
          // Create incoming request in the driver's subcollection
          const incomingRef = db.collection('users').doc(driverId).collection('incomingRequests').doc(bookingId);

          batch.set(incomingRef, {
            ...rideRequestData,
            requestId: rideRequestRef.id, // Include the ride request ID
            driverId: driverId, // Include the driver ID for reference
            status: 'pending',
            createdAt: FieldValue.serverTimestamp()
          });

          matchCount++;
        } catch (error) {
          console.error(`❌ Error creating ride request for driver ${driverId}:`, error);
          // Continue with the next route even if one fails
          continue;
        }
      }

      if (matchCount > 0) {
        await batch.commit();
        console.log(`📨 Sent notifications to ${matchCount} drivers`);
      } else {
        console.log('ℹ️ No matching drivers found');
      }

      return { success: true, notifiedDrivers: matchCount };
    } catch (error) {
      console.error('❌ Error processing booking:', error);
      throw error;
    }
  }
);
