import { autosuggestProxy, reverseGeocodeProxy, searchPlacesProxy } from "../services/mapmyindia.service.js";

export const searchPlaces = async (req, res, next) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter q is required",
      });
    }

    const data = await searchPlacesProxy(query, {
      region: req.query.region,
      pod: req.query.pod,
    });

    return res.json({
      success: true,
      query,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const reverseGeocode = async (req, res, next) => {
  try {
    const lat = req.query.lat;
    const lng = req.query.lng;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    const data = await reverseGeocodeProxy(lat, lng);
    return res.json({
      success: true,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};

export const autosuggest = async (req, res, next) => {
  try {
    const query = (req.query.q || "").trim();
    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter q is required",
      });
    }

    const data = await autosuggestProxy(query, {
      region: req.query.region,
      pod: req.query.pod,
      city: req.query.city,
    });

    return res.json({
      success: true,
      query,
      ...data,
    });
  } catch (error) {
    next(error);
  }
};
