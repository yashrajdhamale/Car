import { FieldValue, firestore } from "./firebase.js";

const logOutstation = (message, meta = {}) => {
  console.log(`[OutstationBooking] ${message}`, meta);
};

const normalizeLocation = (location) => {
  if (!location) return "";
  if (typeof location === "string") return location.toLowerCase().trim();
  return String(location.name || location.address || location.cityName || location.displayAddress || "")
    .toLowerCase()
    .trim();
};

const getDriversForRoute = async ({ pickupCity, destinationCity }) => {
  const driversSnapshot = await firestore.collection("drivers").get();
  const matches = [];
  const pickupNorm = normalizeLocation(pickupCity);
  const destinationNorm = normalizeLocation(destinationCity);

  logOutstation("Finding drivers for route", {
    pickupCity,
    destinationCity,
    pickupNorm,
    destinationNorm,
    totalDrivers: driversSnapshot.size,
  });

  for (const driverDoc of driversSnapshot.docs) {
    const driverData = driverDoc.data();
    const status = String(driverData.status || "unknown").toLowerCase();
    const isEligibleStatus = driverData.isOnline || ["available", "online", "active"].includes(status);

    // Query routes from top-level /routes collection for this driver
    const driverRoutesSnapshot = await firestore.collection("routes").where("driverId", "==", driverDoc.id).get();
    const allRoutes = driverRoutesSnapshot.docs.map((routeDoc) => routeDoc.data());

    const matched = allRoutes.some((route) => {
      const routeFrom = normalizeLocation(route.from);
      const routeTo = normalizeLocation(route.to);
      return (
        (routeFrom === pickupNorm && routeTo === destinationNorm) ||
        (routeFrom === destinationNorm && routeTo === pickupNorm)
      );
    });

    logOutstation("Driver route scan", {
      driverId: driverDoc.id,
      status,
      isOnline: Boolean(driverData.isOnline),
      driverRoutes: allRoutes.length,
      matched,
      routes: allRoutes.map((route) => ({ from: route.from, to: route.to })),
    });

    if (matched) {
      if (!isEligibleStatus) {
        logOutstation("Driver route matched but status is not online/active; notifying anyway", {
          driverId: driverDoc.id,
          status,
          isOnline: Boolean(driverData.isOnline),
        });
      }

      matches.push({ id: driverDoc.id, ...driverData });
    }
  }

  logOutstation("Driver lookup complete", {
    matchedDrivers: matches.length,
    driverIds: matches.map((driver) => driver.id),
  });

  return matches;
};

const buildDriverRequest = ({ bookingId, rideData, driver }) => {
  const now = new Date();
  const scheduleDate = rideData.rideType === "schedule" && rideData.scheduledDateTime
    ? new Date(rideData.scheduledDateTime)
    : now;

  return {
    bookingId,
    type: "outstation",
    from: rideData.pickupCityForDriver || rideData.pickupCity?.split(",")[0]?.trim() || "",
    fromSublocality: rideData.pickupSublocality || null,
    to: rideData.destinationCityForDriver || rideData.destinationCity?.split(",")[0]?.trim() || "",
    toSublocality: rideData.destinationSublocality || null,
    pickupCoordinates: rideData.pickupCoordinates || null,
    pickupLocation: rideData.pickupSublocalityAddress || rideData.pickupCity,
    fare: rideData.totalPrice,
    basePrice: rideData.basePrice,
    gstAmount: rideData.gstAmount,
    createdAt: FieldValue.serverTimestamp(),
    destinationSublocalityAddress: rideData.destinationSublocalityAddress || rideData.destinationCity,
    carName: rideData.car?.name || "",
    passengerCount: rideData.passengerCount,
    distance: rideData.distance,
    days: rideData.days,
    userName: rideData.userName || "Customer",
    userPhone: rideData.userPhone || "Not provided",
    userEmail: rideData.userEmail || "",
    date: scheduleDate.toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
    time: scheduleDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
    bookingTime: now.toISOString(),
    vehicle: { name: rideData.car?.name || "", capacity: rideData.car?.capacity || 0, type: String(rideData.car?.name || "Car").split(" ")[0] },
    tripType: "outstation",
    duration: rideData.days > 1 ? `${rideData.days} days` : "1 day",
    status: "pending",
    requestedAt: FieldValue.serverTimestamp(),
    bookingReference: bookingId,
    rideType: rideData.rideType,
    rideDate: rideData.rideDate,
    rideTime: rideData.rideTime,
    scheduledDateTime: rideData.scheduledDateTime || null,
    isScheduled: rideData.rideType === "schedule",
    driverMessage: rideData.rideType === "schedule" ? "Scheduled ride request" : "Immediate ride request",
    requiresPayment: rideData.rideType === "schedule",
    paymentStatus: rideData.rideType === "schedule" ? "pending" : null,
  };
};

export const createOutstationBooking = async ({ user, body }) => {
  logOutstation("Create booking requested", {
    authenticatedUserId: user?.uid || null,
    bodyUserId: body?.userId || null,
    pickupCity: body?.pickupCity,
    pickupCityForDriver: body?.pickupCityForDriver,
    destinationCity: body?.destinationCity,
    destinationCityForDriver: body?.destinationCityForDriver,
    rideType: body?.rideType,
    status: body?.status,
  });

  const payload = {
    ...body,
    userId: user?.uid || body?.userId || "guest",
    userName: body?.userName || user?.displayName || "Customer",
    userPhone: body?.userPhone || user?.phoneNumber || "",
    userEmail: body?.userEmail || user?.email || "",
    status: body?.status || "searching_driver",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  const bookingRef = await firestore.collection("bookings").add(payload);
  logOutstation("Created bookings document", {
    bookingId: bookingRef.id,
    status: payload.status,
  });

  const assignedDrivers = await getDriversForRoute({
    pickupCity: payload.pickupCityForDriver || payload.pickupCity,
    destinationCity: payload.destinationCityForDriver || payload.destinationCity,
  });

  await Promise.all(
    assignedDrivers.map(async (driver) => {
      const requestData = buildDriverRequest({ bookingId: bookingRef.id, rideData: payload, driver });
      await firestore.collection("drivers").doc(driver.id).collection("incomingRequests").doc(bookingRef.id).set(requestData);
      logOutstation("Incoming request written", {
        bookingId: bookingRef.id,
        driverId: driver.id,
        targetPath: `drivers/${driver.id}/incomingRequests/${bookingRef.id}`,
        requestStatus: requestData.status,
      });
    })
  );

  await firestore.collection("bookings").doc(bookingRef.id).set(
    {
      bookingId: bookingRef.id,
      assignedDrivers: assignedDrivers.map((driver) => driver.id),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  logOutstation("Create booking flow complete", {
    bookingId: bookingRef.id,
    assignedDrivers: assignedDrivers.map((driver) => driver.id),
  });

  return {
    success: true,
    bookingId: bookingRef.id,
    assignedDrivers: assignedDrivers.map((driver) => driver.id),
  };
};
