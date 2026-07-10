import { firestore } from "../services/firebase.js";

export const getDriverIncomingRequests = async (req, res, next) => {
  try {
    const { driverId } = req.params;
    if (!driverId) return res.status(400).json({ success: false, message: "driverId is required" });

    const colRef = firestore.collection("users").doc(driverId).collection("incomingRequests");
    const snapshot = await colRef.get();
    const docs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return res.status(200).json({ success: true, count: docs.length, docs });
  } catch (error) {
    next(error);
  }
};
