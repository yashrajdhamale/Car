import { createContext, useContext, useEffect, useState } from 'react';

const HereMapsContext = createContext();

export const HereMapsProvider = ({ children }) => {
  const [hereMaps, setHereMaps] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadHereMaps = async () => {
      try {
        // Check if HERE Maps is already loaded
        if (window.H) {
          setHereMaps(window.H);
          setIsLoading(false);
          return;
        }

        // Load HERE Maps script
        const script = document.createElement('script');
        script.src = `https://js.api.here.com/v3/3.1/mapsjs-core.js`;
        script.async = true;
        script.onload = () => {
          // Load required HERE Maps modules
          window.H.import(
            [
              'mapsjs-core',
              'mapsjs-service',
              'mapsjs-mapevents',
              'mapsjs-ui',
              'mapsjs-places',
              'mapsjs-clustering',
              'mapsjs-routing',
            ],
            () => {
              // Initialize the platform object with your API key
              const platform = new window.H.service.Platform({
                apikey: import.meta.env.VITE_HERE_API_KEY,
                app_id: import.meta.env.VITE_HERE_APP_ID,
                app_code: import.meta.env.VITE_HERE_APP_CODE,
              });

              window.HERE = {
                ...window.H,
                platform,
              };

              setHereMaps(window.H);
              setIsLoading(false);
            },
            (err) => {
              console.error('Error loading HERE Maps modules:', err);
              setError('Failed to load map modules');
              setIsLoading(false);
            }
          );
        };

        script.onerror = (err) => {
          console.error('Error loading HERE Maps script:', err);
          setError('Failed to load map script');
          setIsLoading(false);
        };

        document.head.appendChild(script);
      } catch (err) {
        console.error('Error initializing HERE Maps:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    };

    loadHereMaps();

    return () => {
      // Cleanup if needed
    };
  }, []);

  // Function to get place suggestions
  const getPlaceSuggestions = async (query) => {
    if (!hereMaps) return [];

    try {
      const service = hereMaps.places.PlacesService;
      const request = {
        q: query,
        in: 'countryCode:IND', // Focus on India
        at: '18.5204,73.8567', // Default to Pune coordinates
        limit: 5,
      };

      const result = await new Promise((resolve, reject) => {
        service.discover(request, resolve, reject);
      });

      return result.items.map((item) => ({
        id: item.id,
        title: item.title,
        address: item.vicinity,
        position: item.position,
        category: item.category?.title || '',
        type: 'place',
      }));
    } catch (error) {
      console.error('Error getting place suggestions:', error);
      return [];
    }
  };

  // Function to get address from coordinates
  const getAddressFromCoordinates = async (lat, lng) => {
    if (!hereMaps) return null;

    try {
      const geocoder = hereMaps.platform.getGeocodingService();
      const result = await new Promise((resolve, reject) => {
        geocoder.reverseGeocode(
          { at: `${lat},${lng}` },
          resolve,
          reject
        );
      });

      if (result && result.items && result.items.length > 0) {
        const address = result.items[0].address;
        return {
          label: address.label,
          street: address.street || '',
          district: address.district || '',
          city: address.city || '',
          state: address.state || '',
          country: address.countryName || '',
          postalCode: address.postalCode || '',
          position: { lat, lng },
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting address from coordinates:', error);
      return null;
    }
  };

  // Function to calculate route
  const calculateRoute = async (from, to) => {
    if (!hereMaps) return null;

    try {
      const router = hereMaps.platform.getRoutingService();
      const routeRequest = {
        mode: 'fastest;car',
        representation: 'display',
        routeattributes: 'waypoints,summary,shape,boundingbox',
        waypoint0: `${from.lat},${from.lng}`, // Origin
        waypoint1: `${to.lat},${to.lng}`, // Destination
        alternatives: 1,
      };

      const result = await new Promise((resolve, reject) => {
        router.calculateRoute(routeRequest, resolve, reject);
      });

      if (result.response && result.response.route) {
        const route = result.response.route[0];
        return {
          distance: route.summary.distance, // in meters
          duration: route.summary.travelTime, // in seconds
          shape: route.shape, // polyline points
          boundingBox: route.boundingBox,
        };
      }
      return null;
    } catch (error) {
      console.error('Error calculating route:', error);
      return null;
    }
  };

  return (
    <HereMapsContext.Provider
      value={{
        hereMaps,
        isLoading,
        error,
        getPlaceSuggestions,
        getAddressFromCoordinates,
        calculateRoute,
      }}
    >
      {children}
    </HereMapsContext.Provider>
  );
};

export const useHereMaps = () => {
  const context = useContext(HereMapsContext);
  if (context === undefined) {
    throw new Error('useHereMaps must be used within a HereMapsProvider');
  }
  return context;
};

export default HereMapsContext;
