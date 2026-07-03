// src/utils/uberTracking.js - COMPLETE FIXED VERSION
import { MockMapMyIndiaAPI } from '../api/mockMapMyIndia';

export class UberStyleTracking {
  constructor(apiKey, useMockAPI = true) { // Changed to useMockAPI
    this.apiKey = apiKey;
    this.useMockAPI = useMockAPI; // Use mock API instead of proxy
    this.previousLocations = [];
    this.maxHistory = 10;
    this.routeCache = new Map();
    this.CACHE_TTL = 30000;
  }

  // Calculate route - FIXED VERSION
  async calculateRoute(driverLoc, customerLoc, waypoints = []) {
    const cacheKey = `${driverLoc.lat},${driverLoc.lng}_${customerLoc.lat},${customerLoc.lng}`;
    const cached = this.routeCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      console.log('🚗 Using cached route');
      return cached.data;
    }

    try {
      let routeData;
      
      if (this.useMockAPI) {
        // Use mock API (no backend needed)
        routeData = await this.callMockAPI(driverLoc, customerLoc, waypoints);
      } else {
        // Use direct calculation (fallback)
        routeData = this.calculateDirectRoute(driverLoc, customerLoc);
      }

      // Cache the result
      this.routeCache.set(cacheKey, {
        data: routeData,
        timestamp: Date.now()
      });

      return routeData;

    } catch (error) {
      console.error('Route calculation error:', error);
      return this.calculateFallbackRoute(driverLoc, customerLoc);
    }
  }

  // Call mock API
  async callMockAPI(driverLoc, customerLoc, waypoints = []) {
    try {
      console.log('🗺️ Calling mock MapMyIndia API...');
      
      const response = await MockMapMyIndiaAPI.calculateRoute(driverLoc, customerLoc);
      
      if (response.routes && response.routes.length > 0) {
        return this.formatRouteResponse(response.routes[0]);
      }
      
      throw new Error('No route found from mock API');
      
    } catch (error) {
      console.error('Mock API error:', error);
      return this.calculateDirectRoute(driverLoc, customerLoc);
    }
  }

  // Format route response
  formatRouteResponse(route) {
    return {
      distance: route.distance || 0,
      duration: route.duration || 0,
      polyline: route.geometry,
      steps: route.legs?.[0]?.steps || [],
      trafficFactor: route.weight || 1.2,
      bounds: route.bounds || null,
      waypoints: route.waypoints || [],
      mock: true // Flag to indicate mock data
    };
  }

  // Direct calculation without API (fallback)
  calculateDirectRoute(driverLoc, customerLoc) {
    const distance = this.calculateHaversineDistance(driverLoc, customerLoc);
    const duration = this.calculateDuration(distance);
    
    return {
      distance,
      duration,
      polyline: null,
      steps: [],
      trafficFactor: 1.2,
      bounds: {
        north: Math.max(driverLoc.lat, customerLoc.lat) + 0.01,
        south: Math.min(driverLoc.lat, customerLoc.lat) - 0.01,
        east: Math.max(driverLoc.lng, customerLoc.lng) + 0.01,
        west: Math.min(driverLoc.lng, customerLoc.lng) - 0.01
      },
      direct: true
    };
  }

  // Calculate distance using Haversine formula
  calculateHaversineDistance(point1, point2) {
    const R = 6371000;
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance * 1.3; // Add 30% for road curves
  }

  // Calculate duration based on distance
  calculateDuration(distanceMeters) {
    let avgSpeed;
    if (distanceMeters < 1000) avgSpeed = 20;
    else if (distanceMeters < 5000) avgSpeed = 30;
    else if (distanceMeters < 20000) avgSpeed = 40;
    else avgSpeed = 60;
    
    const speedMps = avgSpeed * 1000 / 3600;
    return distanceMeters / speedMps;
  }

  // Fallback route calculation
  calculateFallbackRoute(driverLoc, customerLoc) {
    const distance = this.calculateHaversineDistance(driverLoc, customerLoc);
    const duration = this.calculateDuration(distance);
    
    return {
      distance,
      duration,
      polyline: null,
      steps: [],
      trafficFactor: 1.5,
      fallback: true
    };
  }

  // Intelligent ETA calculation
  calculateETA(distanceMeters, trafficFactor = 1, driverSpeed = null) {
    const baseSpeed = driverSpeed || 30;
    const effectiveSpeed = baseSpeed / trafficFactor;
    
    const distanceKm = distanceMeters / 1000;
    const timeHours = distanceKm / effectiveSpeed;
    let etaMinutes = Math.ceil(timeHours * 60);
    
    // Add buffers
    if (distanceMeters < 1000) {
      etaMinutes += 3;
    } else if (distanceMeters < 5000) {
      etaMinutes += Math.ceil(etaMinutes * 0.15);
    } else {
      etaMinutes += Math.ceil(etaMinutes * 0.10);
    }
    
    return Math.max(2, etaMinutes);
  }

  // Format distance for display
  formatDistance(meters) {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else if (meters < 10000) {
      return `${(meters / 1000).toFixed(1)} km`;
    } else {
      return `${Math.round(meters / 1000)} km`;
    }
  }

  // Format ETA for display
  formatETA(minutes) {
    if (minutes < 2) return 'Arriving now';
    if (minutes < 60) return `${minutes} min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (mins === 0) return `${hours} hr`;
    return `${hours} hr ${mins} min`;
  }

  toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}