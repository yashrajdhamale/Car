import {
  collection,
  getDocs,
  getDoc,
  doc,
} from "firebase/firestore";

import { db } from "../config/firebase";

/*
  Get a state document
*/
export const getHolidayStates = async () => {
  const snap = await getDocs(collection(db, "holidayPackages"));

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};

export const getPackagesByState = async (state) => {
  const snap = await getDocs(
    collection(db, "holidayPackages", state, "packages")
  );

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};


export const getState = async (stateName) => {

  const stateDoc = await getDoc(
    doc(db, "holidayPackages", stateName)
  );

  if (!stateDoc.exists()) return null;

  return stateDoc.data();
};

