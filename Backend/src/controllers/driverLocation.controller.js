import { enforceDriverLocationSharing, findNearbyDrivers, getDriverLocation, getRideTracking, updateCustomerLocation, updateDriverLocation, updateDriverLocationInRides } from "../services/driverLocation.service.js";

export const postDriverLocation = async (req, res, next) => {
  try {
    return res.status(200).json(await updateDriverLocation({ driverId: req.params.driverId, location: req.body?.location }));
  } catch (error) {
    next(error);
  }
};

export const postDriverRidesLocation = async (req, res, next) => {
  try {
    return res.status(200).json(await updateDriverLocationInRides({ driverId: req.params.driverId, location: req.body?.location }));
  } catch (error) {
    next(error);
  }
};

export const readDriverLocation = async (req, res, next) => {
  try {
    const driver = await getDriverLocation(req.params.driverId);
    return res.status(200).json({ success: true, ...driver });
  } catch (error) {
    next(error);
  }
};

export const enforceDriverSharing = async (req, res, next) => {
  try {
    return res.status(200).json(await enforceDriverLocationSharing(req.params.driverId));
  } catch (error) {
    next(error);
  }
};

export const postCustomerLocation = async (req, res, next) => {
  try {
    return res.status(200).json(await updateCustomerLocation({ bookingId: req.params.bookingId, location: req.body?.location }));
  } catch (error) {
    next(error);
  }
};

export const readRideTracking = async (req, res, next) => {
  try {
    const booking = await getRideTracking(req.params.bookingId);
    return res.status(200).json({ success: true, booking });
  } catch (error) {
    next(error);
  }
};

export const postNearbyDrivers = async (req, res, next) => {
  try {
    return res.status(200).json(await findNearbyDrivers({ customerLocation: req.body?.customerLocation, radiusKm: req.body?.radiusKm }));
  } catch (error) {
    next(error);
  }
};
