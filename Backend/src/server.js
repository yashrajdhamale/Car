import dotenv from "dotenv";
dotenv.config();

import app from "./app.js";

import { firestore, firebaseAdmin, FieldValue } from "./services/firebase.js";

const PORT = process.env.PORT || 5000;

// Periodic check for expired bookings (airportTransfers in 'searching_driver' status > 2 mins)
const startExpiredBookingsCheck = () => {
  setInterval(async () => {
    try {
      const now = firebaseAdmin.firestore.Timestamp.now();
      const twoMinutesAgo = new firebaseAdmin.firestore.Timestamp(
        now.seconds - 120,
        now.nanoseconds
      );

      const bookingsRef = firestore.collection("airportTransfers");
      const snapshot = await bookingsRef
        .where("status", "==", "searching_driver")
        .where("createdAt", "<=", twoMinutesAgo)
        .get();

      if (!snapshot.empty) {
        console.log(`[ExpiredCheck] Found ${snapshot.size} expired airport transfer bookings.`);
        const batch = firestore.batch();
        snapshot.forEach((doc) => {
          batch.update(bookingsRef.doc(doc.id), {
            status: "expired",
            statusUpdatedAt: FieldValue.serverTimestamp(),
            cancellationReason: "No driver accepted the ride within the time limit",
            updatedAt: FieldValue.serverTimestamp(),
          });
        });
        await batch.commit();
        console.log(`[ExpiredCheck] Successfully expired ${snapshot.size} bookings.`);
      }
    } catch (error) {
      console.error("[ExpiredCheck] Error running expired bookings check:", error.message);
    }
  }, 60000); // Check every 60 seconds
};

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
  startExpiredBookingsCheck();
});

