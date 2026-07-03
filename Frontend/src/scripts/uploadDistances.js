import admin from "firebase-admin";
import serviceAccount from "./serviceAccountKey.json" assert { type: "json" };
import distances from "./distances.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function uploadDistances() {
  const batch = db.batch();

  distances.forEach((item) => {
    const docId = `${item.from}-${item.to}`;
    const docRef = db.collection("distances").doc(docId);
    batch.set(docRef, item);
  });

  await batch.commit();
  console.log("Distances uploaded successfully.");
}

uploadDistances().catch(console.error);
a