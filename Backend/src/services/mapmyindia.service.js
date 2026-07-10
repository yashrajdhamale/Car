import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   MAPPLS / MAPMYINDIA CONFIGURATION
   ========================================================= */

const MAPMYINDIA_API_KEY =
  process.env.MAPMYINDIA_API_KEY || "";

let cachedToken = null;
let tokenExpiry = 0;


/* =========================================================
   OAUTH ACCESS TOKEN
   ========================================================= */

async function getMapplsAccessToken() {
  const now = Date.now();

  if (cachedToken && now < tokenExpiry) {
    return cachedToken;
  }

  const clientId = process.env.MAPMYINDIA_CLIENT_ID;
  const clientSecret = process.env.MAPMYINDIA_CLIENT_SECRET;

  /*
   * Prefer OAuth credentials.
   * Fall back to API key only when OAuth credentials
   * are not configured.
   */

  if (!clientId || !clientSecret) {
    if (!MAPMYINDIA_API_KEY) {
      throw new Error(
        "Mappls credentials missing. Configure MAPMYINDIA_CLIENT_ID and MAPMYINDIA_CLIENT_SECRET."
      );
    }

    return MAPMYINDIA_API_KEY;
  }

  try {
    const response = await fetch(
      "https://outpost.mapmyindia.com/api/security/oauth/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: clientId,
          client_secret: clientSecret,
        }),
      }
    );

    const rawText = await response.text();

    let data = {};

    try {
      data = rawText
        ? JSON.parse(rawText)
        : {};
    } catch {
      data = {
        rawResponse: rawText,
      };
    }

    if (!response.ok) {
      console.error(
        "❌ Mappls OAuth Error:",
        {
          status: response.status,
          response: data,
        }
      );

      throw new Error(
        data?.error_description ||
        data?.error ||
        `OAuth token request failed (${response.status})`
      );
    }

    if (!data.access_token) {
      throw new Error(
        "Mappls OAuth response did not contain access_token"
      );
    }

    cachedToken = data.access_token;

    const expiresIn =
      Number(data.expires_in) || 3600;

    tokenExpiry =
      now +
      Math.max(expiresIn - 60, 60) * 1000;

    console.log(
      "✅ Mappls OAuth token generated successfully"
    );

    return cachedToken;

  } catch (error) {

    cachedToken = null;
    tokenExpiry = 0;

    console.error(
      "❌ Mappls OAuth token generation failed:",
      error.message
    );

    /*
     * Only use API key fallback when one actually exists.
     */

    if (MAPMYINDIA_API_KEY) {
      console.warn(
        "⚠️ Falling back to MAPMYINDIA_API_KEY"
      );

      return MAPMYINDIA_API_KEY;
    }

    throw error;
  }
}


/* =========================================================
   COMMON REQUEST HANDLER
   ========================================================= */

const requestJson = async (
  url,
  options = {}
) => {

  console.log(
    `🌐 Mappls Request: ${url}`
  );

  const response =
    await fetch(url, options);

  const rawText =
    await response.text();

  let data = {};

  try {

    data = rawText
      ? JSON.parse(rawText)
      : {};

  } catch {

    data = {
      rawResponse: rawText,
    };

  }

  if (!response.ok) {

    console.error(
      "❌ Mappls API Error:",
      {
        url,
        status: response.status,
        statusText:
          response.statusText,
        response: data,
      }
    );

    const error =
      new Error(
        data?.error_description ||
        data?.error ||
        data?.message ||
        `Mappls API request failed (${response.status})`
      );

    error.statusCode =
      response.status;

    error.payload =
      data;

    throw error;
  }

  return data;
};


/* =========================================================
   1. SEARCH PLACES

   Reference implementation:
   https://atlas.mapmyindia.com/api/places/search/json
   ========================================================= */

