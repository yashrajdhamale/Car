const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const jsonFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  }
  return payload;
};

export const normalizeLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location.toLowerCase().trim();
  return (location.name || location.address || '').toLowerCase().trim();
};

export const findAvailableDriver = async (bookingData) => {
  try {
    const payload = await jsonFetch(`${API_BASE}/api/outstation-bookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pickupLocation: bookingData.pickupLocation,
        dropoffLocation: bookingData.dropoffLocation,
        pickupCityForDriver: bookingData.pickupLocation,
        destinationCityForDriver: bookingData.dropoffLocation,
        car: bookingData.car || {},
        userId: bookingData.userId || "",
        userName: bookingData.userName || "",
        userPhone: bookingData.userPhone || "",
        userEmail: bookingData.userEmail || "",
        status: "searching_driver",
      }),
    });
    return payload.assignedDrivers?.length ? { id: payload.assignedDrivers[0] } : null;
  } catch (error) {
    console.error('Error finding available driver:', error);
    return null;
  }
};

export const getDriverById = async (driverId) => {
  try {
    const payload = await jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}`);
    return payload?.location ? { id: driverId, ...payload } : { id: driverId, ...payload };
  } catch (error) {
    console.error('Error getting driver:', error);
    return null;
  }
};

export const hasDriverRoute = async (driverId, pickup, dropoff) => {
  try {
    const payload = await jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}`);
    const driver = payload || {};
    const routeText = `${normalizeLocation(pickup)} ${normalizeLocation(dropoff)}`;
    return Boolean(driver && routeText);
  } catch (error) {
    console.error('Error checking driver route:', error);
    return false;
  }
};
