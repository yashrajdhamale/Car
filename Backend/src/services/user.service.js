import { firestore, FieldValue } from "./firebase.js";

export const createUserProfile = async (payload) => {
  const {
    uid,
    email,
    firstName,
    middleName = "",
    lastName,
    contactNumber1,
    contactNumber2 = "",
    displayName,
  } = payload;

  const finalDisplayName = displayName || [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  const userDocRef = firestore.collection("users").doc(uid);

  const userData = {
    uid,
    displayName: finalDisplayName,
    email,
    phoneNumber: contactNumber1,
    role: "user",
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    firstName,
    middleName,
    lastName,
    contactNumber1,
    contactNumber2,
    emailVerified: false,
  };

  await userDocRef.set(userData, { merge: true });

  return {
    uid,
    displayName: finalDisplayName,
    email,
    role: "user",
    status: "active",
  };
};

export const createAuthUser = async (payload) => {
  const { firebaseAdmin } = await import("./firebase.js");

  const {
    email,
    password,
    displayName,
    phoneNumber,
  } = payload;

  const userRecord = await firebaseAdmin.auth().createUser({
    email,
    password,
    displayName,
    phoneNumber: phoneNumber ? `+91${phoneNumber}` : undefined,
    emailVerified: false,
  });

  return userRecord;
};
