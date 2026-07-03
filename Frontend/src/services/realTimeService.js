// import { 
//   collection, 
//   doc, 
//   query, 
//   where, 
//   orderBy, 
//   onSnapshot,
//   updateDoc,
//   serverTimestamp,
//   arrayUnion,
//   arrayRemove 
// } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';

// class RealTimeService {
//   constructor() {
//     this.auth = getAuth();
//     this.unsubscribers = new Map();
//   }

//   // Get current user
//   getCurrentUser() {
//     return this.auth.currentUser;
//   }

//   // Subscribe to user's bookings in real-time
//   subscribeToUserBookings(callback) {
//     const user = this.getCurrentUser();
//     if (!user) {
//       console.error('No user found for real-time subscription');
//       return () => {};
//     }

//     console.log('🔔 Subscribing to user bookings:', user.uid);
    
//     const bookingsRef = collection(db, 'users', user.uid, 'bookings');
//     const q = query(bookingsRef, orderBy('createdAt', 'desc'));
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const bookings = [];
//       snapshot.forEach(doc => {
//         const data = doc.data();
//         bookings.push({
//           id: doc.id,
//           ...data,
//           isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//         });
//       });
      
//       console.log('📥 Real-time bookings update:', bookings.length, 'bookings');
//       callback(bookings);
//     }, (error) => {
//       console.error('❌ Real-time subscription error:', error);
//       callback([], error);
//     });

//     this.unsubscribers.set('userBookings', unsubscribe);
//     return unsubscribe;
//   }

//   // Subscribe to a specific booking in real-time
//   subscribeToBooking(bookingId, callback) {
//     const user = this.getCurrentUser();
//     if (!user || !bookingId) {
//       console.error('Missing user or bookingId for subscription');
//       return () => {};
//     }

//     console.log('🔔 Subscribing to booking:', bookingId);
    
//     const bookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
    
//     const unsubscribe = onSnapshot(bookingRef, (doc) => {
//       if (doc.exists()) {
//         const data = doc.data();
//         const booking = {
//           id: doc.id,
//           ...data,
//           isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//         };
        
//         console.log('📥 Real-time booking update:', booking.status);
//         callback(booking, null);
//       } else {
//         callback(null, new Error('Booking not found'));
//       }
//     }, (error) => {
//       console.error('❌ Booking subscription error:', error);
//       callback(null, error);
//     });

//     this.unsubscribers.set(`booking_${bookingId}`, unsubscribe);
//     return unsubscribe;
//   }

//   // Subscribe to active rides only
//   subscribeToActiveRides(callback) {
//     const user = this.getCurrentUser();
//     if (!user) {
//       console.error('No user found for active rides subscription');
//       return () => {};
//     }

//     console.log('🔔 Subscribing to active rides for user:', user.uid);
    
//     const bookingsRef = collection(db, 'users', user.uid, 'bookings');
//     const q = query(
//       bookingsRef, 
//       where('status', 'not-in', ['cancelled', 'completed']),
//       orderBy('updatedAt', 'desc')
//     );
    
//     const unsubscribe = onSnapshot(q, (snapshot) => {
//       const activeRides = [];
//       snapshot.forEach(doc => {
//         const data = doc.data();
//         activeRides.push({
//           id: doc.id,
//           ...data,
//           isActive: true
//         });
//       });
      
//       console.log('📥 Active rides update:', activeRides.length, 'rides');
//       callback(activeRides);
//     }, (error) => {
//       console.error('❌ Active rides subscription error:', error);
//       callback([], error);
//     });

//     this.unsubscribers.set('activeRides', unsubscribe);
//     return unsubscribe;
//   }

//   // Subscribe to driver location updates for a booking
//   subscribeToDriverLocation(bookingId, callback) {
//     if (!bookingId) return () => {};

//     console.log('📍 Subscribing to driver location for booking:', bookingId);
    
//     // Check in user's bookings collection
//     const user = this.getCurrentUser();
//     if (user) {
//       const bookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
      
//       const unsubscribe = onSnapshot(bookingRef, (doc) => {
//         if (doc.exists()) {
//           const data = doc.data();
//           if (data.driverLocation || data.liveTracking?.driverLocation) {
//             const location = data.driverLocation || data.liveTracking?.driverLocation;
//             callback(location, null);
//           }
//         }
//       }, (error) => {
//         console.error('Driver location subscription error:', error);
//         callback(null, error);
//       });

