// utils/holidayBooking.js

import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import { db } from "../config/firebase";

// City → State mapping
const CITY_TO_STATE = {
  shimla: "himachal pradesh",
  manali: "himachal pradesh",
  dharamshala: "himachal pradesh",
  kullu: "himachal pradesh",
  mandi: "himachal pradesh",
  kasauli: "himachal pradesh",
  dalhousie: "himachal pradesh",
  spiti: "himachal pradesh",
  chail: "himachal pradesh",
  jaipur: "rajasthan",
  udaipur: "rajasthan",
  jodhpur: "rajasthan",
  pushkar: "rajasthan",
  ajmer: "rajasthan",
  bikaner: "rajasthan",
  munnar: "kerala",
  wayanad: "kerala",
  alleppey: "kerala",
  kochi: "kerala",
  trivandrum: "kerala",
  goa: "goa",
  panaji: "goa",
  mumbai: "maharashtra",
  pune: "maharashtra",
  nashik: "maharashtra",
  ahmedabad: "gujarat",
  surat: "gujarat",
  vadodara: "gujarat",
  bangalore: "karnataka",
  coorg: "karnataka",
  mysore: "karnataka",
  chennai: "tamil nadu",
  ooty: "tamil nadu",
  nainital: "uttarakhand",
  rishikesh: "uttarakhand",
  mussoorie: "uttarakhand",
  haridwar: "uttarakhand",
  dehradun: "uttarakhand",
  srinagar: "kashmir",
  gulmarg: "kashmir",
  pahalgam: "kashmir",
  leh: "ladakh",
  delhi: "delhi",
  agra: "uttar pradesh",
  varanasi: "uttar pradesh",
};

/**
 * Get all state variants to match against from package state + name
 */
const getStateVariants = (pkgState, pkgName = "") => {
  const variants = new Set();
  const stateLower = (pkgState || "").toLowerCase().trim();
  const nameLower  = (pkgName  || "").toLowerCase().trim();

  if (stateLower) variants.add(stateLower);

  // Extract state from city names found in package name or state string
  for (const [city, state] of Object.entries(CITY_TO_STATE)) {
    if (nameLower.includes(city) || stateLower.includes(city)) {
      variants.add(state);
    }
  }

  // Handle common aliases
  if (stateLower.includes("himachal")) variants.add("himachal pradesh");
  if (stateLower.includes("kashmir") || stateLower.includes("j&k")) variants.add("kashmir");
  if (stateLower.includes("uttarakhand")) variants.add("uttarakhand");
  if (stateLower.includes("kerala")) variants.add("kerala");
  if (stateLower.includes("rajasthan")) variants.add("rajasthan");
  if (stateLower.includes("goa")) variants.add("goa");

  console.log("[getStateVariants] pkgState:", pkgState, "variants:", [...variants]);
  return [...variants];
};

/**
 * Check if a driver route matches any of the target state variants.
 */
const routeMatchesState = (route, stateVariants) => {
  const fromCity   = (route.from  || "").toLowerCase().trim();
  const toCity     = (route.to    || "").toLowerCase().trim();
  const routeState = (route.state || "").toLowerCase().trim();

  for (const sv of stateVariants) {
    // Direct state field match
    if (routeState && (routeState.includes(sv) || sv.includes(routeState))) return true;

    // from/to city directly contains state name
    if (fromCity.includes(sv) || toCity.includes(sv)) return true;
    if (sv.includes(fromCity)  || sv.includes(toCity)) return true;

    // from/to city maps to this state via lookup
    const fromState = CITY_TO_STATE[fromCity];
    const toState   = CITY_TO_STATE[toCity];
    if (fromState && (fromState === sv || fromState.includes(sv) || sv.includes(fromState))) return true;
    if (toState   && (toState   === sv || toState.includes(sv)   || sv.includes(toState)))   return true;
  }

  return false;
};

/**
 * Find drivers who have active routes matching the package state.
 * Searches the top-level 'routes' collection (written by InterestedRoutes.jsx).
 */
