export const loadGoogleMapsScript = (apiKey, callback) => {
  if (window.google && window.google.maps && window.google.maps.places) {
    callback();
    return;
  }

  const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
  if (existingScript) {
    existingScript.onload = () => callback();
    return;
  }

  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=Function.prototype`;
  script.async = true;
  script.defer = true;
  script.onload = () => callback();
  script.onerror = (error) => console.error('Google Maps script failed to load', error);
  
  document.head.appendChild(script);
};

/**
 * Safely initialize Google Places Autocomplete
 * @param {HTMLInputElement} inputElement - The input element
 * @param {Function} onPlaceSelected - Callback when a place is selected
 * @param {Object} [options] - Autocomplete options
 * @returns {Object} Autocomplete instance and cleanup function
 */
export const setupAutocomplete = (inputElement, onPlaceSelected, options = {}) => {
  if (!inputElement || !window.google?.maps?.places) {
    return { autocomplete: null, cleanup: () => {} };
  }

  // Default options
  const defaultOptions = {
    componentRestrictions: { country: 'in' },
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
  };

  // Merge default options with provided options
  const autocompleteOptions = { ...defaultOptions, ...options };

  // Create autocomplete instance
  const autocomplete = new window.google.maps.places.Autocomplete(
    inputElement,
    autocompleteOptions
  );

  const placeChangedHandler = () => {
    const place = autocomplete.getPlace();
    
    if (!place.geometry) {
      console.log('No details available for input: ' + place.name);
      return;
    }

    const viewport = place.geometry.viewport;
    const bounds = viewport ? {
      northeast: {
        lat: viewport.getNorthEast().lat(),
        lng: viewport.getNorthEast().lng()
      },
      southwest: {
        lat: viewport.getSouthWest().lat(),
        lng: viewport.getSouthWest().lng()
      }
    } : null;

    onPlaceSelected({
      place_id: place.place_id,
      name: place.name,
      formatted_address: place.formatted_address,
      geometry: place.geometry,
      types: place.types || [],
      bounds: bounds
    });
  };

  // Add the event listener
  const listener = window.google.maps.event.addListener(
    autocomplete,
    'place_changed',
    placeChangedHandler
  );

  // Return the autocomplete instance and cleanup function
  return {
    autocomplete,
    cleanup: () => {
      if (listener) {
        window.google.maps.event.removeListener(listener);
      }
      if (autocomplete) {
        // Remove autocomplete instance from the DOM
        const container = document.querySelector('.pac-container');
        if (container && container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }
    }
  };
};

// Backward compatibility
export const initAutocomplete = (inputElement, onPlaceSelected) => {
  const { autocomplete } = setupAutocomplete(inputElement, onPlaceSelected);
  return autocomplete;
};

export const initLocationAutocomplete = setupAutocomplete;
