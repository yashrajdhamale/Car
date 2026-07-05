import { FieldValue, firestore } from "./firebase.js";

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

export const findSuperAdminByEmail = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) {
    const error = new Error("email is required");
    error.statusCode = 400;
    throw error;
  }

  const snapshot = await firestore
    .collection("users")
    .where("role", "==", "SUPPERADMIN")
    .where("email", "==", normalizedEmail)
    .get();

  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const listAdminPackages = async () => {
  const snapshot = await firestore.collection("test").get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

export const getAdminPackageById = async (packageId) => {
  const snap = await firestore.collection("test").doc(packageId).get();
  if (!snap.exists) return null;
  return { id: snap.id, ...snap.data() };
};

export const updateAdminPackage = async (packageId, data) => {
  await firestore.collection("test").doc(packageId).update({
    ...data,
    updatedAt: FieldValue.serverTimestamp(),
  });
};

export const deleteAdminPackage = async (packageId) => {
  await firestore.collection("test").doc(packageId).delete();
};
