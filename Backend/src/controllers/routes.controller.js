import {
  createRoute,
  deleteRouteById,
  listCities,
  listRoutesByDriver,
  updateRouteById,
} from "../services/route.service.js";

export const readDriverRoutes = async (req, res, next) => {
  try {
    const driverId = String(req.query.driverId || "").trim();
    if (!driverId) {
      return res.status(400).json({ success: false, message: "driverId is required" });
    }

    const routes = await listRoutesByDriver(driverId);
    return res.status(200).json({ success: true, routes });
  } catch (error) {
    next(error);
  }
};

export const submitDriverRoute = async (req, res, next) => {
  try {
    const { driverId, driverName, from, to, rate, radiusKm, active, vehicle } = req.body || {};
    if (!driverId) return res.status(400).json({ success: false, message: "driverId is required" });
    if (!from || !to) return res.status(400).json({ success: false, message: "from and to are required" });

    const routeId = await createRoute({ driverId, driverName, from, to, rate, radiusKm, active, vehicle });
    return res.status(201).json({ success: true, routeId });
  } catch (error) {
    next(error);
  }
};

export const patchDriverRoute = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    if (!routeId) return res.status(400).json({ success: false, message: "routeId is required" });
    await updateRouteById(routeId, req.body || {});
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const removeDriverRoute = async (req, res, next) => {
  try {
    const { routeId } = req.params;
    if (!routeId) return res.status(400).json({ success: false, message: "routeId is required" });
    await deleteRouteById(routeId);
    return res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const readCities = async (_req, res, next) => {
  try {
    const cities = await listCities();
    return res.status(200).json({ success: true, cities });
  } catch (error) {
    next(error);
  }
};
