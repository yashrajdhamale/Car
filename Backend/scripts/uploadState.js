import admin from "firebase-admin";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import serviceAccount from "../serviceAccountKey.json" with { type: "json" };

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

const dataFolder = path.join(__dirname, "../data");

async function uploadState(fileName) {
  const filePath = path.join(dataFolder, fileName);

  const state = JSON.parse(
    fs.readFileSync(filePath, "utf8")
  );

  console.log(`\n📦 Uploading ${state.name}...`);

  const stateRef = db.collection("holidayPackages").doc(state.name);

  // Update state information
  await stateRef.set({
    name: state.name,
    keywords: state.keywords || [],
    bgImage: state.bgImage || "",
  });

  // Delete ALL existing packages first
  const existingPackages = await stateRef.collection("packages").get();

  const batch = db.batch();

  existingPackages.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  console.log(`🗑 Deleted ${existingPackages.size} old package(s)`);

  // Upload packages from JSON
  for (const pkg of state.packages) {
    const id = pkg.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    await stateRef
      .collection("packages")
      .doc(id)
      .set(pkg);

    console.log(`✔ Uploaded ${pkg.name}`);
  }

  console.log(`✅ ${state.name} uploaded successfully.`);
}

async function uploadAllStates() {
  const files = fs
    .readdirSync(dataFolder)
    .filter((file) => file.endsWith(".json"));

  console.log(`Found ${files.length} state file(s).\n`);

  for (const file of files) {
    await uploadState(file);
  }

  console.log("\n🎉 All holiday packages uploaded successfully.");
}

uploadAllStates().catch(console.error);