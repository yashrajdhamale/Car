import { firebaseAdmin, FieldValue, firestore } from "./firebase.js";

export const setDriverOnlineStatus = async ({ user, status }) => {
  if (!user?.uid) {
    const error = new Error("Authentication required");
    error.statusCode = 401;
    throw error;
  }

  const normalizedStatus = status === "offline" ? "offline" : "active";
  const driverRef = firestore.collection("drivers").doc(user.uid);
  const userRef = firestore.collection("users").doc(user.uid);
  const snapshot = await userRef.get();

  const userData = snapshot.exists ? snapshot.data() || {} : {};
  const isDriver = String(userData.type || userData.role || "").toLowerCase() === "driver";

  if (!isDriver) {
    const error = new Error("Driver account not found");
    error.statusCode = 403;
    throw error;
  }

  const payload = {
    status: normalizedStatus,
    lastOnline: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  await Promise.all([
    driverRef.set(payload, { merge: true }),
    userRef.set({ ...payload, type: "driver", role: userData.role || "driver" }, { merge: true }),
  ]);

  return {
    success: true,
    status: normalizedStatus,
  };
};
