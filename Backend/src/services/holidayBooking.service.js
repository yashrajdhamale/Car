import { firebaseAdmin, firestore, FieldValue } from "./firebase.js";

const DEFAULT_HOLIDAY_INVOICE_URL =
  "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/sendHolidayInvoice";

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

const normalizeText = (value) => String(value || "").toLowerCase().trim();

const getStateVariants = (pkgState, pkgName = "") => {
  const variants = new Set();
  const stateLower = normalizeText(pkgState);
  const nameLower = normalizeText(pkgName);

  if (stateLower) variants.add(stateLower);

  for (const [city, state] of Object.entries(CITY_TO_STATE)) {
    if (nameLower.includes(city) || stateLower.includes(city)) {
      variants.add(state);
    }
  }

  if (stateLower.includes("himachal")) variants.add("himachal pradesh");
  if (stateLower.includes("kashmir") || stateLower.includes("j&k")) variants.add("kashmir");
  if (stateLower.includes("uttarakhand")) variants.add("uttarakhand");
  if (stateLower.includes("kerala")) variants.add("kerala");
  if (stateLower.includes("rajasthan")) variants.add("rajasthan");
  if (stateLower.includes("goa")) variants.add("goa");

  return [...variants];
};

const routeMatchesState = (route, stateVariants) => {
  const fromCity = normalizeText(route.from);
  const toCity = normalizeText(route.to);
  const routeState = normalizeText(route.state);

  for (const sv of stateVariants) {
    if (routeState && (routeState.includes(sv) || sv.includes(routeState))) return true;

    if (fromCity.includes(sv) || toCity.includes(sv)) return true;
    if (sv.includes(fromCity) || sv.includes(toCity)) return true;

    const fromState = CITY_TO_STATE[fromCity];
    const toState = CITY_TO_STATE[toCity];

    if (fromState && (fromState === sv || fromState.includes(sv) || sv.includes(fromState))) return true;
    if (toState && (toState === sv || toState.includes(sv) || sv.includes(toState))) return true;
  }

  return false;
};

const getDriverRoutesSnapshot = async () => {
  return firestore.collection("routes").where("isActive", "==", true).get();
};

export const getHolidayBookingById = async (bookingId) => {
  const snapshot = await firestore.collection("holidayBookings").doc(bookingId).get();

  if (!snapshot.exists) return null;

  return {
    id: snapshot.id,
    ...snapshot.data(),
  };
};

export const findDriversForHoliday = async (pkgState, pkgName = "") => {
  const stateVariants = getStateVariants(pkgState, pkgName);
  const driverMap = new Map();

  try {
    const routesSnap = await getDriverRoutesSnapshot();

    routesSnap.forEach((docSnap) => {
      const route = { id: docSnap.id, ...docSnap.data() };

      if (!route.driverId) return;

      if (routeMatchesState(route, stateVariants)) {
        if (!driverMap.has(route.driverId)) {
          driverMap.set(route.driverId, {
            driverId: route.driverId,
            driverName: route.driverName || "Driver",
            matchedRoute: `${route.from || ""}→${route.to || ""}`,
          });
        }
      }
    });
  } catch (error) {
    console.error("[holidayBooking] driver lookup failed:", error);
  }

  if (driverMap.size === 0) {
    try {
      const routesSnap = await firestore.collection("routes").where("isActive", "==", true).limit(20).get();

      routesSnap.forEach((docSnap) => {
        const route = { id: docSnap.id, ...docSnap.data() };

        if (route.driverId && !driverMap.has(route.driverId)) {
          driverMap.set(route.driverId, {
            driverId: route.driverId,
            driverName: route.driverName || "Driver",
            matchedRoute: `${route.from || ""}→${route.to || ""}`,
          });
        }
      });
    } catch (error) {
      console.error("[holidayBooking] fallback driver lookup failed:", error);
    }
  }

  return [...driverMap.values()];
};

