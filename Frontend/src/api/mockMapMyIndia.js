// Mock API for MapMyIndia (works without backend)
export class MockMapMyIndiaAPI {
  static async calculateRoute(origin, destination) {
    console.log('🗺️ Mock API: Calculating route...');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const distance = this.calculateHaversineDistance(origin, destination);
    const duration = this.calculateDuration(distance);
    
    return {
      routes: [{
        distance: distance, // meters
        duration: duration, // seconds
        geometry: this.generateMockPolyline(origin, destination),
        legs: [{
          steps: this.generateMockSteps(origin, destination)
        }],
        weight: 1.2, // traffic factor
        bounds: {
          north: Math.max(origin.lat, destination.lat) + 0.01,
          south: Math.min(origin.lat, destination.lat) - 0.01,
          east: Math.max(origin.lng, destination.lng) + 0.01,
          west: Math.min(origin.lng, destination.lng) - 0.01
        }
      }]
    };
  }

  static calculateHaversineDistance(point1, point2) {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Add 30% for road curves
    return distance * 1.3;
  }

  static calculateDuration(distanceMeters) {
    let avgSpeed;
    if (distanceMeters < 1000) avgSpeed = 20;
    else if (distanceMeters < 5000) avgSpeed = 30;
    else if (distanceMeters < 20000) avgSpeed = 40;
    else avgSpeed = 60;
    
    const speedMps = avgSpeed * 1000 / 3600;
    return distanceMeters / speedMps;
  }

  static generateMockPolyline(origin, destination) {
    // Generate a simple encoded polyline
    const points = [
      [origin.lat, origin.lng],
      [(origin.lat + destination.lat) / 2, (origin.lng + destination.lng) / 2],
      [destination.lat, destination.lng]
    ];
    
    // Simple polyline encoding (just return coordinates array)
    return JSON.stringify(points);
  }

  static generateMockSteps(origin, destination) {
    return [
      {
        distance: this.calculateHaversineDistance(origin, destination) / 2,
        duration: this.calculateDuration(this.calculateHaversineDistance(origin, destination) / 2),
        instruction: "Head toward destination"
      }
    ];
  }

  static toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}