//       this.unsubscribers.set(`driverLocation_${bookingId}`, unsubscribe);
//       return unsubscribe;
//     }

//     return () => {};
//   }

//   // Send push notification update to booking
//   async sendBookingUpdate(bookingId, updateData, type = 'status_change') {
//     try {
//       const user = this.getCurrentUser();
//       if (!user || !bookingId) throw new Error('Missing user or bookingId');

//       const bookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
      
//       const update = {
//         ...updateData,
//         updatedAt: serverTimestamp(),
//         lastUpdatedBy: user.uid,
//         lastUpdateType: type
//       };

//       await updateDoc(bookingRef, update);
      
//       console.log('✅ Booking update sent:', { bookingId, type, update });
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Error sending booking update:', error);
//       throw error;
//     }
//   }

//   // Add real-time activity log
//   async addActivityLog(bookingId, activity) {
//     try {
//       const user = this.getCurrentUser();
//       if (!user || !bookingId) throw new Error('Missing user or bookingId');

//       const bookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
      
//       const logEntry = {
//         ...activity,
//         timestamp: serverTimestamp(),
//         userId: user.uid
//       };

//       await updateDoc(bookingRef, {
//         activityLog: arrayUnion(logEntry),
//         updatedAt: serverTimestamp()
//       });

//       console.log('📝 Activity log added:', { bookingId, activity });
//       return { success: true };
//     } catch (error) {
//       console.error('❌ Error adding activity log:', error);
//       throw error;
//     }
//   }

//   // Cleanup all subscriptions
//   cleanup() {
//     console.log('🧹 Cleaning up all real-time subscriptions');
//     this.unsubscribers.forEach(unsubscribe => {
//       if (typeof unsubscribe === 'function') {
//         unsubscribe();
//       }
//     });
//     this.unsubscribers.clear();
//   }

//   // Cleanup specific subscription
//   cleanupSubscription(key) {
//     if (this.unsubscribers.has(key)) {
//       console.log('🧹 Cleaning up subscription:', key);
//       const unsubscribe = this.unsubscribers.get(key);
//       if (typeof unsubscribe === 'function') {
//         unsubscribe();
//       }
//       this.unsubscribers.delete(key);
//     }
//   }
// }
  
// export default new RealTimeService();