export const sendHolidayRideRequests = async (bookingId, drivers, bookingData) => {
  if (!drivers || drivers.length === 0) {
    return { success: false, notified: 0, total: 0, error: "No drivers to notify" };
  }

  const results = await Promise.allSettled(
    drivers.map(async (driver) => {
      const driverId = driver.driverId || driver.id;
      if (!driverId) {
        throw new Error("Driver has no ID");
      }

      const payload = {
        bookingId,
        holidayBookingId: bookingId,
        parentBookingId: bookingId,
        status: "searching_driver",
        type: "holiday",
        userId: bookingData.userId || "",
        userEmail: bookingData.userEmail || "",
        userName: bookingData.userName || "",
        userPhone: bookingData.userPhone || "",
        customerName: bookingData.userName || "",
        customerEmail: bookingData.userEmail || "",
        packageName: bookingData.package?.name || "",
        duration: bookingData.package?.duration || "",
        state: bookingData.state || "",
        vehicleName: bookingData.vehicle?.name || bookingData.vehicle?.type || "",
        travelDate: bookingData.travelDate || "",
        guests: bookingData.guests || 1,
        price: bookingData.price || 0,
        package: bookingData.package || null,
        vehicle: bookingData.vehicle || null,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const ref = await firestore.collection("users").doc(driverId).collection("holidayRequests").add(payload);

      return { driverId, docId: ref.id };
    })
  );

  const succeeded = results.filter((result) => result.status === "fulfilled").length;
  const failed = results
    .filter((result) => result.status === "rejected")
    .map((result) => result.reason?.message)
    .filter(Boolean);

  return {
    success: succeeded > 0,
    notified: succeeded,
    total: drivers.length,
    error: succeeded === 0 ? "All writes failed" : failed[0] || null,
    failed,
  };
};

export const markHolidayBookingPaymentCompleted = async ({ bookingId, user, body = {} }) => {
  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const snapshot = await firestore.collection("holidayBookings").doc(bookingId).get();
  if (!snapshot.exists) {
    const error = new Error("Holiday booking not found");
    error.statusCode = 404;
    throw error;
  }

  const booking = snapshot.data();
  if (booking.userId && booking.userId !== user.uid) {
    const error = new Error("You do not have access to this holiday booking");
    error.statusCode = 403;
    throw error;
  }

  await firestore.collection("holidayBookings").doc(bookingId).set(
    {
      status: "payment_completed",
      paymentStatus: "completed",
      paymentDate: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      ...(body?.transactionId ? { transactionId: body.transactionId } : {}),
    },
    { merge: true }
  );

  const updated = await firestore.collection("holidayBookings").doc(bookingId).get();
  return {
    success: true,
    booking: { id: updated.id, ...updated.data() },
  };
};

export const createHolidayBooking = async ({ user, body }) => {
  const packageData = body?.package || {};
  const vehicleData = body?.vehicle || {};
  const travelDate = String(body?.travelDate || "").trim();
  const userName = String(body?.userName || body?.name || "").trim();
  const userPhone = String(body?.userPhone || body?.phone || "").replace(/\D/g, "").trim();
  const guests = Number(body?.guests || 1);
  const price = Number(body?.price || 0);
  const state = String(body?.state || packageData.state || packageData.location?.state || "").trim();

  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!userName || !userPhone || !travelDate) {
    const error = new Error("name, phone, and travelDate are required");
    error.statusCode = 400;
    throw error;
  }

  if (!packageData || Object.keys(packageData).length === 0) {
    const error = new Error("package details are required");
    error.statusCode = 400;
    throw error;
  }

  if (!vehicleData || Object.keys(vehicleData).length === 0) {
    const error = new Error("vehicle details are required");
    error.statusCode = 400;
    throw error;
  }

  const bookingData = {
    userId: user.uid,
    userEmail: user.email || body?.userEmail || "",
    userName,
    userPhone,
    travelDate,
    package: packageData,
    vehicle: vehicleData,
    guests: Number.isFinite(guests) && guests > 0 ? guests : 1,
    price: Number.isFinite(price) ? price : 0,
    state,
    status: "searching_driver",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const bookingRef = await firestore.collection("holidayBookings").add(bookingData);
  const bookingId = bookingRef.id;

  const pkgName = packageData?.name || "";
  const drivers = await findDriversForHoliday(state, pkgName);

  if (!drivers.length) {
    await bookingRef.update({
      status: "no_driver_available",
      updatedAt: FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      bookingId,
      status: "no_driver_available",
      notified: 0,
      totalDrivers: 0,
      message: "No active drivers matched this holiday route",
    };
  }

  const notificationResult = await sendHolidayRideRequests(bookingId, drivers, bookingData);

  const finalStatus = notificationResult.success ? "searching_driver" : "no_driver_available";

  await bookingRef.update({
    status: finalStatus,
    totalDriversNotified: notificationResult.notified,
    driverSearchStartedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    ...(notificationResult.error ? { notificationError: notificationResult.error } : {}),
  });

  return {
    success: true,
    bookingId,
    status: finalStatus,
    notified: notificationResult.notified,
    totalDrivers: drivers.length,
    failedDrivers: notificationResult.failed || [],
  };
};

export const sendHolidayInvoiceForBooking = async ({ user, bookingId, body }) => {
  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    throw error;
  }

  const bookingSnapshot = await firestore.collection("holidayBookings").doc(bookingId).get();

  if (!bookingSnapshot.exists) {
    const error = new Error("Holiday booking not found");
    error.statusCode = 404;
    throw error;
  }

  const booking = bookingSnapshot.data() || {};

  if (booking.userId && booking.userId !== user.uid) {
    const error = new Error("You do not have access to this holiday booking");
    error.statusCode = 403;
    throw error;
  }

  const invoiceUrl = process.env.HOLIDAY_INVOICE_FUNCTION_URL || DEFAULT_HOLIDAY_INVOICE_URL;

  const payload = {
    to: body?.to || user.email || booking.userEmail || "",
    customerName: body?.customerName || booking.userName || "",
    customerPhone: body?.customerPhone || booking.userPhone || "",
    bookingId,
    packageName: body?.packageName || booking.package?.name || "",
    duration: body?.duration || booking.package?.duration || "",
    vehicle: body?.vehicle || booking.vehicle?.name || booking.vehicle?.type || "",
    travelDate: body?.travelDate || booking.travelDate || "",
    guests: body?.guests || booking.guests || 1,
    price: Number(body?.price ?? booking.price ?? 0),
    state: body?.state || booking.state || "",
    driverName: body?.driverName || booking.driverInfo?.name || "",
    driverPhone: body?.driverPhone || booking.driverInfo?.phone || "",
    itinerary: Array.isArray(body?.itinerary)
      ? body.itinerary
      : Array.isArray(booking.package?.itinerary)
        ? booking.package.itinerary
        : [],
  };

  if (!payload.to || !payload.to.includes("@")) {
    const error = new Error(`Invalid email: "${payload.to}"`);
    error.statusCode = 400;
    throw error;
  }

  await firestore.collection("holidayBookings").doc(bookingId).update({
    paymentStatus: "paid",
    paymentConfirmedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });

  const response = await fetch(invoiceUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.error || result?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }

  if (!result.success) {
    const error = new Error(result?.error || "Invoice function failed");
    error.statusCode = 502;
    throw error;
  }

  return {
    success: true,
    bookingId,
    invoice: result,
  };
};

export const approveHolidayBooking = async ({ bookingId, body = {} }) => {
  if (!bookingId) {
    const error = new Error("bookingId is required");
    error.statusCode = 400;
    throw error;
  }

  const bookingSnapshot = await firestore.collection("holidayBookings").doc(bookingId).get();
  if (!bookingSnapshot.exists) {
    const error = new Error("Holiday booking not found");
    error.statusCode = 404;
    throw error;
  }

  const confirmationDate = body?.confirmation_Date || body?.confirmationDate || new Date().toLocaleDateString();
  await firestore.collection("holidayBookings").doc(bookingId).set(
    {
      apporval: body?.apporval || "Confirmed",
      approval: body?.approval || "Confirmed",
      confirmation_Date: confirmationDate,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  const updated = await firestore.collection("holidayBookings").doc(bookingId).get();
  return { success: true, booking: { id: updated.id, ...updated.data() } };
};
