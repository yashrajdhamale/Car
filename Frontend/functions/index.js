import { onRequest } from "firebase-functions/v2/https";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import dotenv from "dotenv";
import path from "path";
import checkExpiredBookings from "./checkExpiredBookings.js";
import { reverseGeocode } from "./src/reverseGeocode.js";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });

/* ======================
   FIREBASE INIT
====================== */
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = getFirestore();

/* ======================
   CORS
====================== */
const setCors = (res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
};

/* ======================
   MAPPLS OAUTH TOKEN
====================== */
let cachedToken = null;
let tokenExpiry = 0;

async function getMapplsAccessToken() {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.MAPMYINDIA_CLIENT_ID;
  const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Mappls OAuth credentials missing");
  }

  const r = await fetch(
    "https://outpost.mappls.com/api/security/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    }
  );

  if (!r.ok) {
    throw new Error(`OAuth token error ${r.status}`);
  }

  const data = await r.json();

  cachedToken = data.access_token;
  tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

  return cachedToken;
}

/* ======================
   MAPPLS O2O PLACE DETAIL
====================== */
async function getPlaceFromELoc(eLoc, placeAddress = "") {
  const token = await getMapplsAccessToken();

  // Try geocode with address
  if (placeAddress) {
    try {
      const geo = await fetch(
        `https://atlas.mappls.com/api/places/geocode?address=${encodeURIComponent(placeAddress)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const geoData = await geo.json();
      const first = geoData?.copResults;

      if (first?.latitude && first?.longitude) {
        return {
          lat: Number(first.latitude),
          lng: Number(first.longitude),
          placeName: first.poi || first.locality || "",
          address: first.formattedAddress,
          eLoc,
        };
      }
    } catch (err) {
      console.warn("Geocode fallback failed");
    }
  }

  return { lat: null, lng: null, eLoc };
}

/* ======================
   CRON JOB
====================== */
const checkExpiredBookingsJob = onSchedule(
  { schedule: "every 1 minutes", region: "asia-south1" },
  () => checkExpiredBookings()
);

export { getPlaceFromELoc, checkExpiredBookingsJob, reverseGeocode };

/* ======================
   DRIVER ASSIGN
====================== */
export const onLocalRideCreated = onDocumentCreated(
  {
    document: "localRides/{rideId}",
    region: "asia-south1",
  },
  async (event) => {
    const ride = event.data?.data();
    if (!ride || ride.status !== "SEARCHING_DRIVER") return;

    if (!ride.pickup?.lat || !ride.pickup?.lng) {
      const place = await getPlaceFromELoc(ride.pickup.eLoc);

      await db.collection("localRides").doc(event.params.rideId).update({
        "pickup.lat": place.lat,
        "pickup.lng": place.lng,
      });
    }
  }
);

/* ======================
   PLACE DETAILS API
====================== */
export const getPlaceDetails = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const eloc = req.query?.eloc;
      if (!eloc) {
        return res.status(400).json({ success: false });
      }

      const place = await getPlaceFromELoc(eloc, req.query?.address);

if (!place.lat || !place.lng) {
  return res.json({
    success: false,
    message: "Coordinates not available",
  });
}

res.json({
  success: true,
  ...place,
});
    } catch (err) {
      console.error("❌ getPlaceDetails:", err.message);
      res.status(500).json({ success: false });
    }
  }
);
/* ======================
   SEARCH PLACES API
====================== */
export const searchPlaces = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const query = req.query.q;
      if (!query) return res.status(400).json({ success: false });

      const token = await getMapplsAccessToken();

      const r = await fetch(
        `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(query)}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await r.json();

      res.json({
        success: true,
        suggestions: data.suggestedLocations || [],
      });
    } catch (err) {
      console.error("❌ searchPlaces:", err);
      res.status(500).json({ success: false });
    }
  }
);


/* ======================
   DISTANCE API
====================== */
export const calculateDistance = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const { pickupLat, pickupLng, dropLat, dropLng } = req.query;

      if (!pickupLat || !dropLat) {
        return res.status(400).json({ success: false });
      }

      const token = await getMapplsAccessToken();

      const r = await fetch(
        `https://atlas.mappls.com/api/advancedmaps/v1/route_adv/driving?start=${pickupLat},${pickupLng}&end=${dropLat},${dropLng}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await r.json();

      const route = data.routes?.[0];

      res.json({
        success: true,
        distance: route?.distance / 1000,
        duration: route?.duration / 60,
      });
    } catch (err) {
      console.error("❌ calculateDistance:", err);
      res.status(500).json({ success: false });
    }
  }
);
export const resolveELoc = onRequest(
  { region: "asia-south1" },
  async (req, res) => {
    setCors(res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    try {
      const { eLoc, placeAddress, placeName } = req.body || {};
      if (!eLoc && !placeAddress) {
        return res.status(400).json({ success: false, message: "eLoc or placeAddress required" });
      }

      const token = await getMapplsAccessToken();

      // STEP 1 — Try geocoding with eLoc directly
      if (eLoc) {
        const r = await fetch(
          `https://atlas.mappls.com/api/places/geocode?address=eLoc:${eLoc}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await r.json();
        const result = data?.copResults;
        console.log("GEOCODE BY ELOC:", JSON.stringify(result));

        if (result?.latitude && result?.longitude) {
          return res.json({
            success: true,
            latitude: Number(result.latitude),
            longitude: Number(result.longitude),
            source: "geocode_eloc",
          });
        }
      }

      // STEP 2 — Search and then geocode the hit's eLoc
      const cityName = placeAddress?.split(",")?.slice(-4)?.[0]?.trim() || "";
      const searchQuery = placeName
        ? `${placeName} ${cityName}`.trim()
        : placeAddress?.split(",")?.[0];

      if (searchQuery) {
        const searchRes = await fetch(
          `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(searchQuery)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const searchData = await searchRes.json();
        const hit = searchData?.suggestedLocations?.[0];
        console.log("SEARCH HIT:", JSON.stringify(hit));

        // STEP 3 — Geocode the hit's eLoc
        if (hit?.eLoc) {
          const r2 = await fetch(
            `https://atlas.mappls.com/api/places/geocode?address=eLoc:${hit.eLoc}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const data2 = await r2.json();
          const result2 = data2?.copResults;
          console.log("GEOCODE FROM SEARCH ELOC:", JSON.stringify(result2));

          if (result2?.latitude && result2?.longitude) {
            return res.json({
              success: true,
              latitude: Number(result2.latitude),
              longitude: Number(result2.longitude),
              source: "search_eloc_geocode",
            });
          }
        }
      }

      return res.json({ success: false, message: "Coordinates not available" });

    } catch (err) {
      console.error("❌ resolveELoc:", err);
      return res.status(500).json({ success: false, message: "Internal error" });
    }
  }
);
