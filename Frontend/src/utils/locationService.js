// Professional background location service
import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';
import { useState, useEffect } from 'react';

class LocationService {
  constructor() {
    this.watchId = null;
    this.subscribers = new Set();
    this.lastLocation = null;
    this.isTracking = false;
    this.updateInterval = 10000; // 10 seconds
    this.backgroundInterval = 30000; // 30 seconds in background
  }

  // Check if running in native app
  isNativeApp() {
    return Capacitor.isNativePlatform();
  }

  // Request permission for native apps
  async requestPermission() {
    if (this.isNativeApp()) {
      try {
        const permission = await Geolocation.requestPermissions();
        console.log('Geolocation permission:', permission);
        return permission.location === 'granted';
      } catch (error) {
        console.error('Permission request failed:', error);
        return false;
      }
    }
    return true; // Web browsers handle permissions differently
  }

  // Start real-time location tracking
  async startTracking(options = {}) {
    // Request permission first for native apps
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const trackingOptions = {
      enableHighAccuracy: false, // Changed to false to prevent timeouts
      timeout: 8000, // Reduced timeout
      maximumAge: 30000, // Use cached location
      distanceFilter: options.distanceFilter || 10, // meters
      ...options
    };

    return new Promise((resolve, reject) => {
      const handleSuccess = (position) => {
        const location = this.processLocation(position);
        this.lastLocation = location;
        this.notifySubscribers(location);
        resolve(location);
      };

      const handleError = (error) => {
        // Suppress timeout errors in console
        if (error.code === 3) {
          console.log('Location tracking timed out - will retry');
        } else {
          console.error('Location tracking error:', error);
        }
        this.handleLocationError(error);
        reject(error);
      };

      if (this.isNativeApp()) {
        // Use Capacitor Geolocation for native apps
        Geolocation.watchPosition(trackingOptions, handleSuccess, handleError)
          .then(watchId => {
            this.watchId = watchId;
            this.isTracking = true;
            console.log('📍 Native location tracking started');
          })
          .catch(reject);
      } else {
        // Use browser geolocation for web
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        // Check browser permissions (not async in the Promise constructor)
        navigator.permissions?.query({ name: 'geolocation' })
          .then(permission => {
            if (permission?.state === 'denied') {
              reject(new Error('Location permission denied'));
              return;
            }

            this.watchId = navigator.geolocation.watchPosition(
              handleSuccess,
              handleError,
              trackingOptions
            );
            this.isTracking = true;
            console.log('📍 Browser location tracking started');
          })
          .catch(reject);
      }
    });
  }

  // Process raw location data
  processLocation(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
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
        console.log('Location request timed out');
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
  async getCurrentLocation() {
    // Request permission first for native apps
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      throw new Error('Location permission denied');
    }

    const options = { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 };

    if (this.isNativeApp()) {
      // Use Capacitor Geolocation for native apps
      try {
        const position = await Geolocation.getCurrentPosition(options);
        const location = this.processLocation(position);
        this.lastLocation = location;
        return location;
      } catch (error) {
        console.error('Native geolocation error:', error);
        throw error;
      }
    } else {
      // Use browser geolocation for web
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = this.processLocation(position);
            this.lastLocation = location;
            resolve(location);
          },
          reject,
          options
        );
      });
    }
  }

  // Stop tracking
  async stopTracking() {
    if (this.watchId) {
      if (this.isNativeApp()) {
        // Use Capacitor to clear watch
        await Geolocation.clearWatch({ id: this.watchId });
      } else {
        // Use browser to clear watch
        navigator.geolocation.clearWatch(this.watchId);
      }
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