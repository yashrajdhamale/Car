import { reverseGeocodeNominatim, searchNominatim } from "../services/nominatim.service.js";

export const reverseGeocode = async (req, res, next) => {
  try {
    const { lat, lng } = req.query || {};
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ success: false, message: "lat and lng are required" });
    }
    const data = await reverseGeocodeNominatim({ lat, lng });
    return res.status(200).json({ success: true, ...data });
  } catch (error) {
    next(error);
  }
};

export const search = async (req, res, next) => {
  try {
    const q = String(req.query?.q || "").trim();
    if (!q) {
      return res.status(400).json({ success: false, message: "Query parameter q is required" });
    }
    const data = await searchNominatim({ q });
    return res.status(200).json({ success: true, suggestions: data });
  } catch (error) {
    next(error);
  }
};
