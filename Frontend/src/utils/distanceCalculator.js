/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  // Validate inputs
  if (!lat1 || !lon1 || !lat2 || !lon2) {
    console.warn('Invalid coordinates provided to calculateDistance:', { lat1, lon1, lat2, lon2 });
    return Infinity; // Return infinity so it fails the distance check
  }

  // Convert to numbers
  lat1 = Number(lat1);
  lon1 = Number(lon1);
  lat2 = Number(lat2);
  lon2 = Number(lon2);

  // Validate numeric values
  if (isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)) {
    console.warn('Non-numeric coordinates:', { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  // Validate coordinate ranges
  if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90 ||
      lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
    console.warn('Coordinates out of valid range:', { lat1, lon1, lat2, lon2 });
    return Infinity;
  }

  const R = 6371; // Radius of the Earth in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c; // Distance in kilometers
  
  return distance;
}

/**
 * Convert degrees to radians
 * @param {number} degrees 
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a location is within specified radius
 * @param {Object} location1 - First location with lat, lng properties
 * @param {Object} location2 - Second location with lat, lng properties
 * @param {number} radiusKm - Radius in kilometers (default: 15)
 * @returns {boolean} True if within radius
 */
export function isWithinRadius(location1, location2, radiusKm = 15) {
  if (!location1 || !location2) {
    console.warn('Invalid locations provided to isWithinRadius');
    return false;
  }

  // Extract coordinates from both locations
  const coords1 = extractCoordinates(location1);
  const coords2 = extractCoordinates(location2);
  console.log('🧭 Radius check inputs:', {
    coords1,
    coords2,
    radiusKm
  });

  if (!coords1 || !coords2) {
    console.warn('Missing coordinates in locations:', { location1, location2 });
    return false;
  }

  const lat1 = coords1.lat;
  const lon1 = coords1.lng;
  const lat2 = coords2.lat;
  const lon2 = coords2.lng;

  if (!lat1 || !lon1 || !lat2 || !lon2) {
    console.warn('Missing coordinates after extraction:', { coords1, coords2 });
    return false;
  }

  const distance = calculateDistance(lat1, lon1, lat2, lon2);
  
  console.log(`📍 Distance calculation: ${distance.toFixed(2)} km (limit: ${radiusKm} km)`);
  console.log(`   Location 1: ${lat1.toFixed(6)}, ${lon1.toFixed(6)} (${coords1.accuracy})`);
  console.log(`   Location 2: ${lat2.toFixed(6)}, ${lon2.toFixed(6)} (${coords2.accuracy})`);
  
  return distance <= radiusKm;
}

/**
 * ✅ CRITICAL: Extract coordinates with ABSOLUTE PRIORITY for sublocation
 * This ensures we use the most precise location available
 * 
 * @param {Object} location - Location object
 * @returns {Object|null} Normalized coordinates {lat, lng, accuracy, isSublocality} or null
 */
export function extractCoordinates(location) {
  if (!location) {
    console.log('❌ No location object provided');
    return null;
  }

  console.log('🔍 Extracting coordinates from location:', {
    type: typeof location,
    keys: Object.keys(location),
    pickupCoordinates: location.pickupCoordinates,
    coordinates: location.coordinates
  });

  // ✅ PRIORITY 1: Check pickupCoordinates
  if (location.pickupCoordinates) {
    const coords = location.pickupCoordinates;
    const lat = coords.latitude || coords.lat;
    const lng = coords.longitude || coords.lng;
    
    if (lat && lng && lat !== 0 && lng !== 0) {
      console.log('✅ USING pickupCoordinates:', lat, lng);
      return {
        lat: Number(lat),
        lng: Number(lng),
        accuracy: coords.accuracy || (coords.isSublocality ? 'exact_sublocation' : 'city_center'),
        isSublocality: coords.isSublocality || false,
        source: 'pickupCoordinates'
      };
    }
  }

  // ✅ PRIORITY 2: Check coordinates field
  if (location.coordinates) {
    const coords = location.coordinates;
    const lat = coords.latitude || coords.lat;
    const lng = coords.longitude || coords.lng;
    
    if (lat && lng && lat !== 0 && lng !== 0) {
      console.log('✅ USING coordinates field:', lat, lng);
      return {
        lat: Number(lat),
        lng: Number(lng),
        accuracy: coords.accuracy || 'coordinates_field',
        isSublocality: location.isSublocality || false,
        source: 'coordinates'
      };
    }
  }

  // ✅ PRIORITY 3: Check direct lat/lng properties
  const lat = location.latitude || location.lat;
  const lng = location.longitude || location.lng;
  
  if (lat && lng && lat !== 0 && lng !== 0) {
    console.log('✅ USING direct properties:', lat, lng);
    return {
      lat: Number(lat),
      lng: Number(lng),
      accuracy: 'direct_properties',
      isSublocality: false,
      source: 'direct'
    };
  }

  console.warn('❌ Could not extract coordinates from location:', Object.keys(location));
  return null;
}

/**
 * Calculate approximate distance between two city names (fallback method)
 * Only use when coordinates are not available
 * @param {string} city1 - First city name
 * @param {string} city2 - Second city name
 * @returns {number|null} Approximate distance in km or null if unknown
 */
export function estimateCityDistance(city1, city2) {
  // Common city distances in Maharashtra (example)
  const commonDistances = {
    'pune-mumbai': 148,
    'mumbai-pune': 148,
    'pune-nashik': 210,
    'nashik-pune': 210,
    'mumbai-nashik': 167,
    'nashik-mumbai': 167,
    'pune-aurangabad': 233,
    'aurangabad-pune': 233,
    'mumbai-aurangabad': 333,
    'aurangabad-mumbai': 333,
    'pune-kolhapur': 234,
    'kolhapur-pune': 234,
    'pune-talegaon': 30,
    'talegaon-pune': 30
  };

  const key = `${city1.toLowerCase()}-${city2.toLowerCase()}`;
  const reverseKey = `${city2.toLowerCase()}-${city1.toLowerCase()}`;

  return commonDistances[key] || commonDistances[reverseKey] || null;
}

/**
 * Check if request should be shown based on multiple criteria
 * @param {Object} request - Ride request object
 * @param {Object} driverLocation - Driver's current location
 * @param {Array} interestedRoutes - Driver's interested routes
 * @returns {Object} Result with show flag and reason
 */
export function shouldShowRequest(request, driverLocation, interestedRoutes = []) {
    // ✅ LOCAL PICKUP: backend already radius-filtered
  if (request?.type === 'localPickup') {
    return {
      show: true,
      reason: 'Local pickup (backend radius already applied)',
      distance: null,
      routeMatch: true,
      withinRadius: true
    };
  }
  const result = {
    show: false,
    reason: '',
    distance: null,
    routeMatch: false,
    withinRadius: false
  };

  // Check route match first
  if (interestedRoutes.length > 0) {
    const matchesRoute = interestedRoutes.some(route => {
      const fromMatch = route.from?.toLowerCase() === request.from?.toLowerCase();
      const toMatch = route.to?.toLowerCase() === request.to?.toLowerCase();
      return fromMatch && toMatch;
    });
    
    result.routeMatch = matchesRoute;
    
    if (!matchesRoute) {
      result.reason = 'Route does not match driver preferences';
      return result;
    }
  }

  // Check distance if driver location is available
  if (driverLocation) {
    const pickupCoords = extractCoordinates(request);
    
    if (!pickupCoords) {
      // No coordinates available, show by default for backward compatibility
      result.show = true;
      result.reason = 'No coordinates available, showing by default';
      return result;
    }

    const distance = calculateDistance(
      driverLocation.lat,
      driverLocation.lng,
      pickupCoords.lat,
      pickupCoords.lng
    );
    
    result.distance = distance;
    result.withinRadius = distance <= 15;
    
    if (distance <= 15) {
      result.show = true;
      result.reason = `Within ${distance.toFixed(2)} km radius`;
    } else {
      result.reason = `Outside radius: ${distance.toFixed(2)} km`;
    }
  } else {
    // No driver location, show all matching routes
    result.show = true;
    result.reason = 'No driver location available, showing all matching routes';
  }

  return result;
}

/**
 * Format distance for display
 * @param {number} distance - Distance in kilometers
 * @returns {string} Formatted distance
 */
export function formatDistance(distance) {
  if (distance < 1) {
    return `${(distance * 1000).toFixed(0)} meters`;
  } else if (distance < 10) {
    return `${distance.toFixed(1)} km`;
  } else {
    return `${distance.toFixed(0)} km`;
  }
}

/**
 * Get location accuracy description
 * @param {Object} coordinates - Coordinates object
 * @returns {string} Accuracy description
 */
export function getAccuracyDescription(coordinates) {
  if (!coordinates) return 'Unknown accuracy';
  
  switch (coordinates.accuracy) {
    case 'exact_sublocation':
      return 'Exact sublocation';
    case 'city':
    case 'city_center':
      return 'City center';
    case 'user_location':
      return 'User shared location';
    case 'coordinates_field':
      return 'Coordinates from field';
    case 'direct_properties':
      return 'Direct coordinates';
    default:
      return coordinates.accuracy || 'Unknown';
  }
}