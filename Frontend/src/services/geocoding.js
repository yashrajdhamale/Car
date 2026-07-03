/**
 * Geocoding service using MapmyIndia API
 * Handles forward and reverse geocoding
 */

const MAPMYINDIA_API_KEY = import.meta.env.VITE_MAPMYINDIA_API_KEY;
const MAPMYINDIA_BASE_URL = 'https://atlas.mapmyindia.com/api/places';

/**
 * Reverse geocode coordinates to get address
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<string>} Formatted address
 */
export const reverseGeocode = async (lat, lng) => {
  try {
    if (!MAPMYINDIA_API_KEY) {
      console.warn('MapmyIndia API key is missing');
      return 'Current Location';
    }

    const response = await fetch(
      `${MAPMYINDIA_BASE_URL}/reverse_geocode?lng=${lng}&lat=${lat}`, 
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MAPMYINDIA_API_KEY}`
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Extract formatted address from response
    return data?.results?.[0]?.formatted_address || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
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
      `${MAPMYINDIA_BASE_URL}/search/json?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${MAPMYINDIA_API_KEY}`
        }
      }
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
