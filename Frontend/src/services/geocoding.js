/**
 * Geocoding service using MapmyIndia API
 * Handles forward and reverse geocoding
 */

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/places/reverse-geocode?lng=${encodeURIComponent(lng)}&lat=${encodeURIComponent(lat)}`
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract formatted address from response
    return data?.results?.[0]?.formatted_address || data?.suggestedLocations?.[0]?.placeAddress || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }
};

/**
 * Search for locations by query
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of location suggestions
 */
export const searchLocations = async (query) => {
  try {
    if (!query.trim()) return [];
    
    const response = await fetch(
      `${BACKEND_BASE_URL}/api/places/autosuggest?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Location search failed: ${response.statusText}`);
    }

    const data = await response.json();
    return data?.suggestedLocations || [];
  } catch (error) {
    console.error('Location search error:', error);
    return [];
  }
};

export default {
  reverseGeocode,
  searchLocations
};
