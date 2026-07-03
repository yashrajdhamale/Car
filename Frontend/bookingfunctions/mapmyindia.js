const { onRequest } = require("firebase-functions/v2/https");
//const { defineString } = require("firebase-functions/params");
const axios = require("axios");
const admin = require("firebase-admin");
if (!admin.apps.length) {
  admin.initializeApp();
}
admin.firestore().settings({
  ignoreUndefinedProperties: true
});
const RADIUS_KM = {
  LOCAL: 3,
  OUTSTATION: 15,
};
// =============================
// 🔧 Function Options with Secrets
// =============================
const functionOptions = {
  region: "us-central1",
  secrets: ["MAPMYINDIA_CLIENT_ID", "MAPMYINDIA_CLIENT_SECRET"],
};

// =============================
// 🌐 CORS
// =============================
function setCorsHeaders(req, res) {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "https://localhost",
    "https://localhost:5173",
    "https://localhost:3000",
    "https://carzi-holidays-f4be3.web.app",
    "https://carzi-holidays-f4be3.firebaseapp.com",
    "https://cabroute.in.travelogholiday.com",
    "https://cabroute.in",
    "https://www.cabroute.in",
  ];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
  }
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function handleCors(req, res) {
  setCorsHeaders(req, res);
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

// =============================
// 🔐 Env vars
// =============================
//const CLIENT_ID     = defineString("MAPMYINDIA_CLIENT_ID");
//const CLIENT_SECRET = defineString("MAPMYINDIA_CLIENT_SECRET");

// =============================
// 🔑 OAuth Token (cached in memory between warm invocations)
// =============================
let _cachedToken = null;
let _tokenExpiry = 0;

async function generateAccessToken() {
  const now = Date.now();
  if (_cachedToken && now < _tokenExpiry) {
    return _cachedToken;
  }
  try {
    const response = await axios.post(
      "https://outpost.mapmyindia.com/api/security/oauth/token",
      new URLSearchParams({
        grant_type:    "client_credentials",
        client_id:     process.env.MAPMYINDIA_CLIENT_ID,
        client_secret: process.env.MAPMYINDIA_CLIENT_SECRET,
      }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    _cachedToken = response.data.access_token;
    _tokenExpiry = now + (response.data.expires_in - 60) * 1000;
    return _cachedToken;
  } catch (error) {
    console.error("❌ Token Generation Failed:", error.response?.data || error.message);
    throw new Error("Unable to generate MapMyIndia token");
  }
}

// =============================
// 📐 Haversine Distance (km)
// =============================
function haversineKm(lat1, lng1, lat2, lng2) {
  const R    = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// =============================
// ✅ FIXED: Filter Drivers by Radius
//
// KEY CHANGES:
//   1. Drivers with NO coordinates are INCLUDED (can't filter what we can't measure)
//   2. Only drivers WITH coordinates are distance-checked
//   3. Drivers within radius OR with no coords are all returned
// =============================
function filterDriversByRadius(drivers, userLat, userLng, radiusKm = 15) {
  if (!userLat || !userLng) {
    console.warn("⚠️ No user coordinates — returning all drivers unfiltered");
    return drivers;
  }

  const result = [];

  for (const driver of drivers) {
    const dLat =
      driver.latitude ||
      driver.location?.latitude ||
      driver.currentLocation?.lat ||
      driver.coords?.latitude ||
      null;

    const dLng =
      driver.longitude ||
      driver.location?.longitude ||
      driver.currentLocation?.lng ||
      driver.coords?.longitude ||
      null;

    // ✅ FIX: If driver has no coords, INCLUDE them — don't skip
    if (dLat == null || dLng == null) {
      // INCLUDE driver but without distance
      result.push({ ...driver, distanceKm: null, radiusSkipped: true });
      continue;
    }

    const distanceKm = haversineKm(userLat, userLng, dLat, dLng);
    console.log(`📏 Driver ${driver.id} is ${distanceKm.toFixed(2)} km from user`);

    if (distanceKm <= radiusKm) {
      result.push({ ...driver, distanceKm });
    } else {
      console.log(`🚫 Driver ${driver.id} excluded — ${distanceKm.toFixed(2)} km > ${radiusKm} km`);
    }
  }

  // Sort: drivers WITH coords (closest first), then drivers without coords at the end
  result.sort((a, b) => {
    if (a.distanceKm === null && b.distanceKm === null) return 0;
    if (a.distanceKm === null) return 1;
    if (b.distanceKm === null) return -1;
    return a.distanceKm - b.distanceKm;
  });

  return result;
}

// ============================================================
// 🗺️ CORE: resolveELocToCoordinates
// ============================================================
async function resolveELocToCoordinates(eLoc, placeAddress) {
  console.log(`🔍 resolveELocToCoordinates: eLoc=${eLoc}, address="${placeAddress}"`);

  if (!eLoc && !placeAddress) return null;

  const db = admin.firestore();

  // ── Step 1: Firestore cache ──────────────────────────────────────────────
  if (eLoc) {
    try {
      const cached = await db.collection("elocCache").doc(eLoc).get();
      if (cached.exists) {
        const d = cached.data();
        if (d.latitude && d.longitude) {
          console.log(`📦 Cache HIT for ${eLoc}: ${d.latitude}, ${d.longitude}`);
          return { latitude: d.latitude, longitude: d.longitude, source: "cache" };
        }
      }
    } catch (err) {
      console.warn("⚠️ Cache read failed:", err.message);
    }
  }

  let coords = null;
  let token;

  try {
    token = await generateAccessToken();
  } catch (err) {
    console.error("❌ Cannot get OAuth token:", err.message);
    return null;
  }

  // ── Step 2: Place Details API ────────────────────────────────────────────
  if (eLoc && !coords) {
    try {
      console.log(`🔍 [Method 1] Place Details API for eLoc: ${eLoc}`);
      const response = await axios.get(
        `https://explore.mapmyindia.com/apis/O2O/entity/${eLoc}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 8000,
        }
      );

      const data = response.data;
      const lat = parseFloat(data?.latitude  || data?.lat  || 0);
      const lng = parseFloat(data?.longitude || data?.long || data?.lng || 0);

      if (lat && lng && lat !== 0 && lng !== 0) {
        coords = { latitude: lat, longitude: lng, source: "place_details" };
        console.log(`✅ [Method 1] Place Details → ${lat}, ${lng}`);
      } else {
        const eLat = parseFloat(data?.Entry_lat || data?.entry_lat || 0);
        const eLng = parseFloat(data?.Entry_lon || data?.entry_lon || 0);
        if (eLat && eLng) {
          coords = { latitude: eLat, longitude: eLng, source: "place_details_entry" };
          console.log(`✅ [Method 1b] Entry coordinates → ${eLat}, ${eLng}`);
        }
      }
    } catch (err) {
      const status = err.response?.status;
      console.warn(`⚠️ [Method 1] Place Details failed (HTTP ${status}):`, err.response?.data || err.message);
      if (status === 401) {
        _cachedToken = null;
        _tokenExpiry = 0;
      }
    }
  }

  // ── Step 3: Geocode API with full placeAddress ────────────────────────────
  if (!coords && placeAddress) {
    try {
      const response = await axios.get(
        "https://atlas.mapmyindia.com/api/places/geocode",
        {
          headers: { Authorization: `Bearer ${token}` },
          params:  { address: placeAddress, itemCount: 1, region: "IND" },
          timeout: 8000,
        }
      );

      const results = response.data?.copResults || response.data?.results || response.data?.geocodes || [];
      const first   = Array.isArray(results) ? results[0] : results;

      if (first) {
        const lat = parseFloat(first.latitude  || first.lat  || 0);
        const lng = parseFloat(first.longitude || first.long || first.lng || 0);
        if (lat && lng) {
          coords = { latitude: lat, longitude: lng, source: "geocode_address" };
          console.log(`✅ [Method 2] Geocode address → ${lat}, ${lng}`);
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Method 2] Geocode failed:`, err.response?.data || err.message);
    }
  }

  // ── Step 4: Geocode with city-only address ────────────────────────────────
  if (!coords && placeAddress) {
    try {
      const parts = placeAddress.split(",").map(p => p.trim()).filter(Boolean);
      const stateNames = [
        "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", "Delhi",
        "Tamil Nadu", "Kerala", "Goa", "Madhya Pradesh", "Uttar Pradesh",
        "West Bengal", "Telangana", "Andhra Pradesh", "Punjab", "Haryana",
      ];
      let cityQuery = null;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        if (/^\d+$/.test(p)) continue;
        if (stateNames.includes(p)) continue;
        cityQuery = p;
        break;
      }

      if (cityQuery && cityQuery !== placeAddress) {
        const response = await axios.get(
          "https://atlas.mapmyindia.com/api/places/geocode",
          {
            headers: { Authorization: `Bearer ${token}` },
            params:  { address: cityQuery, itemCount: 1, region: "IND" },
            timeout: 8000,
          }
        );

        const results = response.data?.copResults || response.data?.results || response.data?.geocodes || [];
        const first   = Array.isArray(results) ? results[0] : results;
        if (first) {
          const lat = parseFloat(first.latitude  || first.lat  || 0);
          const lng = parseFloat(first.longitude || first.long || first.lng || 0);
          if (lat && lng) {
            coords = { latitude: lat, longitude: lng, source: "geocode_city_fallback" };
            console.log(`✅ [Method 3] City geocode → ${lat}, ${lng}`);
          }
        }
      }
    } catch (err) {
      console.warn(`⚠️ [Method 3] City geocode failed:`, err.message);
    }
  }

  // ── Cache result ─────────────────────────────────────────────────────────
  if (eLoc && coords) {
    try {
      await db.collection("elocCache").doc(eLoc).set({
        latitude:     coords.latitude,
        longitude:    coords.longitude,
        source:       coords.source,
        placeAddress: placeAddress || null,
        cachedAt:     admin.firestore.FieldValue.serverTimestamp(),
      });
    } catch (err) {
      console.error("❌ Cache write failed:", err.message);
    }
  }

  return coords;
}

// =======================================================
// 🔍 1. SEARCH PLACES
// =======================================================
exports.searchPlaces = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const query = req.query.q || req.query.query;
    if (!query) return res.status(400).json({ error: "Query parameter required" });

    const token    = await generateAccessToken();
    const response = await axios.get(
      "https://atlas.mapmyindia.com/api/places/search/json",
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  { query },
      }
    );

    const raw         = response.data;
    const rawList     = raw?.suggestedLocations || raw?.results || [];
    const suggestions = rawList.map((place) => {
      let cityName = place.city || place.cityName || place.addressTokens?.city || "";

      if (!cityName && place.placeAddress) {
        const parts = place.placeAddress.split(",").map(p => p.trim());
        const stateNames = [
          "Maharashtra", "Karnataka", "Gujarat", "Rajasthan", "Delhi",
          "Tamil Nadu", "Kerala", "Goa", "Madhya Pradesh", "Uttar Pradesh",
          "West Bengal", "Telangana", "Andhra Pradesh", "Punjab", "Haryana",
        ];
        for (let i = 1; i < parts.length; i++) {
          const part = parts[i];
          if (/^\d+$/.test(part)) continue;
          if (stateNames.includes(part)) continue;
          if (part.length > 2) { cityName = part; break; }
        }
      }

      return {
        ...place,
        placeName:      place.placeName    || place.name             || place.description || "",
        placeAddress:   place.placeAddress || place.formattedAddress || place.address     || "",
        cityName:       cityName.replace(/ District$/i, "").replace(/ City$/i, "").trim(),
        stateName:      place.state        || place.stateName        || place.addressTokens?.state    || "",
        district:       place.district     || place.addressTokens?.district    || "",
        subLocality:    place.subLocality  || place.addressTokens?.subLocality || "",
        eLoc:           place.eLoc         || place.placeId          || null,
        latitude:       (place.latitude  && place.latitude  !== 0) ? place.latitude  : null,
        longitude:      (place.longitude && place.longitude !== 0) ? place.longitude : null,
        hasCoordinates: !!(place.latitude && place.longitude && place.latitude !== 0 && place.longitude !== 0),
      };
    });

    res.json({ success: true, suggestions });

  } catch (error) {
    console.error("❌ Search Error:", error.response?.data || error.message);
    res.status(500).json({ success: false, error: "Search failed" });
  }
});

