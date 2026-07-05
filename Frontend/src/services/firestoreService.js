const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const getJson = async (path) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.data = data;
    throw error;
  }

  return data;
};

const postJson = async (path, body, method = "POST") => {
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.error || data.message || "Request failed");
    error.data = data;
    throw error;
  }

  return data;
};

const getRoutesCollection = () => "/routes";

const subscribeToRoutes = (driverId, callback) => {
  if (typeof callback !== "function") {
    throw new Error("Invalid callback function");
  }

  let cancelled = false;

  const load = async () => {
    try {
      const data = await getJson(`${getRoutesCollection()}?driverId=${encodeURIComponent(driverId)}`);
      if (!cancelled) {
        callback((data.routes || []).sort((a, b) => {
          const aTime = a.createdAt?.seconds || 0;
          const bTime = b.createdAt?.seconds || 0;
          return bTime - aTime;
        }));
      }
    } catch (error) {
      if (!cancelled) callback([]);
    }
  };

  load();
  const intervalId = setInterval(load, 15000);

  return () => {
    cancelled = true;
    clearInterval(intervalId);
  };
};

const addRoute = async (driverId, routeData) => {
  const result = await postJson("/routes", {
    driverId,
    driverName: routeData.driverName,
    from: routeData.from,
    to: routeData.to,
    rate: routeData.rate,
    radiusKm: routeData.radiusKm,
    active: routeData.active,
    vehicle: routeData.vehicle,
  });
  return result.routeId;
};

const updateRoute = async (driverId, routeId, updates) => {
  await postJson(`/routes/${routeId}`, { ...updates, driverId }, "PATCH");
};

const deleteRoute = async (routeId) => {
  await postJson(`/routes/${routeId}`, {}, "DELETE");
};

const subscribeToCities = (callback) => {
  if (typeof callback !== "function") {
    throw new Error("Invalid callback function");
  }

  let cancelled = false;

  const load = async () => {
    try {
      const data = await getJson("/routes/cities");
      if (!cancelled) callback(data.cities || []);
    } catch {
      if (!cancelled) callback([]);
    }
  };

  load();
  return () => {
    cancelled = true;
  };
};

export {
  subscribeToRoutes,
  addRoute,
  updateRoute,
  deleteRoute,
  subscribeToCities
};
