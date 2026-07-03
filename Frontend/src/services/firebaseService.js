import { 
  doc, 
  updateDoc, 
  onSnapshot,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  setDoc
} from 'firebase/firestore';
import { db } from '../config/firebase';

// Driver location service
export class DriverLocationService {
  static async updateDriverLocation(driverId, location) {
    try {
      const driverRef = doc(db, 'drivers', driverId);
      
      await updateDoc(driverRef, {
        lastLocation: location,
        locationEnabled: true,
        lastUpdated: serverTimestamp(),
        isOnline: true,
        lastOnline: serverTimestamp()
      });
      
      console.log(`📍 Driver ${driverId} location updated`);
      return true;
    } catch (error) {
      console.error('Error updating driver location:', error);
      throw error;
    }
  }

  // Update driver location in all active rides
  static async updateLocationInAllRides(driverId, location) {
    try {
      // Find all active rides for this driver
      const activeRidesQuery = query(
        collection(db, 'airportTransfers'),
        where('driverId', '==', driverId),
        where('status', 'in', ['accepted', 'driver_arrived', 'in_progress'])
      );
      
      const snapshot = await getDocs(activeRidesQuery);
      const updatePromises = [];
      
      snapshot.forEach((docSnap) => {
        const rideRef = doc(db, 'airportTransfers', docSnap.id);
        updatePromises.push(
          updateDoc(rideRef, {
            driverLocation: location,
            driverLocationUpdatedAt: serverTimestamp(),
            lastUpdated: serverTimestamp()
          })
        );
      });
      
      await Promise.all(updatePromises);
      console.log(`📍 Updated location in ${updatePromises.length} active rides`);
      
      return updatePromises.length;
    } catch (error) {
      console.error('Error updating rides:', error);
      return 0;
    }
  }

  // Get real-time driver location
  static subscribeToDriverLocation(driverId, callback) {
    if (!driverId) {
      console.error('No driver ID provided');
      return () => {};
    }
    
    const driverRef = doc(db, 'drivers', driverId);
    
    const unsubscribe = onSnapshot(driverRef, (docSnap) => {
      if (docSnap.exists()) {
        const driverData = docSnap.data();
        const location = driverData.lastLocation;
        
        if (location) {
          callback({
            ...location,
            driverId,
            name: driverData.name || driverData.displayName || 'Driver',
            isOnline: driverData.isOnline || false,
            accuracy: location.accuracy || 100
          });
        }
      }
    }, (error) => {
      console.error('Driver location subscription error:', error);
      callback({ error: 'Failed to fetch driver location' });
    });
    
    return unsubscribe;
  }

  // Force driver to share location
  static async enforceLocationSharing(driverId) {
    const driverRef = doc(db, 'drivers', driverId);
    
    try {
      await updateDoc(driverRef, {
        locationRequired: true,
        lastWarning: serverTimestamp(),
        onlineUntil: null // Force offline until location shared
      });
      
      return { success: true, message: 'Location sharing required' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Customer location service
export class CustomerLocationService {
  static async updateCustomerLocation(bookingId, location) {
    try {
      const bookingRef = doc(db, 'airportTransfers', bookingId);
      
      await updateDoc(bookingRef, {
        userLocation: location,
        userLocationUpdatedAt: serverTimestamp(),
        lastUpdated: serverTimestamp(),
        locationShared: true
      });
      
      console.log(`📍 Customer location updated for booking ${bookingId}`);
      return true;
    } catch (error) {
      console.error('Error updating customer location:', error);
      throw error;
    }
  }

  // Get real-time ride tracking
  static subscribeToRideTracking(bookingId, callback) {
    const bookingRef = doc(db, 'airportTransfers', bookingId);
    
    const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // Get driver ID to also subscribe to driver location
        const driverId = data.driverId;
        let driverUnsubscribe = () => {};
        
        if (driverId) {
          driverUnsubscribe = DriverLocationService.subscribeToDriverLocation(
            driverId,
            (driverLocation) => {
              callback({
                bookingData: data,
                driverLocation,
                customerLocation: data.userLocation,
                status: data.status,
                updatedAt: data.lastUpdated || data.updatedAt
              });
            }
          );
        } else {
          callback({
            bookingData: data,
            driverLocation: data.driverLocation,
            customerLocation: data.userLocation,
            status: data.status
          });
        }
        
        // Return combined unsubscribe function
        return () => {
          unsubscribe();
          driverUnsubscribe();
        };
      }
    }, (error) => {
      console.error('Ride tracking subscription error:', error);
      callback({ error: 'Failed to track ride' });
    });
    
    return unsubscribe;
  }
}

// Route matching service
export class RouteMatchingService {
  static async findNearbyDrivers(customerLocation, radiusKm = 5) {
    try {
      // This is simplified - in production, use geohashes or Firebase Geoqueries
      const driversQuery = query(
        collection(db, 'drivers'),
        where('isOnline', '==', true),
        where('locationEnabled', '==', true)
      );
      
      const snapshot = await getDocs(driversQuery);
      const nearbyDrivers = [];
      
      snapshot.forEach((docSnap) => {
        const driver = docSnap.data();
        if (driver.lastLocation) {
          const distance = this.calculateDistance(
            customerLocation,
            driver.lastLocation
          );
          
          if (distance <= radiusKm) {
            nearbyDrivers.push({
              id: docSnap.id,
              ...driver,
              distance,
              eta: this.calculateETA(distance, driver.lastLocation.speed || 30)
            });
          }
        }
      });
      
      // Sort by distance
      return nearbyDrivers.sort((a, b) => a.distance - b.distance);
    } catch (error) {
      console.error('Error finding nearby drivers:', error);
      return [];
    }
  }

  static calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  static calculateETA(distanceKm, speedKmph = 30) {
    const timeHours = distanceKm / speedKmph;
    return Math.ceil(timeHours * 60); // minutes
  }

  static toRad(degrees) {
    return degrees * Math.PI / 180;
  }
}