// =======================================================
// 📏 2. CALCULATE DISTANCE
// =======================================================
exports.calculateDistance = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const {
      originLat, originLng, originELoc, originAddress,
      destinationLat, destinationLng, destinationELoc, destinationAddress,
    } = req.body;

    let startLat = originLat      ? parseFloat(originLat)      : null;
    let startLng = originLng      ? parseFloat(originLng)      : null;
    let endLat   = destinationLat ? parseFloat(destinationLat) : null;
    let endLng   = destinationLng ? parseFloat(destinationLng) : null;

    if ((!startLat || !startLng) && originELoc) {
      const resolved = await resolveELocToCoordinates(originELoc, originAddress);
      if (!resolved) return res.status(400).json({ error: "Unable to resolve origin" });
      startLat = resolved.latitude;
      startLng = resolved.longitude;
    }

    if ((!endLat || !endLng) && destinationELoc) {
      const resolved = await resolveELocToCoordinates(destinationELoc, destinationAddress);
      if (!resolved) return res.status(400).json({ error: "Unable to resolve destination" });
      endLat = resolved.latitude;
      endLng = resolved.longitude;
    }

    if (!startLat || !startLng || !endLat || !endLng) {
      return res.status(400).json({ error: "Valid coordinates required" });
    }

    console.log(`🗺️ Routing: ${startLat},${startLng} → ${endLat},${endLng}`);

    const token = await generateAccessToken();
    let distanceKm = null;
    let durationMin = null;
    let routeData = null;

    // ✅ Correct MapMyIndia Directions API
    try {
      const response = await axios.get(
        "https://atlas.mapmyindia.com/api/advancedmaps/v1/route_adv/driving",
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            start: `${startLng},${startLat}`,
            end:   `${endLng},${endLat}`,
          },
          timeout: 10000,
        }
      );
      routeData = response.data;
      const route = routeData?.routes?.[0];
      if (route?.distance) {
        distanceKm  = parseFloat((route.distance / 1000).toFixed(2));
        durationMin = Math.round((route.duration || 0) / 60);
        console.log(`✅ Route API success: ${distanceKm} km, ${durationMin} min`);
      }
    } catch (e1) {
      console.warn("⚠️ route_adv failed:", e1.response?.status, e1.message);

      // ✅ Fallback: Atlas route API
      try {
        const response2 = await axios.get(
          "https://atlas.mapmyindia.com/api/advancedmaps/v1/route_adv/driving",
          {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              start: `${startLng},${startLat}`,
              end:   `${endLng},${endLat}`,
            },
            timeout: 10000,
          }
        );
        routeData = response2.data;
        const route2 = routeData?.routes?.[0];
        if (route2?.distance) {
          distanceKm  = parseFloat((route2.distance / 1000).toFixed(2));
          durationMin = Math.round((route2.duration || 0) / 60);
          console.log(`✅ Atlas fallback: ${distanceKm} km`);
        }
      } catch (e2) {
        console.warn("⚠️ Atlas fallback also failed:", e2.message);
      }
    }

    // ✅ Final fallback: Haversine (straight-line × 1.3 road factor)
    if (!distanceKm) {
      console.warn("⚠️ Both APIs failed — using Haversine fallback");
      const straight = haversineKm(startLat, startLng, endLat, endLng);
      distanceKm  = parseFloat((straight * 1.3).toFixed(2)); // road factor
      durationMin = Math.round((distanceKm / 30) * 60);      // ~30 km/h city speed
    }

    res.json({
      success: true,
      distanceKm,
      durationMin,
      route:       routeData,
      origin:      { lat: startLat, lng: startLng },
      destination: { lat: endLat,   lng: endLng },
    });

  } catch (error) {
    console.error("❌ Distance Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Distance calculation failed", detail: error.message });
  }
});

