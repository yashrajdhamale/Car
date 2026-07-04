import admin from "firebase-admin";
import dotenv from "dotenv";
dotenv.config();

const resolveStorageBucketName = () => {
  if (process.env.FIREBASE_STORAGE_BUCKET) return process.env.FIREBASE_STORAGE_BUCKET;
  if (process.env.FIREBASE_DEFAULT_STORAGE_BUCKET) return process.env.FIREBASE_DEFAULT_STORAGE_BUCKET;
  if (process.env.FIREBASE_PROJECT_ID) return `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;
  return null;
};

const initializeFirebaseAdmin = () => {
  if (admin.apps.length) return admin;

  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const bucketName = resolveStorageBucketName();
  
  if (serviceAccountJson) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      ...(bucketName ? { storageBucket: bucketName } : {}),
    });
    return admin;
  }

  admin.initializeApp(bucketName ? { storageBucket: bucketName } : undefined);
  return admin;
};

export const firebaseAdmin = initializeFirebaseAdmin();
export const firestore = firebaseAdmin.firestore();
export const FieldValue = firebaseAdmin.firestore.FieldValue;
export const storageBucket = () => {
  const bucketName = resolveStorageBucketName();
  if (!bucketName) {
    throw new Error("FIREBASE_STORAGE_BUCKET or FIREBASE_PROJECT_ID is required for Storage uploads");
  }
  return firebaseAdmin.storage().bucket(bucketName);
};