export const searchPlacesProxy =
async (
  query,
  options = {}
) => {

  if (!query?.trim()) {

    const error =
      new Error(
        "Search query is required"
      );

    error.statusCode = 400;

    throw error;
  }

  const token =
    await getMapplsAccessToken();

  const url =
    new URL(
      "https://atlas.mapmyindia.com/api/places/search/json"
    );

  url.searchParams.set(
    "query",
    query.trim()
  );

  if (options.region) {

    url.searchParams.set(
      "region",
      options.region
    );

  }

  const data =
    await requestJson(
      url.toString(),
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const rawLocations =
    data?.suggestedLocations ||
    data?.results ||
    [];

  const suggestions =
    rawLocations.map(
      (place) => ({

        ...place,

        placeName:
          place.placeName ||
          place.name ||
          place.description ||
          "",

        placeAddress:
          place.placeAddress ||
          place.formattedAddress ||
          place.address ||
          "",

        cityName:
          place.city ||
          place.cityName ||
          place.addressTokens?.city ||
          "",

        stateName:
          place.state ||
          place.stateName ||
          place.addressTokens?.state ||
          "",

        district:
          place.district ||
          place.addressTokens?.district ||
          "",

        subLocality:
          place.subLocality ||
          place.addressTokens?.subLocality ||
          "",

        eLoc:
          place.eLoc ||
          place.placeId ||
          null,

        latitude:
          place.latitude
            ? Number(place.latitude)
            : null,

        longitude:
          place.longitude
            ? Number(place.longitude)
            : null,

      })
    );

  return {
    success: true,
    suggestions,
  };
};


/* =========================================================
   2. AUTOSUGGEST

   Kept separate because your localPickup.service.js
   currently calls autosuggestProxy().
   ========================================================= */

export const autosuggestProxy = async (query, options = {}) => {
  if (!query?.trim()) {
    const error = new Error("Search query is required");
    error.statusCode = 400;
    throw error;
  }

  const token = await getMapplsAccessToken();

  const url = new URL(
    "https://atlas.mapmyindia.com/api/places/search/json"
  );

  url.searchParams.set("query", query.trim());

  const data = await requestJson(url.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const rawLocations =
    data?.suggestedLocations ||
    data?.results ||
    [];

  const suggestions = rawLocations.map((place) => ({
    ...place,

    placeName:
      place.placeName ||
      place.name ||
      place.description ||
      "",

    placeAddress:
      place.placeAddress ||
      place.formattedAddress ||
      place.address ||
      "",

    cityName:
      place.city ||
      place.cityName ||
      place.addressTokens?.city ||
      "",

    stateName:
      place.state ||
      place.stateName ||
      place.addressTokens?.state ||
      "",

    district:
      place.district ||
      place.addressTokens?.district ||
      "",

    subLocality:
      place.subLocality ||
      place.addressTokens?.subLocality ||
      "",

    eLoc:
      place.eLoc ||
      place.placeId ||
      null,

    latitude:
      place.latitude != null
        ? Number(place.latitude)
        : null,

    longitude:
      place.longitude != null
        ? Number(place.longitude)
        : null,
  }));

  return {
    success: true,
    suggestions,
  };
};

/* =========================================================
   3. REVERSE GEOCODE

   EXACT endpoint pattern from your working reference:

   https://apis.mappls.com/advancedmaps/v1/rev_geocode
   ========================================================= */

export const reverseGeocodeProxy =
async (lat, lng) => {

  const latitude =
    Number(lat);

  const longitude =
    Number(lng);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {

    const error =
      new Error(
        "Valid latitude and longitude are required"
      );

    error.statusCode = 400;

    throw error;
  }

  const token =
    await getMapplsAccessToken();

  const url =
    new URL(
      "https://apis.mappls.com/advancedmaps/v1/rev_geocode"
    );

  url.searchParams.set(
    "lat",
    String(latitude)
  );

  url.searchParams.set(
    "lng",
    String(longitude)
  );

  const data =
    await requestJson(
      url.toString(),
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const result =
    data?.results?.[0];

  if (!result) {

    const error =
      new Error(
        "No address found for coordinates"
      );

    error.statusCode = 404;

    throw error;
  }

  return {

    success: true,

    place: {

      placeName:
        result.subDistrict ||
        result.city ||
        result.locality ||
        "Current Location",

      cityName:
        result.city ||
        result.district ||
        "My Location",

      stateName:
        result.state ||
        "",

      placeAddress:
        result.formatted_address ||
        result.formattedAddress ||
        `${latitude}, ${longitude}`,

      latitude,

      longitude,

    },

  };
};


/* =========================================================
   INTERNAL HELPER:
   GEOCODE AN ADDRESS
   ========================================================= */

async function geocodeAddress(
  address,
  token
) {

  if (!address?.trim()) {
    return null;
  }

  const url =
    new URL(
      "https://atlas.mapmyindia.com/api/places/geocode"
    );

  url.searchParams.set(
    "address",
    address.trim()
  );

  url.searchParams.set(
    "itemCount",
    "1"
  );

  url.searchParams.set(
    "region",
    "IND"
  );

  const data =
    await requestJson(
      url.toString(),
      {
        headers: {
          Authorization:
            `Bearer ${token}`,
        },
      }
    );

  const results =
    data?.copResults ||
    data?.results ||
    data?.geocodes ||
    [];

  const first =
    Array.isArray(results)
      ? results[0]
      : results;

  if (!first) {
    return null;
  }

  const latitude =
    Number(
      first.latitude ||
      first.lat
    );

  const longitude =
    Number(
      first.longitude ||
      first.long ||
      first.lng
    );

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude)
  ) {
    return null;
  }

  return {
    latitude,
    longitude,
  };
}


/* =========================================================
   4. RESOLVE ELOC / PLACE TO COORDINATES

   Uses the same approach as your reference:

   1. Place Details
   2. Full address geocode
   3. Place-name fallback
   ========================================================= */

export const resolveELocProxy =
async ({
  eLoc,
  placeAddress,
  placeName,
}) => {

  if (
    !eLoc &&
    !placeAddress &&
    !placeName
  ) {

    return {
      success: false,
      message:
        "eLoc, placeAddress or placeName is required",
    };

  }

  const token =
    await getMapplsAccessToken();


  /*
   * METHOD 1
   *
   * Place Details API
   */

  if (eLoc) {

    try {

      const url =
        `https://explore.mapmyindia.com/apis/O2O/entity/${encodeURIComponent(eLoc)}`;

      const data =
        await requestJson(
          url,
          {
            headers: {
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

      const latitude =
        Number(
          data?.latitude ||
          data?.lat ||
          data?.Entry_lat ||
          data?.entry_lat
        );

      const longitude =
        Number(
          data?.longitude ||
          data?.long ||
          data?.lng ||
          data?.Entry_lon ||
          data?.entry_lon
        );

      if (
        Number.isFinite(latitude) &&
        Number.isFinite(longitude) &&
        latitude !== 0 &&
        longitude !== 0
      ) {

        return {

          success: true,

          latitude,

          longitude,

          source:
            "place_details",

        };

      }

    } catch (error) {

      console.warn(
        "⚠️ Place Details failed:",
        error.message
      );

    }

  }


  /*
   * METHOD 2
   *
   * Full address geocoding
   */

  if (placeAddress) {

    try {

      const coordinates =
        await geocodeAddress(
          placeAddress,
          token
        );

      if (coordinates) {

        return {

          success: true,

          ...coordinates,

          source:
            "geocode_address",

        };

      }

    } catch (error) {

      console.warn(
        "⚠️ Address geocode failed:",
        error.message
      );

    }

  }


  /*
   * METHOD 3
   *
   * Place name fallback
   */

  if (placeName) {

    try {

      const coordinates =
        await geocodeAddress(
          placeName,
          token
        );

      if (coordinates) {

        return {

          success: true,

          ...coordinates,

          source:
            "geocode_place_name",

        };

      }

    } catch (error) {

      console.warn(
        "⚠️ Place-name geocode failed:",
        error.message
      );

    }

  }


  return {

    success: false,

    message:
      "Coordinates not available",

  };
};


/* =========================================================
   5. CALCULATE DISTANCE

   Reference endpoint:

   https://atlas.mapmyindia.com/api/advancedmaps/v1/
   route_adv/driving

   IMPORTANT:

   Mappls expects:

   start = longitude,latitude
   end   = longitude,latitude

   Your previous code had latitude,longitude.
   ========================================================= */
const haversineKm = (lat1, lng1, lat2, lng2) => {
  const R = 6371;
  const toRad = (value) => (value * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};
export const calculateDistanceProxy = async ({
  originLat,
  originLng,
  destinationLat,
  destinationLng,
}) => {
  const startLat = Number(originLat);
  const startLng = Number(originLng);
  const endLat = Number(destinationLat);
  const endLng = Number(destinationLng);

  if (
    !Number.isFinite(startLat) ||
    !Number.isFinite(startLng) ||
    !Number.isFinite(endLat) ||
    !Number.isFinite(endLng)
  ) {
    const error = new Error(
      "Valid origin and destination coordinates are required"
    );

    error.statusCode = 400;
    throw error;
  }

  console.log("📏 Distance request:", {
    startLat,
    startLng,
    endLat,
    endLng,
  });

  try {
    const token = await getMapplsAccessToken();

    const url = new URL(
      "https://atlas.mapmyindia.com/api/advancedmaps/v1/route_adv/driving"
    );

    url.searchParams.set(
      "start",
      `${startLng},${startLat}`
    );

    url.searchParams.set(
      "end",
      `${endLng},${endLat}`
    );

    console.log(
      "🌐 Mappls Distance Request:",
      url.toString()
    );

    const data = await requestJson(
      url.toString(),
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const route = data?.routes?.[0];

    if (!route) {
      throw new Error(
        "Mappls returned no route"
      );
    }

    const distanceKm =
      Number(route.distance) / 1000;

    const durationMin =
      Number(route.duration) / 60;

    console.log("✅ Mappls distance result:", {
      distanceKm,
      durationMin,
    });

    return {
      success: true,
      distance: Number(distanceKm.toFixed(2)),
      duration: Number(durationMin.toFixed(1)),
      distanceKm: Number(distanceKm.toFixed(2)),
      durationMin: Number(durationMin.toFixed(1)),
      source: "mappls",
    };
  } catch (error) {
    console.error(
      "⚠️ Mappls Distance API failed:",
      error.message
    );

    const straightDistance = haversineKm(
      startLat,
      startLng,
      endLat,
      endLng
    );

    const estimatedRoadDistance =
      straightDistance * 1.3;

    const estimatedDuration =
      (estimatedRoadDistance / 30) * 60;

    console.log("⚠️ Using Haversine fallback:", {
      distanceKm: estimatedRoadDistance,
      durationMin: estimatedDuration,
    });

    return {
      success: true,
      distance: Number(
        estimatedRoadDistance.toFixed(2)
      ),
      duration: Number(
        estimatedDuration.toFixed(1)
      ),
      distanceKm: Number(
        estimatedRoadDistance.toFixed(2)
      ),
      durationMin: Number(
        estimatedDuration.toFixed(1)
      ),
      source: "haversine_fallback",
    };
  }
};