// This should be called from your backend/API, not frontend
export class MapProxyService {
  static async calculateRoute(origin, destination, apiKey) {
    try {
      // In production, call this from your backend API
      // For now, we'll use a fallback calculation
      
      const distance = this.calculateHaversineDistance(origin, destination);
      const duration = this.calculateDuration(distance);
      
      return {
        distance, // meters
        duration, // seconds
        polyline: null,
        trafficFactor: 1.2,
        fallback: true
      };
    } catch (error) {
      console.error('Route calculation failed:', error);
      throw error;
    }
  }

  static calculateHaversineDistance(origin, destination) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(destination.lat - origin.lat);
    const dLon = this.toRad(destination.lng - origin.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(origin.lat)) * Math.cos(this.toRad(destination.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Add 30% for road curves
    return distance * 1.3;
  }

  static calculateDuration(distanceMeters) {
    // Average speed: 30 km/h in city, 60 km/h on highway
    const avgSpeed = distanceMeters > 5000 ? 60 : 30; // km/h
    const speedMps = avgSpeed * 1000 / 3600; // Convert to m/s
    return distanceMeters / speedMps; // seconds
  }

  static toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}