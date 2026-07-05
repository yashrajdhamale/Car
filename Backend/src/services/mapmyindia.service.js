const MAPMYINDIA_BASE_URL =
  process.env.MAPMYINDIA_BASE_URL ||
  "https://atlas.mapmyindia.com/api/places";

const MAPMYINDIA_API_KEY = process.env.MAPMYINDIA_API_KEY || "";

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

const authHeaders = () => ({
  "Content-Type": "application/json",
  ...(MAPMYINDIA_API_KEY ? { Authorization: `Bearer ${MAPMYINDIA_API_KEY}` } : {}),
});

export const searchPlacesProxy = async (query, options = {}) => {
  const url = new URL(`${MAPMYINDIA_BASE_URL}/search/json`);
  url.searchParams.set("query", query);
  url.searchParams.set("region", options.region || "IND");
  if (options.pod) url.searchParams.set("pod", options.pod);
  return requestJson(url.toString(), { headers: authHeaders() });
};

export const reverseGeocodeProxy = async (lat, lng) => {
  const url = new URL(`${MAPMYINDIA_BASE_URL}/reverse_geocode`);
  url.searchParams.set("lat", lat);
  url.searchParams.set("lng", lng);
  return requestJson(url.toString(), { headers: authHeaders() });
};

export const autosuggestProxy = async (query, options = {}) => {
  const url = new URL(`${MAPMYINDIA_BASE_URL}/autosuggest`);
  url.searchParams.set("query", query);
  url.searchParams.set("region", options.region || "IND");
  url.searchParams.set("pod", options.pod || "city");
  if (options.city) url.searchParams.set("city", options.city);
  return requestJson(url.toString(), { headers: authHeaders() });
};
