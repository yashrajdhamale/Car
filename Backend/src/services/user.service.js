import { firestore, FieldValue } from "./firebase.js";

export const createUserProfile = async (payload) => {
  const {
    uid,
    email,
    firstName,
    middleName = "",
    lastName,
    contactNumber1 = "",
    contactNumber2 = "",
    displayName,
    role = "user",
  } = payload;

  const finalDisplayName = displayName || [firstName, middleName, lastName].filter(Boolean).join(" ").trim();
  const userDocRef = firestore.collection("users").doc(uid);

  const userData = {
    uid,
    displayName: finalDisplayName,
    email,
    ...(contactNumber1 ? { phoneNumber: contactNumber1 } : {}),
    role,
    status: "active",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    firstName,
    middleName,
    lastName,
    ...(contactNumber1 ? { contactNumber1 } : {}),
    contactNumber2,
    emailVerified: false,
  };


  await userDocRef.set(userData, { merge: true });

  return {
    uid,
    displayName: finalDisplayName,
    email,
    role,
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
    phoneNumber: phoneNumber
      ? String(phoneNumber).startsWith("+")
        ? String(phoneNumber)
        : `+91${phoneNumber}`
      : undefined,
    emailVerified: false,
  });

  return userRecord;
};

export const syncGoogleAuthUser = async (payload) => {
  const { firebaseAdmin } = await import("./firebase.js");

  const {
    email,
    displayName,
    photoURL,
    phoneNumber,
    uid,
  } = payload;

  const normalizedPhoneNumber =
    phoneNumber && String(phoneNumber).trim()
      ? String(phoneNumber).trim()
      : undefined;

  let userRecord;

  if (uid) {
    try {
      userRecord = await firebaseAdmin.auth().getUser(uid);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }
  }

  if (!userRecord && email) {
    try {
      userRecord = await firebaseAdmin.auth().getUserByEmail(email);
    } catch (error) {
      if (error.code !== "auth/user-not-found") throw error;
    }
  }

  if (userRecord) {
    const updatePayload = {
      displayName,
      photoURL,
      emailVerified: true,
    };

    if (normalizedPhoneNumber) {
      updatePayload.phoneNumber = normalizedPhoneNumber;
    }

    userRecord = await firebaseAdmin.auth().updateUser(userRecord.uid, updatePayload);
  } else {
    const createPayload = {
      uid,
      email,
      displayName,
      photoURL,
      emailVerified: true,
    };

    if (normalizedPhoneNumber) {
      createPayload.phoneNumber = normalizedPhoneNumber;
    }

    userRecord = await firebaseAdmin.auth().createUser(createPayload);
  }

  return userRecord;
};
