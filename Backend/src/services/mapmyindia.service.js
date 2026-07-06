import dotenv from "dotenv";
import path from "path";

dotenv.config();

const MAPMYINDIA_BASE_URL =
  process.env.MAPMYINDIA_BASE_URL ||
  "https://atlas.mapmyindia.com/api/places";

const MAPMYINDIA_API_KEY = process.env.MAPMYINDIA_API_KEY || "";

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
    // Fall back to API Key if Client ID/Secret is missing
    return MAPMYINDIA_API_KEY;
  }

  try {
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
  } catch (error) {
    console.error("❌ MapmyIndia OAuth token generation failed:", error.message);
    return MAPMYINDIA_API_KEY; // Fallback to static key
  }
}

const requestJson = async (url, options = {}) => {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

const authHeaders = async () => {
  const token = await getMapplsAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const searchPlacesProxy = async (query, options = {}) => {
  const token = await getMapplsAccessToken();
  const url = new URL("https://atlas.mappls.com/api/places/search/json");
  url.searchParams.set("query", query);
  url.searchParams.set("region", options.region || "IND");
  if (options.pod) url.searchParams.set("pod", options.pod);
  return requestJson(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const reverseGeocodeProxy = async (lat, lng) => {
  const token = await getMapplsAccessToken();
  const url = new URL("https://atlas.mappls.com/api/places/reverse_geocode");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  return requestJson(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
};

export const autosuggestProxy = async (query, options = {}) => {
  const token = await getMapplsAccessToken();
  const url = new URL("https://atlas.mappls.com/api/places/autosuggest");
  url.searchParams.set("query", query);
  url.searchParams.set("region", options.region || "IND");
  url.searchParams.set("pod", options.pod || "city");
  if (options.city) url.searchParams.set("city", options.city);
  return requestJson(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });
};

/* ======================
   DISTANCE CALCULATION
   ====================== */
export const calculateDistanceProxy = async ({ originLat, originLng, destinationLat, destinationLng }) => {
  const token = await getMapplsAccessToken();
  const url = `https://atlas.mappls.com/api/advancedmaps/v1/route_adv/driving?start=${originLat},${originLng}&end=${destinationLat},${destinationLng}`;
  
  const data = await requestJson(url, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const route = data.routes?.[0];
  return {
    success: true,
    distance: route ? route.distance / 1000 : 0,
    duration: route ? route.duration / 60 : 0,
  };
};

/* ======================
   RESOLVE ELOC COORDINATES
   ====================== */
export const resolveELocProxy = async ({ eLoc, placeAddress, placeName }) => {
  const token = await getMapplsAccessToken();

  // STEP 1 — Try geocoding with eLoc directly
  if (eLoc) {
    try {
      const url = `https://atlas.mappls.com/api/places/geocode?address=eLoc:${eLoc}`;
      const data = await requestJson(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = data?.copResults;
      if (result?.latitude && result?.longitude) {
        return {
          success: true,
          latitude: Number(result.latitude),
          longitude: Number(result.longitude),
          source: "geocode_eloc",
        };
      }
    } catch (e) {
      console.warn("⚠️ Geocode by eLoc failed:", e.message);
    }
  }

  // STEP 2 — Search and then geocode the hit's eLoc
  const cityName = placeAddress?.split(",")?.slice(-4)?.[0]?.trim() || "";
  const searchQuery = placeName
    ? `${placeName} ${cityName}`.trim()
    : placeAddress?.split(",")?.[0];

  if (searchQuery) {
    try {
      const searchUrl = `https://atlas.mappls.com/api/places/search/json?query=${encodeURIComponent(searchQuery)}`;
      const searchData = await requestJson(searchUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hit = searchData?.suggestedLocations?.[0];

      // STEP 3 — Geocode the hit's eLoc
      if (hit?.eLoc) {
        const geocodeUrl = `https://atlas.mappls.com/api/places/geocode?address=eLoc:${hit.eLoc}`;
        const data2 = await requestJson(geocodeUrl, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const result2 = data2?.copResults;

        if (result2?.latitude && result2?.longitude) {
          return {
            success: true,
            latitude: Number(result2.latitude),
            longitude: Number(result2.longitude),
            source: "search_eloc_geocode",
          };
        }
      }
    } catch (e) {
      console.warn("⚠️ Search and geocode hit failed:", e.message);
    }
  }

  return { success: false, message: "Coordinates not available" };
};
