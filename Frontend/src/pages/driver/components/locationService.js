// Professional background location service
class LocationService {
  constructor() {
    this.watchId = null;
    this.subscribers = new Set();
    this.lastLocation = null;
    this.isTracking = false;
    this.updateInterval = 10000; // 10 seconds
    this.backgroundInterval = 30000; // 30 seconds in background
  }

  // Start real-time location tracking
  async startTracking(options = {}) {
    if (!navigator.geolocation) {
      throw new Error('Geolocation not supported');
    }

    // Request permission
    const permission = await navigator.permissions?.query({ name: 'geolocation' });
    if (permission?.state === 'denied') {
      throw new Error('Location permission denied');
    }

    const trackingOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
      distanceFilter: options.distanceFilter || 10, // meters
      ...options
    };

    return new Promise((resolve, reject) => {
      this.watchId = navigator.geolocation.watchPosition(
        (position) => {
          const location = this.processLocation(position);
          this.lastLocation = location;
          this.notifySubscribers(location);
          resolve(location);
        },
        (error) => {
          console.error('Location tracking error:', error);
          this.handleLocationError(error);
          reject(error);
        },
        trackingOptions
      );

      this.isTracking = true;
      console.log('📍 Location tracking started');
    });
  }

  // Process raw location data
  processLocation(position) {
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      timestamp: Date.now(),
      accuracy: position.coords.accuracy,
      speed: position.coords.speed || 0,
      heading: position.coords.heading || null,
      altitude: position.coords.altitude || null,
      altitudeAccuracy: position.coords.altitudeAccuracy || null,
      source: 'gps'
    };
  }

  // Handle location errors
  handleLocationError(error) {
    switch(error.code) {
      case 1: // PERMISSION_DENIED
        console.error('User denied location permission');
        break;
      case 2: // POSITION_UNAVAILABLE
        console.error('Location information unavailable');
        break;
      case 3: // TIMEOUT
        console.error('Location request timed out');
        break;
      default:
        console.error('Unknown location error:', error);
    }
    
    this.notifySubscribers({ error: error.message });
  }

  // Subscribe to location updates
  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Send last location immediately
    if (this.lastLocation) {
      callback(this.lastLocation);
    }
    
    return () => this.unsubscribe(callback);
  }

  // Unsubscribe from updates
  unsubscribe(callback) {
    this.subscribers.delete(callback);
  }

  // Notify all subscribers
  notifySubscribers(location) {
    this.subscribers.forEach(callback => {
      try {
        callback(location);
      } catch (error) {
        console.error('Subscriber error:', error);
      }
    });
  }

  // Get current location (one-time)
  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = this.processLocation(position);
          this.lastLocation = location;
          resolve(location);
        },
        reject,
        { enableHighAccuracy: true, timeout: 15000 }
      );
    });
  }

  // Stop tracking
  stopTracking() {
    if (this.watchId) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
      this.isTracking = false;
      console.log('📍 Location tracking stopped');
    }
  }

  // Check if tracking is active
  isActive() {
    return this.isTracking;
  }

  // Get battery-friendly tracking interval
  getOptimizedInterval() {
    if (navigator.getBattery) {
      return navigator.getBattery().then(battery => {
        if (battery.level < 0.3) return 60000; // 1 minute if low battery
        if (battery.level < 0.5) return 30000; // 30 seconds
        return 10000; // 10 seconds
      });
    }
    return Promise.resolve(this.updateInterval);
  }
}

// Singleton instance
export const locationService = new LocationService();

// React hook for location
export function useLocationTracking(options = {}) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const startTracking = async () => {
      try {
        await locationService.startTracking(options);
        setIsActive(true);
        
        // Subscribe to updates
        const unsubscribe = locationService.subscribe((newLocation) => {
          if (isMounted && !newLocation.error) {
            setLocation(newLocation);
            setError(null);
          } else if (newLocation.error) {
            setError(newLocation.error);
          }
        });
        
        return unsubscribe;
      } catch (err) {
        if (isMounted) {
          setError(err.message);
          setIsActive(false);
        }
      }
    };

    const cleanup = startTracking();

    return () => {
      isMounted = false;
      if (cleanup) {
        cleanup.then(unsubscribe => unsubscribe?.());
      }
      locationService.stopTracking();
    };
  }, [JSON.stringify(options)]);

  return { location, error, isActive };
}