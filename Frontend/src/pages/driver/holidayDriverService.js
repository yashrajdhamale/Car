// holidayDriverService.js
// ─────────────────────────────────────────────────────────────────────────────
// Find drivers by holidayRoutes state → broadcast → first-wins transaction lock
// ─────────────────────────────────────────────────────────────────────────────

import {
  collection,
  query,
  where,
  getDocs,
  doc,
  addDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../config/firebase"; // adjust path

// ─────────────────────────────────────────────────────────────────────────────
// 1. FIND ALL DRIVERS WHOSE holidayRoutes STATE MATCHES
//    Each holidayRoutes doc: { driverId, state, from, to }
//    e.g. driver adds "Surat → Ahmedabad" with state: "Gujarat"
//    Falls back to user.state profile field if nothing found.
// ─────────────────────────────────────────────────────────────────────────────
export const findDriversForHoliday = async (requestedState) => {
  if (!requestedState) return [];
  const normalized = requestedState.trim().toLowerCase();
  const driverMap = new Map();

  try {
    // Step 1 — scan all holidayRoutes docs for state match
    const routesSnap = await getDocs(collection(db, "holidayRoutes"));
    const matchedIds = new Set();

    routesSnap.forEach((d) => {
      const r = d.data();
      const rs = r.state ? String(r.state).trim().toLowerCase() : "";
      if (rs === normalized && r.driverId) matchedIds.add(r.driverId);
    });

    console.log(`[Holiday] ${matchedIds.size} driver(s) matched via holidayRoutes for "${requestedState}"`);

    // Step 2 — fetch driver profiles for matched IDs (available only, chunk by 30)
    if (matchedIds.size > 0) {
      const ids = Array.from(matchedIds);
      for (let i = 0; i < ids.length; i += 30) {
        const chunk = ids.slice(i, i + 30);
        const snap = await getDocs(
          query(
            collection(db, "users"),
            where("__name__", "in", chunk),
            where("role", "==", "driver")
          )
        );
        snap.forEach((d) => {
          const data = d.data();
          if (data.isAvailable !== false) driverMap.set(d.id, { id: d.id, ...data });
        });
      }
    }

    // Step 3 — profile.state fallback if still no drivers found
    if (driverMap.size === 0) {
      console.warn("[Holiday] No route drivers found, falling back to profile.state");
      const snap = await getDocs(
        query(
          collection(db, "users"),
          where("role", "==", "driver"),
          where("isAvailable", "==", true)
        )
      );
      snap.forEach((d) => {
        const data = d.data();
        const ds = data.state ? String(data.state).trim().toLowerCase() : "";
        if (ds === normalized) driverMap.set(d.id, { id: d.id, ...data });
      });
    }

    const result = Array.from(driverMap.values());
    console.log(`[Holiday] Total available drivers: ${result.length}`);
    return result;
  } catch (err) {
    console.error("[Holiday] findDriversForHoliday error:", err);
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. BROADCAST TO ALL MATCHED DRIVERS
//    Writes to: users/{driverId}/holidayRequests
//    This is the collection your DriverDashboard already listens to.
// ─────────────────────────────────────────────────────────────────────────────
export const sendHolidayRideRequests = async (bookingId, drivers, bookingData) => {
  try {
    await Promise.all(
      drivers.map((driver) => {
        const driverId = typeof driver === "string" ? driver : driver.id;
        return addDoc(collection(db, "users", driverId, "holidayRequests"), {
          // ✅ bookingId is critical — your dashboard's Strategy 1 uses this
          bookingId,
          type: "holiday",
          status: "pending",

          // Customer info — used by dashboard Strategy 2 & 3 fallbacks
          userId: bookingData.userId || "",
          userEmail: bookingData.userEmail || "",
          userPhone: bookingData.userPhone || "",
          userName: bookingData.userName || "",

          // Package / vehicle info for HolidayRideRequestCard display
          packageName: bookingData.package?.name || "",
          packageDuration: bookingData.package?.duration || "",
          vehicleType: bookingData.vehicle?.name || bookingData.vehicle?.type || "",
          travelDate: bookingData.travelDate || "",
          guests: bookingData.guests || 1,
          price: bookingData.price || 0,
          state: bookingData.state || "",

          // Full objects for card UI
          package: bookingData.package || null,
          vehicle: bookingData.vehicle || null,

          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      })
    );
    console.log(`[Holiday] Broadcast complete → ${drivers.length} driver(s)`);
    return { success: true };
  } catch (err) {
    console.error("[Holiday] sendHolidayRideRequests error:", err);
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. CONFIRM BOOKING (called after user clicks Confirm & Pay)
// ─────────────────────────────────────────────────────────────────────────────
export const confirmHolidayBooking = async (bookingId, paymentMethod = "cash") => {
  try {
    await updateDoc(doc(db, "holidayBookings", bookingId), {
      status: "confirmed",
      paymentMethod,
      paymentStatus: "pending", // set to 'paid' when real gateway fires
      confirmedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (err) {
    console.error("[Holiday] confirmHolidayBooking error:", err);
    return { success: false, error: err.message };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. REALTIME LISTENER — used by HolidayBookingPage to watch for driver_assigned
// ─────────────────────────────────────────────────────────────────────────────
export const listenToHolidayBooking = (bookingId, callback) => {
  return onSnapshot(doc(db, "holidayBookings", bookingId), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
};