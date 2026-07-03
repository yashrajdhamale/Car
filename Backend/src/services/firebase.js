import admin from "firebase-admin";

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) return admin;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
console.log("FIREBASE_SERVICE_ACCOUNT_JSON:", process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  if (serviceAccountJson) {
    admin.initializeApp({
      credential: admin.credential.cert(JSON.parse(serviceAccountJson)),
    });
    return admin;
  }

  admin.initializeApp();
  return admin;
};

export const firebaseAdmin = initializeFirebaseAdmin();
export const firestore = firebaseAdmin.firestore();
export const FieldValue = firebaseAdmin.firestore.FieldValue;