// =======================================================
// 📍 3. REVERSE GEOCODE
// =======================================================
exports.reverseGeocode = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "lat and lng required" });

    const token = await generateAccessToken();
    const response = await axios.get(
      "https://apis.mappls.com/advancedmaps/v1/rev_geocode",
      {
        headers: { Authorization: `Bearer ${token}` },
        params: { lat, lng },
      }
    );

    const result = response.data?.results?.[0];
    res.json({
      success: true,
      place: {
        placeName:    result?.subDistrict || result?.city || "Current Location",
        cityName:     result?.city || result?.district || "My Location",
        stateName:    result?.state || "",
        placeAddress: result?.formatted_address || `${lat}, ${lng}`,
        latitude:     parseFloat(lat),
        longitude:    parseFloat(lng),
      }
    });
  } catch (error) {
    console.error("❌ Reverse Geocode Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Reverse geocode failed" });
  }
});

// =======================================================
// 🗺️ 4. RESOLVE ELOC → COORDINATES
// =======================================================
exports.resolveELoc = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const { eLoc, placeAddress } = req.body;
    if (!eLoc && !placeAddress) {
      return res.status(400).json({ error: "eLoc or placeAddress required" });
    }

    const result = await resolveELocToCoordinates(eLoc, placeAddress);

    if (result) {
      res.json({ success: true, ...result });
    } else {
      res.status(200).json({
        success:      false,
        error:        "Could not resolve coordinates — all methods failed",
        eLoc,
        placeAddress,
      });
    }
  } catch (err) {
    console.error("❌ resolveELoc error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================================================
// 🚗 5. GET NEARBY DRIVERS ✅ FIXED
//
// FIX 1: filterDriversByRadius now INCLUDES drivers with no coords
// FIX 2: assignedRoutes query uses string format to avoid Firestore
//         object-equality issues. Falls back to multiple query strategies.
// =======================================================
exports.getNearbyDrivers = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const {
      fromCity, toCity,
      userELoc, userPlaceAddress,
      userLat, userLng,
      radiusKm = 15,
    } = req.body;

    if (!fromCity || !toCity) {
      return res.status(400).json({ error: "fromCity and toCity required" });
    }

    const db = admin.firestore();

    // ── Resolve user coordinates ─────────────────────────────────────────
    let resolvedLat = userLat ? parseFloat(userLat) : null;
    let resolvedLng = userLng ? parseFloat(userLng) : null;
    let coordSource = "provided";

    if ((!resolvedLat || !resolvedLng) && (userELoc || userPlaceAddress)) {
      console.log(`🔍 Resolving coordinates for eLoc=${userELoc}`);
      const coords = await resolveELocToCoordinates(userELoc, userPlaceAddress);
      if (coords) {
        resolvedLat = coords.latitude;
        resolvedLng = coords.longitude;
        coordSource = coords.source;
        console.log(`📍 Resolved: ${resolvedLat}, ${resolvedLng} via ${coordSource}`);
      } else {
        console.warn("⚠️ Could not resolve user coordinates — radius filter disabled");
      }
    }

    // ── ✅ FIX 2: Multi-strategy driver query ────────────────────────────
    // Firestore array-contains with objects requires EXACT field order match.
    // We try 4 strategies to make sure we catch all drivers.
    // const driversSnap = await db
    //   .collection("users")
    //   .where("role", "==", "driver")
    //   .where("isOnline", "==", true)
    //   .get();

    // const drivers = driversSnap.docs.map(doc => ({
    //   id: doc.id,
    //   ...doc.data()
    // }));
    // const seen       = new Set();

    // const addDrivers = (snap) => {
    //   snap.forEach((doc) => {
    //     if (!seen.has(doc.id)) {
    //       seen.add(doc.id);
    //       drivers.push({ id: doc.id, ...doc.data() });
    //     }
    //   });
    // };

    // // Strategy A: assignedRoutes as objects { from, to }
    // try {
    //   const snap = await driversRef
    //     .where("assignedRoutes", "array-contains", { from: fromCity, to: toCity })
    //     .get();
    //   addDrivers(snap);
    //   console.log(`📋 Strategy A (object): ${snap.size} drivers`);
    // } catch (e) {
    //   console.warn("⚠️ Strategy A failed:", e.message);
    // }

    // // Strategy B: assignedRoutes as plain strings e.g. "Pune-Mumbai"
    // if (drivers.length === 0) {
    //   try {
    //     const routeString = `${fromCity}-${toCity}`;
    //     const snap = await driversRef
    //       .where("assignedRoutes", "array-contains", routeString)
    //       .get();
    //     addDrivers(snap);
    //     console.log(`📋 Strategy B (string "${routeString}"): ${snap.size} drivers`);
    //   } catch (e) {
    //     console.warn("⚠️ Strategy B failed:", e.message);
    //   }
    // }

    // // Strategy C: fromCity field + isOnline
    // if (drivers.length === 0) {
    //   try {
    //     const snap = await driversRef
    //       .where("city", "==", fromCity)
    //       .where("isOnline", "==", true)
    //       .get();
    //     addDrivers(snap);
    //     console.log(`📋 Strategy C (city==${fromCity}): ${snap.size} drivers`);
    //   } catch (e) {
    //     console.warn("⚠️ Strategy C failed:", e.message);
    //   }
    // }

    // // Strategy D: all online drivers (last resort)
    // if (drivers.length === 0) {
    //   try {
    //     const snap = await driversRef
    //       .where("isOnline", "==", true)
    //       .limit(50)
    //       .get();
    //     addDrivers(snap);
    //     console.log(`📋 Strategy D (all online): ${snap.size} drivers`);
    //   } catch (e) {
    //     console.warn("⚠️ Strategy D failed:", e.message);
    //   }
    // }
    const driversSnap = await db
      .collection("users")
      .where("role", "==", "driver")
      .where("isOnline", "==", true)
      .get();

    const drivers = driversSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`🚗 Total unique drivers found: ${drivers.length}`);

    // ── ✅ FIX 1: Apply radius filter (includes drivers with no coords) ───
    let nearbyDrivers = drivers;
    if (resolvedLat && resolvedLng) {
      nearbyDrivers = filterDriversByRadius(drivers, resolvedLat, resolvedLng, radiusKm);
      console.log(`📍 Drivers within ${radiusKm}km (or no coords): ${nearbyDrivers.length}`);
    }

    res.json({
      success:    true,
      total:      drivers.length,
      nearby:     nearbyDrivers.length,
      radiusKm,
      coordSource,
      userCoords: resolvedLat ? { lat: resolvedLat, lng: resolvedLng } : null,
      drivers:    nearbyDrivers.map((d) => ({
        id:            d.id,
        name:          d.name || d.driverName,
        distanceKm:    d.distanceKm != null ? parseFloat(d.distanceKm.toFixed(2)) : null,
        radiusSkipped: d.radiusSkipped || false,
        phone:         d.phone || d.phoneNumber,
        vehicle:       d.vehicle,
        rating:        d.rating,
      })),
    });

  } catch (err) {
    console.error("❌ getNearbyDrivers error:", err);
    res.status(500).json({ error: err.message });
  }
});

