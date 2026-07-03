import { onRequest } from "firebase-functions/v2/https";
import admin from "firebase-admin";
import fetch from 'node-fetch';

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Reverse geocodes coordinates to get address information using Mappls API
 * @type {import("firebase-functions").HttpsFunction}
 */
export const reverseGeocode = onRequest(
  { cors: true, region: "asia-south1" },
  async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    try {
      const { lat, lng } = req.query;

      if (!lat || !lng) {
        return res.status(400).json({
          error: "Missing required parameters: lat and lng are required",
        });
      }

      const apiKey = process.env.MAPMYINDIA_API_KEY;
      if (!apiKey) {
        console.error("MAPMYINDIA_API_KEY environment variable not set");
        return res.status(500).json({
          error: "Server configuration error",
        });
      }

      // Call Mappls reverse geocoding API
      const response = await fetch(
        `https://apis.mappls.com/advancedmaps/v1/${apiKey}/rev_geocode?lat=${lat}&lng=${lng}`
      );

      if (!response.ok) {
        const error = await response.text();
        console.error("Mappls API error:", error);
        return res.status(response.status).json({
          error: "Error from geocoding service",
          details: error,
        });
      }

      const data = await response.json();
      
      // Format the response to match what your frontend expects
      const result = {
        placeAddress: data.results?.[0]?.formatted_address || "Address not found",
        latitude: parseFloat(lat),
        longitude: parseFloat(lng),
        eLoc: data.results?.[0]?.eLoc || "",
      };

      return res.status(200).json(result);
    } catch (error) {
      console.error("Reverse geocoding error:", error);
      return res.status(500).json({
        error: "Internal server error",
        details: error.message,
      });
    }
  }
);
