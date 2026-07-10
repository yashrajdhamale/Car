const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const jsonFetch = async (url, options = {}) => {
  const response = await fetch(url, options);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || `HTTP ${response.status}`);
  }
  return payload;
};

export class DriverLocationService {
  static async updateDriverLocation(driverId, location) {
    await jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    return true;
  }

  static async updateLocationInAllRides(driverId, location) {
    const result = await jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}/rides`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    return result.updatedCount || 0;
  }

  static subscribeToDriverLocation(driverId, callback) {
    if (!driverId) return () => {};
    let active = true;

    const poll = async () => {
      try {
        const payload = await jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}`);
        if (!active) return;
        if (payload?.location) {
          callback({
            ...payload.location,
            driverId,
            name: payload.name || "Driver",
            isOnline: Boolean(payload.isOnline),
            accuracy: payload.location.accuracy || 100,
          });
        } else {
          callback(null);
        }
      } catch (error) {
        if (active) callback({ error: "Failed to fetch driver location" });
      }
    };

    poll();
    const timer = setInterval(poll, 10000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }

  static async enforceLocationSharing(driverId) {
    return jsonFetch(`${API_BASE}/api/driver-location/drivers/${driverId}/enforce`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
  }
}

export class CustomerLocationService {
  static async updateCustomerLocation(bookingId, location) {
    await jsonFetch(`${API_BASE}/api/driver-location/bookings/${bookingId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ location }),
    });
    return true;
  }

  static subscribeToRideTracking(bookingId, callback) {
    let active = true;
    let driverUnsubscribe = () => {};

    const poll = async () => {
      try {
        const payload = await jsonFetch(`${API_BASE}/api/driver-location/bookings/${bookingId}`);
        if (!active) return;
        const data = payload.booking || payload;
        const driverId = data.driverId;

        driverUnsubscribe();
        driverUnsubscribe = () => {};

        if (driverId) {
          callback({
            bookingData: data,
            driverLocation: data.driverLocation || null,
            customerLocation: data.userLocation,
            status: data.status,
            updatedAt: data.lastUpdated || data.updatedAt,
          });

          driverUnsubscribe = DriverLocationService.subscribeToDriverLocation(driverId, (driverLocation) => {
            callback({
              bookingData: data,
              driverLocation: driverLocation || data.driverLocation || null,
              customerLocation: data.userLocation,
              status: data.status,
              updatedAt: data.lastUpdated || data.updatedAt,
            });
          });
        } else {
          callback({
            bookingData: data,
            driverLocation: data.driverLocation,
            customerLocation: data.userLocation,
            status: data.status,
          });
        }
      } catch (error) {
        if (active) callback({ error: "Failed to track ride" });
      }
    };

    poll();
    const timer = setInterval(poll, 10000);
    return () => {
      active = false;
      driverUnsubscribe();
      clearInterval(timer);
    };
  }
}

export class RouteMatchingService {
  static async findNearbyDrivers(customerLocation, radiusKm = 5) {
    const payload = await jsonFetch(`${API_BASE}/api/driver-location/nearby-drivers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerLocation, radiusKm }),
    });
    return payload.drivers || [];
  }

  static calculateDistance(point1, point2) {
    const R = 6371;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  static calculateETA(distanceKm, speedKmph = 30) {
    return Math.ceil((distanceKm / speedKmph) * 60);
  }

  static toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}
