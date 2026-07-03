import { useEffect, useRef, useState, useCallback } from 'react';

// Store the loading promise to prevent multiple loads
let googleMapsLoadingPromise = null;

const loadGoogleMapsScript = () => {
  if (googleMapsLoadingPromise) {
    return googleMapsLoadingPromise;
  }

  if (!googleMapsLoadingPromise) {
    googleMapsLoadingPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.maps?.places) {
        resolve(window.google.maps);
        return;
      }

      // Create a unique callback name for this instance
      const callbackName = `googleMapsCallback_${Date.now()}`;
      
      // Create a global callback function for initialization
      window[callbackName] = function() {
        delete window[callbackName];
        if (window.google?.maps?.places) {
          resolve(window.google.maps);
        } else {
          reject(new Error('Google Maps API loaded but places library not available'));
        }
      };

      // Check if script is already in the document
      const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
      if (existingScript) {
        // If script exists but not loaded yet, wait for it
        const checkLoaded = setInterval(() => {
          if (window.google?.maps?.places) {
            clearInterval(checkLoaded);
            window[callbackName]();
          }
        }, 100);
        return;
      }

      // Create and load the script
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&loading=async`;
      script.async = true;
      script.defer = true;
      
      script.onerror = () => {
        delete window[callbackName];
        reject(new Error('Error loading Google Maps API'));
      };
      
      document.head.appendChild(script);
    });
  }
  
  return googleMapsLoadingPromise;
};

export const useGooglePlaces = (inputRef, options = {}) => {
  const [autocomplete, setAutocomplete] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);
  const autocompleteInstance = useRef(null);

  const initializeAutocomplete = useCallback(async () => {
    if (!inputRef?.current) return null;

    try {
      const googleMaps = await loadGoogleMapsScript();
      
      // Ensure the Places library is loaded
      if (!googleMaps.places) {
        throw new Error('Google Maps Places library not available');
      }
      
      // Create a new Autocomplete instance
      const autocomplete = new googleMaps.places.Autocomplete(
        inputRef.current,
        {
          types: ['(cities)'],
          componentRestrictions: { country: 'in' },
          fields: ['place_id', 'name', 'geometry', 'formatted_address'],
          ...options
        }
      );

      // Clean up previous instance if exists
      if (autocompleteInstance.current) {
        const prevAutocomplete = autocompleteInstance.current;
        if (googleMaps.event && prevAutocomplete) {
          googleMaps.event.clearInstanceListeners(prevAutocomplete);
        }
      }
      
      autocompleteInstance.current = autocomplete;
      return autocomplete;
    } catch (err) {
      console.error('Error initializing Google Places:', err);
      throw err;
    }
  }, [inputRef, JSON.stringify(options)]);

  useEffect(() => {
    isMounted.current = true;
    
    const init = async () => {
      try {
        const instance = await initializeAutocomplete();
        if (isMounted.current && instance) {
          setAutocomplete(instance);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
          setIsLoading(false);
        }
      }
    };

    init();

    return () => {
      isMounted.current = false;
      // Clean up event listeners when component unmounts
      if (autocompleteInstance.current) {
        const google = window.google;
        if (google?.maps?.event) {
          google.maps.event.clearInstanceListeners(autocompleteInstance.current);
        }
        autocompleteInstance.current = null;
      }
    };
  }, [initializeAutocomplete]);

  return { 
    autocomplete, 
    isLoading, 
    error 
  };
};
