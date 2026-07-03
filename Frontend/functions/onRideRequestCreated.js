const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { logger } = require("firebase-functions");

const db = getFirestore();

exports.onRideRequestCreated = onDocumentCreated("rideRequests/{requestId}", async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    logger.log("No data associated with the event");
    return;
  }
  const rideRequest = snapshot.data();
  const requestId = event.params.requestId;

  logger.log(`New ride request created: ${requestId}`, { rideRequest });

  try {
    // 1. Find available drivers
    const driversRef = db.collection("users");
    const q = driversRef
      .where("role", "==", "driver")
      .where("status", "==", "active")
      .where("available", "==", true);
      
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      logger.warn(`No available drivers found for ride request: ${requestId}`);
      // Optionally update the ride request status to 'no_drivers'
      await snapshot.ref.update({ status: 'no_drivers_available', updatedAt: FieldValue.serverTimestamp() });
      return;
    }

    // 2. Create a batch to write to each driver's incomingRequests subcollection
    const batch = db.batch();
    const driverIds = [];

    querySnapshot.forEach((doc) => {
      const driverId = doc.id;
      driverIds.push(driverId);
      const driverRequestRef = db.collection(`users/${driverId}/incomingRequests`).doc(requestId);
      
      const incomingRequestData = {
        ...rideRequest,
        requestId: requestId, // Ensure the original request ID is stored
        bookingId: rideRequest.bookingId || null, // Include the booking ID if it exists
        createdAt: FieldValue.serverTimestamp(), // Use server timestamp for consistency
      };
      
      batch.set(driverRequestRef, incomingRequestData);
    });

    // 3. Commit the batch
    await batch.commit();
    logger.log(`Ride request ${requestId} sent to ${driverIds.length} drivers:`, driverIds);

    // 4. Update the original ride request with the number of drivers notified
    await snapshot.ref.update({
      driversNotified: driverIds.length,
      updatedAt: FieldValue.serverTimestamp(),
    });

  } catch (error) {
    logger.error(`Error distributing ride request ${requestId}:`, error);
    // Optionally update the ride request status to 'error'
    await snapshot.ref.update({ status: 'error', error: error.message, updatedAt: FieldValue.serverTimestamp() });
  }
});
