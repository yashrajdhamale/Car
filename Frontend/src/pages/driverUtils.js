import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Normalize location string for matching
 */
export const normalizeLocation = (location) => {
  if (!location) return '';
  if (typeof location === 'string') return location.toLowerCase().trim();
  return (location.name || location.address || '').toLowerCase().trim();
};

/**
 * Find an available driver with a matching route
 * @param {Object} bookingData - The booking data containing pickup and dropoff locations
 * @returns {Object|null} - Driver object or null if no match found
 */
export const findAvailableDriver = async (bookingData) => {
  try {
    const { pickupLocation, dropoffLocation } = bookingData;
    const pickupNorm = normalizeLocation(pickupLocation);
    const dropoffNorm = normalizeLocation(dropoffLocation);

    console.log('🔍 Searching for drivers with route:', pickupNorm, '→', dropoffNorm);

    // Get all drivers
    const driversRef = collection(db, 'drivers');
    const driversSnapshot = await getDocs(driversRef);

    console.log(`Found ${driversSnapshot.size} drivers in database`);

    for (const driverDoc of driversSnapshot.docs) {
      const driverId = driverDoc.id;
      const driverData = driverDoc.data();

      // Check driver status
      const status = driverData.status || 'unknown';
      console.log(`Checking driver ${driverId}: status = ${status}`);

      // Accept active, available, or online drivers
      if (!['available', 'online', 'active'].includes(status)) {
        console.log(`❌ Skipping driver ${driverId} - status: ${status}`);
        continue;
      }

      // Check for assigned routes in subcollection
      const routesRef = collection(db, 'drivers', driverId, 'assignedRoutes');
      const routesSnapshot = await getDocs(routesRef);

      console.log(`Driver ${driverId} has ${routesSnapshot.size} assigned routes`);

      for (const routeDoc of routesSnapshot.docs) {
        const route = routeDoc.data();
        const routeFrom = normalizeLocation(route.from);
        const routeTo = normalizeLocation(route.to);

        console.log(`  Route: ${routeFrom} → ${routeTo}`);

        // Check if route matches (bidirectional)
        const forwardMatch = routeFrom === pickupNorm && routeTo === dropoffNorm;
        const reverseMatch = routeFrom === dropoffNorm && routeTo === pickupNorm;

        if (forwardMatch || reverseMatch) {
          console.log(`✅ MATCHED DRIVER: ${driverId}`);
          return {
            id: driverId,
            ...driverData
          };
        }
      }
    }

    console.log('❌ No matching drivers found');
    return null;
  } catch (error) {
    console.error('Error finding available driver:', error);
    return null;
  }
};

/**
 * Get driver details by ID
 */
export const getDriverById = async (driverId) => {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    const driverSnap = await getDoc(driverRef);
    
    if (driverSnap.exists()) {
      return {
        id: driverSnap.id,
        ...driverSnap.data()
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting driver:', error);
    return null;
  }
};

/**
 * Check if a driver has a specific route assigned
 */
export const hasDriverRoute = async (driverId, pickup, dropoff) => {
  try {
    const pickupNorm = normalizeLocation(pickup);
    const dropoffNorm = normalizeLocation(dropoff);

    const routesRef = collection(db, 'drivers', driverId, 'assignedRoutes');
    const routesSnapshot = await getDocs(routesRef);

    for (const routeDoc of routesSnapshot.docs) {
      const route = routeDoc.data();
      const routeFrom = normalizeLocation(route.from);
      const routeTo = normalizeLocation(route.to);

      const forwardMatch = routeFrom === pickupNorm && routeTo === dropoffNorm;
      const reverseMatch = routeFrom === dropoffNorm && routeTo === pickupNorm;

      if (forwardMatch || reverseMatch) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking driver route:', error);
    return false;
  }
};