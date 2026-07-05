import { firebaseAdmin } from "./firebase.js";

const routesCollection = () => firebaseAdmin.firestore().collection("routes");

export const listRoutesByDriver = async (driverId) => {
  const snapshot = await routesCollection().where("driverId", "==", driverId).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const createRoute = async ({ driverId, driverName, from, to, rate, radiusKm = 30, active = true, vehicle }) => {
  const timestamp = firebaseAdmin.firestore.FieldValue.serverTimestamp();
  const docRef = await routesCollection().add({
    driverId,
    driverName: driverName || "",
    from,
    to,
    rate: rate === "" || rate === null || rate === undefined ? null : Number(rate),
    radiusKm: radiusKm === "" || radiusKm === null || radiusKm === undefined ? 30 : Number(radiusKm),
    active: active !== false,
    vehicle: vehicle || null,
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  return docRef.id;
};

export const updateRouteById = async (routeId, updates = {}) => {
  const payload = {
    ...updates,
    updatedAt: firebaseAdmin.firestore.FieldValue.serverTimestamp(),
  };

  if (Object.prototype.hasOwnProperty.call(updates, "rate")) {
    payload.rate = updates.rate === "" || updates.rate === null || updates.rate === undefined ? null : Number(updates.rate);
  }

  if (Object.prototype.hasOwnProperty.call(updates, "radiusKm")) {
    payload.radiusKm = updates.radiusKm === "" || updates.radiusKm === null || updates.radiusKm === undefined ? null : Number(updates.radiusKm);
  }

  await routesCollection().doc(routeId).update(payload);
};

export const deleteRouteById = async (routeId) => {
  await routesCollection().doc(routeId).delete();
};

export const listCities = async () => {
  const snapshot = await firebaseAdmin.firestore().collection("cities").get();
  return snapshot.docs.map((doc) => doc.data().name).filter(Boolean);
};
