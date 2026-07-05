const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

const requestJson = async (url) => {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CarziHolidays/1.0",
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data?.error || data?.message || `HTTP ${response.status}`);
    error.statusCode = response.status;
    error.payload = data;
    throw error;
  }

  return data;
};

export const reverseGeocodeNominatim = async ({ lat, lng }) => {
  const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lng);
  url.searchParams.set("zoom", "18");
  url.searchParams.set("addressdetails", "1");
  return requestJson(url.toString());
};

export const searchNominatim = async ({ q }) => {
  const url = new URL(`${NOMINATIM_BASE_URL}/search`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("q", q);
  url.searchParams.set("limit", "5");
  url.searchParams.set("addressdetails", "1");
  return requestJson(url.toString());
};