import { 
  collection, 
  doc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';
import BookingHistoryService from '../services/bookingHistoryService';

class RealTimeService {
  constructor() {
    this.auth = getAuth();
    this.unsubscribers = new Map();
  }

  // Get current user
  getCurrentUser() {
    return this.auth.currentUser;
  }

  // Subscribe to all rides from both collections
  subscribeToAllRides(callback) {
    const user = this.getCurrentUser();
    if (!user) {
      console.error('No user found for subscription');
      return () => {};
    }

    console.log('🔔 Subscribing to all rides for:', user.email);
    
    // Array to store all rides
    let allRides = [];
    
    // 1. Subscribe to airportTransfers
    const unsubscribeAirport = this.subscribeToAirportTransfers((airportRides) => {
      // Update airport rides
      allRides = allRides.filter(r => r.collectionType !== 'airportTransfers');
      allRides.push(...airportRides);
      this.processAndSendRides(allRides, callback);
    });
    
    // 2. Subscribe to bookings
    const unsubscribeBookings = this.subscribeToBookings((bookingRides) => {
      // Update booking rides
      allRides = allRides.filter(r => r.collectionType !== 'bookings');
      allRides.push(...bookingRides);
      this.processAndSendRides(allRides, callback);
    });
    
    // Store both unsubscribe functions
    this.unsubscribers.set('airportRides', unsubscribeAirport);
    this.unsubscribers.set('bookingRides', unsubscribeBookings);
    
    // Return combined cleanup function
    return () => {
      unsubscribeAirport();
      unsubscribeBookings();
      this.unsubscribers.delete('airportRides');
      this.unsubscribers.delete('bookingRides');
    };
  }

  // Subscribe to airport transfers
  subscribeToAirportTransfers(callback) {
    const user = this.getCurrentUser();
    if (!user) return () => {};

    const airportTransfersRef = collection(db, 'airportTransfers');
    const queries = [
      query(
        airportTransfersRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      query(
        airportTransfersRef,
        where('userEmail', '==', user.email),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    ];

    const allRides = [];
    const unsubscribes = [];

    queries.forEach((q, index) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rides = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          rides.push(BookingHistoryService.mapAirportTransferData(doc.id, data));
        });
        
        // Update rides for this query
        if (index === 0) {
          // Remove rides from first query
          allRides.splice(0, allRides.length, ...rides);
        } else {
          // Add rides from second query (avoid duplicates)
          rides.forEach(newRide => {
            if (!allRides.find(r => r.id === newRide.id)) {
              allRides.push(newRide);
            }
          });
        }
        
        callback(allRides);
      }, (error) => {
        console.error('Airport transfer subscription error:', error);
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }

  // Subscribe to bookings
  subscribeToBookings(callback) {
    const user = this.getCurrentUser();
    if (!user) return () => {};

    const bookingsRef = collection(db, 'bookings');
    const queries = [
      query(
        bookingsRef,
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc'),
        limit(10)
      ),
      query(
        bookingsRef,
        where('customerEmail', '==', user.email),
        orderBy('createdAt', 'desc'),
        limit(10)
      )
    ];

    const allRides = [];
    const unsubscribes = [];

    queries.forEach((q, index) => {
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const rides = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          rides.push(BookingHistoryService.mapBookingData(doc.id, data));
        });
        
        // Update rides for this query
        if (index === 0) {
          allRides.splice(0, allRides.length, ...rides);
        } else {
          rides.forEach(newRide => {
            if (!allRides.find(r => r.id === newRide.id)) {
              allRides.push(newRide);
            }
          });
        }
        
        callback(allRides);
      }, (error) => {
        console.error('Bookings subscription error:', error);
      });
      
      unsubscribes.push(unsubscribe);
    });

    return () => unsubscribes.forEach(unsub => unsub());
  }

  // Process and limit rides before sending to callback
  processAndSendRides(rides, callback) {
    if (!rides.length) {
      callback([]);
      return;
    }

    // Sort by date (newest first)
    rides.sort((a, b) => {
      const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
      const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
      return bDate - aDate;
    });

    // Limit to last 20 rides
    const limitedRides = rides.slice(0, 20);
    
    // Save to history for future reference
    limitedRides.forEach(ride => {
      BookingHistoryService.saveToUserHistory(ride.id, ride, ride.collectionType);
    });

    console.log('📊 Total rides:', rides.length, 'Showing:', limitedRides.length);
    callback(limitedRides);
  }

  // Subscribe to active rides only
  subscribeToActiveRides(callback) {
    const unsubscribe = this.subscribeToAllRides((allRides) => {
      const activeRides = allRides.filter(ride => 
        !['cancelled', 'completed'].includes(ride.status?.toLowerCase())
      );
      callback(activeRides);
    });

    this.unsubscribers.set('activeRides', unsubscribe);
    return unsubscribe;
  }

  // Subscribe to specific ride
  subscribeToRide(rideId, callback) {
    if (!rideId) return () => {};

    console.log('🔔 Subscribing to ride:', rideId);
    
    // Try airportTransfers first
    const airportRef = doc(db, 'airportTransfers', rideId);
    const unsubscribeAirport = onSnapshot(airportRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const ride = BookingHistoryService.mapAirportTransferData(doc.id, data);
        callback(ride, null);
        return;
      }
      
      // If not in airportTransfers, try bookings
      const bookingRef = doc(db, 'bookings', rideId);
      const unsubscribeBooking = onSnapshot(bookingRef, (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const ride = BookingHistoryService.mapBookingData(doc.id, data);
          callback(ride, null);
        } else {
          callback(null, new Error('Ride not found'));
        }
      });
      
      // Store for cleanup
      this.unsubscribers.set(`ride_${rideId}_booking`, unsubscribeBooking);
    });

    this.unsubscribers.set(`ride_${rideId}_airport`, unsubscribeAirport);
    
    return () => {
      unsubscribeAirport();
      const bookingUnsub = this.unsubscribers.get(`ride_${rideId}_booking`);
      if (bookingUnsub) bookingUnsub();
    };
  }

  // Cleanup all subscriptions
  cleanup() {
    console.log('🧹 Cleaning up all real-time subscriptions');
    this.unsubscribers.forEach((unsubscribe, key) => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });
    this.unsubscribers.clear();
  }
}

export default new RealTimeService();