export const findDriversForHoliday = async (pkgState, pkgName = "") => {
  console.log(`\n[findDriversForHoliday] pkgState="${pkgState}" pkgName="${pkgName}"`);

  const stateVariants = getStateVariants(pkgState, pkgName);
  const driverMap = new Map();

  try {
    const routesSnap = await getDocs(
      query(collection(db, "routes"), where("isActive", "==", true))
    );

    console.log(`[findDriversForHoliday] Active routes in DB: ${routesSnap.size}`);

    routesSnap.forEach((docSnap) => {
      const route = { id: docSnap.id, ...docSnap.data() };
      console.log(`  Route: ${route.from} → ${route.to} | driverId: ${route.driverId}`);

      if (!route.driverId) return;

      if (routeMatchesState(route, stateVariants)) {
        console.log(`  ✅ MATCHED — driver: ${route.driverId}`);
        if (!driverMap.has(route.driverId)) {
          driverMap.set(route.driverId, {
            driverId:     route.driverId,
            driverName:   route.driverName || "Driver",
            matchedRoute: `${route.from}→${route.to}`,
          });
        }
      } else {
        console.log(`  ❌ No match. stateVariants=[${stateVariants.join(", ")}]`);
      }
    });
  } catch (e) {
    console.error("[findDriversForHoliday] Error:", e.message);
  }

  // Fallback: if 0 matched, send to ALL drivers with any active route
  if (driverMap.size === 0) {
    console.warn("[findDriversForHoliday] No state match — falling back to ALL active drivers");
    try {
      const snap = await getDocs(
        query(collection(db, "routes"), where("isActive", "==", true), limit(20))
      );
      snap.forEach((d) => {
        const route = { id: d.id, ...d.data() };
        if (route.driverId && !driverMap.has(route.driverId)) {
          driverMap.set(route.driverId, {
            driverId:     route.driverId,
            driverName:   route.driverName || "Driver",
            matchedRoute: `${route.from}→${route.to}`,
          });
        }
      });
    } catch (e) {
      console.error("[findDriversForHoliday] Fallback error:", e.message);
    }
  }

  const result = [...driverMap.values()];
  console.log(`[findDriversForHoliday] RESULT: ${result.length} driver(s)`, result.map(d => d.driverId));
  return result;
};

/**
 * Send holiday booking notifications to matched drivers.
 * Writes to: users/{driverId}/holidayRequests
 * DriverDashboard listens to this exact path.
 */
export const sendHolidayRideRequests = async (bookingId, drivers, bookingData) => {
  console.log(`[sendHolidayRideRequests] bookingId=${bookingId} drivers=${drivers.length}`);

  if (!drivers || drivers.length === 0) {
    return { success: false, error: "No drivers to notify" };
  }

  const results = await Promise.allSettled(
    drivers.map(async (driver) => {
      const driverId = driver.driverId || driver.id;
      if (!driverId) throw new Error("Driver has no ID");

      const payload = {
        // Critical IDs for DriverDashboard to update holidayBookings
        bookingId,
        holidayBookingId: bookingId,
        parentBookingId:  bookingId,

        // Status & type — must match DriverDashboard query
        status: "searching_driver",
        type:   "holiday",

        // Customer details
        userId:        bookingData.userId    || "",
        userEmail:     bookingData.userEmail || "",
        userName:      bookingData.userName  || "",
        userPhone:     bookingData.userPhone || "",
        customerName:  bookingData.userName  || "",
        customerEmail: bookingData.userEmail || "",

        // Package details for card display
        packageName: bookingData.package?.name     || "",
        duration:    bookingData.package?.duration || "",
        state:       bookingData.state             || "",
        vehicleName: bookingData.vehicle?.name     || bookingData.vehicle?.type || "",
        travelDate:  bookingData.travelDate        || "",
        guests:      bookingData.guests            || 1,
        price:       bookingData.price             || 0,

        // Full nested objects for HolidayRideRequestCard
        package: bookingData.package || null,
        vehicle: bookingData.vehicle || null,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const ref = await addDoc(
        collection(db, "users", driverId, "holidayRequests"),
        payload
      );

      console.log(`✅ Written to users/${driverId}/holidayRequests/${ref.id}`);
      return { driverId, docId: ref.id };
    })
  );

  const succeeded = results.filter((r) => r.status === "fulfilled").length;
  const failed    = results.filter((r) => r.status === "rejected").map((r) => r.reason?.message);

  if (failed.length) console.warn("[sendHolidayRideRequests] Failures:", failed);

  return {
    success:  succeeded > 0,
    notified: succeeded,
    total:    drivers.length,
    error:    succeeded === 0 ? "All writes failed" : null,
  };
};