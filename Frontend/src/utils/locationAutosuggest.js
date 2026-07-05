const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

let debounceTimer;

const debounce = (func, delay) => {
  return function(...args) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => func.apply(this, args), delay);
  };
};

export const fetchSuggestions = async (query, options = {}) => {
  if (!query || query.trim().length < 2) return [];
  
  try {
    const url = new URL(`${BACKEND_BASE_URL}/api/places/autosuggest`);
    const params = {
      query,
      region: 'IND',
      pod: 'city',
      ...options
    };

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, value);
      }
    });
    
    const response = await fetch(url.toString());
    
    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    const data = await response.json();
    return (data.suggestedLocations || []).map(item => ({
      id: item.placeId,
      display: item.placeName,
      address: item.placeAddress,
      lat: item.latitude,
      lng: item.longitude,
      type: item.type
    }));
  } catch (error) {
    console.error('Error fetching location suggestions:', error);
    throw error;
  }
};

export const getSuggestions = debounce(async (query, callback, options = {}) => {
  try {
    const results = await fetchSuggestions(query, options);
    callback(results);
  } catch (error) {
    console.error('Error in getSuggestions:', error);
    callback([]);
  }
}, 300);

export const getCurrentLocation = () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          display: 'Current Location'
        });
      },
      (error) => {
        reject(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  });
};