// =======================================================
// 🧪 6. DEBUG — tests all resolution methods
// =======================================================
exports.debugResolveELoc = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;

  const eLoc         = req.query.eLoc    || req.body?.eLoc    || "Q7BVIP";
  const placeAddress = req.query.address || req.body?.address || "Swargate, Pune, Maharashtra";

  const results = {
    input:         { eLoc, placeAddress },
    timestamp:     new Date().toISOString(),
    tests:         [],
  };

  let token;
  try {
    token = await generateAccessToken();
    results.tokenGenerated = true;
  } catch (err) {
    return res.status(500).json({ error: "Token failed", message: err.message });
  }

  try {
    const resp = await axios.get(
      `https://explore.mapmyindia.com/apis/O2O/entity/${eLoc}`,
      { headers: { Authorization: `Bearer ${token}` }, timeout: 8000 }
    );
    results.tests.push({
      name:         "Place Details API",
      status:       "✅ SUCCESS",
      coordinates:  { lat: resp.data?.latitude, lng: resp.data?.longitude },
      fullResponse: resp.data,
    });
  } catch (err) {
    results.tests.push({
      name:   "Place Details API",
      status: "❌ FAILED",
      error:  err.response?.data || err.message,
    });
  }

  try {
    const resp = await axios.get(
      "https://atlas.mapmyindia.com/api/places/geocode",
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  { address: placeAddress, itemCount: 1, region: "IND" },
        timeout: 8000,
      }
    );
    const first = resp.data?.copResults?.[0] || resp.data?.results?.[0];
    results.tests.push({
      name:        "Geocode API",
      status:      "✅ SUCCESS",
      coordinates: { lat: first?.latitude, lng: first?.longitude },
    });
  } catch (err) {
    results.tests.push({ name: "Geocode API", status: "❌ FAILED", error: err.message });
  }

  try {
    const result = await resolveELocToCoordinates(eLoc, placeAddress);
    results.tests.push({
      name:   "resolveELocToCoordinates (full chain)",
      status: result ? "✅ SUCCESS" : "❌ FAILED",
      result,
    });
  } catch (err) {
    results.tests.push({ name: "resolveELocToCoordinates", status: "❌ ERROR", error: err.message });
  }

  res.json(results);
});

// =======================================================
// 🧪 7. DEBUG MapMyIndia connectivity
// =======================================================
exports.debugMapMyIndia = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const token = await generateAccessToken();
    res.json({ status: "✅ MapMyIndia working", tokenGenerated: !!token });
  } catch (error) {
    res.status(500).json({ status: "❌ MapMyIndia not working", error: error.message });
  }
});

// =======================================================
// 🧪 8. TEST DISTANCE WITH ELOC
// =======================================================
exports.testDistanceWithELoc = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;
  try {
    const { startELoc, endELoc } = req.query;
    if (!startELoc || !endELoc) return res.status(400).json({ error: "startELoc and endELoc required" });

    const token    = await generateAccessToken();
    const response = await axios.get(
      "https://apis.mappls.com/advancedmaps/v1/route_adv/driving",
      {
        headers: { Authorization: `Bearer ${token}` },
        params:  { start: startELoc, end: endELoc },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error("❌ ELoc Test Error:", error.response?.data || error.message);
    res.status(500).json({ error: "ELoc distance test failed" });
  }
});
exports.createLocalPickupRide = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const {
      userId,
      userName,
      userPhone,
      userEmail,
      pickupLocation,
      dropoffLocation,

       // ✅ ADD THESE
      distance,
      duration,
      totalFare,

      travelDate,
      pickupTime,
      isScheduled = false
    } = req.body;
    if (!userId) {
  return res.status(400).json({
      error: "User must be authenticated"
    });
  }

    if (!pickupLocation?.latitude || !pickupLocation?.longitude) {
      return res.status(400).json({ error: "Pickup coordinates required" });
    }

    const db = admin.firestore();

    // 1️⃣ Create Ride Document
    const rideRef = await db.collection("localRides").add({
      type: "localPickup",
      userId,
      userName,
      userPhone,
      pickupLocation,
      dropoffLocation,

      // ✅ STORE THESE
      distance: Number(distance),
      duration: Number(duration),
      totalFare: Number(totalFare),
      userEmail: userEmail || '',   // ← ADD THIS
      travelDate: travelDate || null,
      pickupTime: pickupTime || null,
      isScheduled: !!isScheduled,
      status: "searching_driver",
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    const rideId = rideRef.id;

    // 2️⃣ Get Nearby Drivers (15km)
    const driversSnapshot = await db
      .collection("users")
      .where("role", "==", "driver")
      .where("isOnline", "==", true)
      .get();

    const drivers = driversSnapshot.docs.map(d => ({
      id: d.id,
      ...d.data()
    }));
    console.log("👥 ONLINE DRIVERS FOUND:", drivers.map(d => ({
      id: d.id,
      lat: d.currentLocation?.lat,
      lng: d.currentLocation?.lng,
      isOnline: d.isOnline,
      role: d.role
    })));

    const nearbyDrivers = filterDriversByRadius(
      drivers,
      pickupLocation.latitude,
      pickupLocation.longitude,
      RADIUS_KM.LOCAL // ✅ 3 km
    );
    console.log("📍 NEARBY DRIVERS AFTER RADIUS FILTER:", nearbyDrivers.map(d => ({
      id: d.id,
      lat: d.currentLocation?.lat,
      lng: d.currentLocation?.lng,
      distanceKm: d.distanceKm ?? null
    })));
    if (nearbyDrivers.length === 0) {
      console.warn("❌ No nearby drivers found — incomingRequests WILL NOT be created");
    }
    // 3️⃣ Create incomingRequests for nearby drivers only
    const batch = db.batch();

    nearbyDrivers.forEach(driver => {
      const incomingRef = db.doc(`users/${driver.id}/incomingRequests/${rideId}`)
      console.log("📨 Writing incomingRequest:", {
        path: `users/${driver.id}/incomingRequests/${rideId}`,
        pickupLat: pickupLocation.latitude,
        pickupLng: pickupLocation.longitude
      });
      batch.set(incomingRef, {
        rideId,
        type: "localPickup",
        status: "pending",

        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: admin.firestore.Timestamp.fromMillis(
          Date.now() + 3 * 60 * 1000 // 3 minutes
        ),

        userId,
        userName,
        userPhone,

        pickupLocation: {
          latitude: pickupLocation.latitude,
          longitude: pickupLocation.longitude,
        },
        userEmail: userEmail || '',   // ← ADD THIS
        dropoffLocation: dropoffLocation || null,
        travelDate: travelDate || null,
        pickupTime: pickupTime || null,
        isScheduled: !!isScheduled,
      });
      console.log("📨 Sending incomingRequest to driver:", {
        driverId: driver.id,
        rideId,
        pickupLocation
      });
    });

    await batch.commit();
    await rideRef.update({ notifiedDriverIds: nearbyDrivers.map(d => d.id) });
    // 4️⃣ Auto-expire ride after 20 seconds if still searching
    const FINDING_WINDOW_MS = 3 * 60 * 1000; // 3 minutes

    setTimeout(async () => {
      try {
        const rideDoc = await db.collection("localRides").doc(rideId).get();
        if (!rideDoc.exists) return;

        if (rideDoc.data().status === "searching_driver") {
          await rideDoc.ref.update({
            status: "no_driver_found",
            expiredAt: admin.firestore.FieldValue.serverTimestamp()
          });
          console.log(`⏰ Ride ${rideId} expired after 3 min`);
        }
      } catch (err) {
        console.error("Expire check failed:", err.message);
      }
    }, FINDING_WINDOW_MS);
    console.log("🚕 Creating local pickup ride:", {
      rideId,
      pickupLocation,
      radius: RADIUS_KM.LOCAL,
      totalDrivers: drivers.length,
      nearbyDrivers: nearbyDrivers.length
    });
    res.json({
      success: true,
      rideId,
      driversNotified: nearbyDrivers.length
    });

  } catch (err) {
    console.error("❌ createLocalPickupRide error:", err);
    res.status(500).json({ error: err.message });
  }
});
exports.acceptLocalRide = onRequest(functionOptions, async (req, res) => {
  if (handleCors(req, res)) return;

  try {
    const {
      rideId,
      driverId,
      driverName,
      driverPhone,
      vehicleType,
      vehicleNumber,
      driverLocation
    } = req.body;

    if (!rideId || !driverId) {
      return res.status(400).json({ error: "rideId and driverId required" });
    }

    const db = admin.firestore();
    const rideRef = db.collection("localRides").doc(rideId);

    await db.runTransaction(async (transaction) => {
      const rideDoc = await transaction.get(rideRef);

      if (!rideDoc.exists) {
        throw new Error("Ride not found");
      }

      const rideData = rideDoc.data();

      // 🚀 HANDLE DUPLICATE ACCEPT SAFELY
      if (rideData.status === "accepted") {
        console.log("⚠️ Ride already accepted, ignoring duplicate request");
        return;
      }

      if (rideData.status !== "searching_driver") {
        console.log("⚠️ Ride not available:", rideData.status);
        return;
      }
          
      // 🔹 Get driver details
      const driverRef = db.collection("users").doc(driverId);
      const driverDoc = await transaction.get(driverRef);
      const driverData = driverDoc.exists ? driverDoc.data() : {};

      transaction.update(rideRef, {
        status: "accepted",

        driverId,

        driverName: driverName || driverData.fullName || driverData.displayName || "Driver",
        driverPhone: driverPhone || driverData.phone || driverData.phoneNumber || "",

        vehicleType: vehicleType || driverData.vehicleType || "",
        vehicleNumber: vehicleNumber || driverData.vehicleNumber || "",

        driverLocation: driverLocation || driverData.currentLocation || null,

        driverLocationUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    });

    
    // Replace everything from:
    // "const rideDoc = await db.collection("localRides")..."
    // to:
    // "await batch.commit();"
    // WITH:

    const updatedRideDoc = await db.collection("localRides").doc(rideId).get();
    const notifiedDriverIds = updatedRideDoc.data()?.notifiedDriverIds || [];

    const batch = db.batch();
    notifiedDriverIds.forEach(notifiedDriverId => {
      const incomingRef = db.doc(`users/${notifiedDriverId}/incomingRequests/${rideId}`);
      batch.update(incomingRef, {
        status: notifiedDriverId === driverId ? "accepted" : "cancelled"
      });
    });
    await batch.commit();

    console.log("🚗 Driver assigned to ride:", {
      rideId,
      driverId,
      driverName,
      vehicleNumber
    });
    res.json({
      success: true,
      rideId,
      driverId
    });

  } catch (error) {
      console.error("❌ acceptLocalRide error:", error);

      res.status(500).json({
        success:false,
        error:error.message || "Internal server error"
      });
    }
});