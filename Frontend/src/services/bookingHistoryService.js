// import { 
//   collection, 
//   doc, 
//   setDoc, 
//   getDoc, 
//   getDocs, 
//   updateDoc, 
//   query, 
//   where, 
//   orderBy,
//   serverTimestamp,
//   Timestamp 
// } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';

// class BookingHistoryService {
//   getCurrentUser() {
//     const auth = getAuth();
//     return auth.currentUser;
//   }

//   // Create a new booking record - FIXED PATH
//   async createBooking(bookingData) {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) throw new Error('User not authenticated');

//       const bookingId = bookingData.bookingId || `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
//       const bookingRecord = {
//         ...bookingData,
//         bookingId,
//         userId: user.uid,
//         userEmail: user.email || '',
//         userPhone: user.phoneNumber || '',
//         createdAt: serverTimestamp(),
//         updatedAt: serverTimestamp(),
//         status: 'searching_driver',
//         paymentStatus: 'pending',
//         isActive: true
//       };

//       console.log('💾 Saving booking to Firestore:', {
//         userId: user.uid,
//         bookingId,
//         path: `users/${user.uid}/bookings/${bookingId}`
//       });

//       // IMPORTANT: Save to user's personal collection
//       const userBookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
//       await setDoc(userBookingRef, bookingRecord);

//       // Also save to global bookings collection for admin access
//       const globalBookingRef = doc(db, 'bookings', bookingId);
//       await setDoc(globalBookingRef, {
//         ...bookingRecord,
//         userRef: doc(db, 'users', user.uid)
//       });

//       console.log('✅ Booking saved successfully');
//       return { success: true, bookingId, bookingData: bookingRecord };
//     } catch (error) {
//       console.error('❌ Error creating booking:', error);
//       throw error;
//     }
//   }

//   // Get all bookings for current user - FIXED PATH
//   async getUserBookings() {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) throw new Error('User not authenticated');

//       console.log('📋 Fetching bookings for user:', user.uid);
      
//       // Try user's personal collection first
//       const userBookingsRef = collection(db, 'users', user.uid, 'bookings');
//       const q = query(userBookingsRef, orderBy('createdAt', 'desc'));
//       const snapshot = await getDocs(q);

//       const bookings = [];
//       snapshot.forEach(doc => {
//         const data = doc.data();
//         bookings.push({
//           id: doc.id,
//           ...data,
//           isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//         });
//       });

//       console.log('✅ Found', bookings.length, 'bookings in user collection');
      
//       // If no bookings in user collection, check global collection
//       if (bookings.length === 0) {
//         console.log('🔍 Checking global bookings collection...');
//         const globalBookingsRef = collection(db, 'bookings');
//         const globalQuery = query(globalBookingsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));
//         const globalSnapshot = await getDocs(globalQuery);
        
//         globalSnapshot.forEach(doc => {
//           const data = doc.data();
//           bookings.push({
//             id: doc.id,
//             ...data,
//             isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//           });
//         });
        
//         console.log('✅ Found', bookings.length, 'bookings in global collection');
//       }

//       return bookings;
//     } catch (error) {
//       console.error('❌ Error fetching user bookings:', error);
//       throw error;
//     }
//   }

//   // Get single booking by ID
//   async getBookingById(bookingId) {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) throw new Error('User not authenticated');

//       console.log('🔍 Getting booking:', bookingId, 'for user:', user.uid);

//       // Check user's personal collection
//       const userBookingRef = doc(db, 'users', user.uid, 'bookings', bookingId);
//       const userBookingSnap = await getDoc(userBookingRef);

//       if (userBookingSnap.exists()) {
//         const data = userBookingSnap.data();
//         console.log('✅ Found in user collection');
//         return {
//           id: userBookingSnap.id,
//           ...data,
//           isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//         };
//       }

//       // Check global collection
//       console.log('🔍 Checking global collection...');
//       const globalBookingRef = doc(db, 'bookings', bookingId);
//       const globalSnap = await getDoc(globalBookingRef);
      
//       if (globalSnap.exists()) {
//         const data = globalSnap.data();
//         console.log('✅ Found in global collection');
//         return {
//           id: globalSnap.id,
//           ...data,
//           isActive: data.isActive !== undefined ? data.isActive : !['cancelled', 'completed'].includes(data.status)
//         };
//       }
      
//       throw new Error('Booking not found');
//     } catch (error) {
//       console.error('❌ Error fetching booking:', error);
//       throw error;
//     }
//   }
// }

// export default new BookingHistoryService();

// import { 
//   collection, 
//   doc, 
//   setDoc, 
//   getDoc, 
//   getDocs, 
//   query, 
//   where, 
//   orderBy,
//   limit,
//   serverTimestamp
// } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { getAuth } from 'firebase/auth';

// class BookingHistoryService {
//   getCurrentUser() {
//     const auth = getAuth();
//     return auth.currentUser;
//   }

//   // Save to user's history (limited to 20 rides)
//   async saveToUserHistory(rideId, rideData, collectionName) {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) return;

//       const historyRef = doc(db, 'users', user.uid, 'history', 'rides');
//       const historyDoc = await getDoc(historyRef);

//       const historyEntry = {
//         ...rideData,
//         id: rideId,
//         collectionName: collectionName, // Track which collection it came from
//         addedToHistoryAt: serverTimestamp()
//       };

//       if (!historyDoc.exists()) {
//         // Create new history with first ride
//         await setDoc(historyRef, {
//           rides: [historyEntry],
//           lastUpdated: serverTimestamp(),
//           count: 1,
//           userId: user.uid
//         });
//       } else {
//         // Get existing history
//         const currentData = historyDoc.data();
//         const currentRides = currentData.rides || [];
        
//         // Remove duplicate if exists
//         let updatedRides = currentRides.filter(r => r.id !== rideId);
        
//         // Add new ride at beginning
//         updatedRides = [historyEntry, ...updatedRides];
        
//         // Keep only last 20 rides
//         if (updatedRides.length > 20) {
//           updatedRides = updatedRides.slice(0, 20);
//         }
        
//         // Update history
//         await setDoc(historyRef, {
//           rides: updatedRides,
//           lastUpdated: serverTimestamp(),
//           count: updatedRides.length,
//           userId: user.uid
//         }, { merge: true });
//       }
      
//       console.log('📚 Saved to user history:', rideId);
//     } catch (error) {
//       console.error('❌ Error saving to history:', error);
//     }
//   }

//   // Get all rides from both collections
//   async getUserRides() {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) throw new Error('User not authenticated');

//       console.log('📋 Fetching rides for user:', user.email);
      
//       const allRides = [];
      
//       // 1. Get rides from airportTransfers collection
//       const airportRides = await this.getAirportTransfers(user);
//       allRides.push(...airportRides);
      
//       // 2. Get rides from bookings collection
//       const bookingRides = await this.getBookings(user);
//       allRides.push(...bookingRides);
      
//       // 3. Sort by date (newest first)
//       allRides.sort((a, b) => {
//         const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
//         const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
//         return bDate - aDate;
//       });
      
//       // 4. Limit to last 20 rides for display
//       const limitedRides = allRides.slice(0, 20);
      
//       console.log('✅ Total rides found:', allRides.length, 'Showing:', limitedRides.length);
      
//       return limitedRides;
//     } catch (error) {
//       console.error('❌ Error fetching user rides:', error);
//       throw error;
//     }
//   }

//   // Get rides from airportTransfers collection
//   async getAirportTransfers(user) {
//     const rides = [];
    
//     try {
//       const airportTransfersRef = collection(db, 'airportTransfers');
      
//       // Try by userId
//       const q1 = query(
//         airportTransfersRef,
//         where('userId', '==', user.uid),
//         orderBy('createdAt', 'desc'),
//         limit(10)
//       );
      
//       const snapshot1 = await getDocs(q1);
      
//       if (!snapshot1.empty) {
//         snapshot1.forEach(doc => {
//           rides.push(this.mapAirportTransferData(doc.id, doc.data()));
//         });
//         console.log('✈️ Airport transfers by userId:', rides.length);
//       } else {
//         // Try by email
//         const q2 = query(
//           airportTransfersRef,
//           where('userEmail', '==', user.email),
//           orderBy('createdAt', 'desc'),
//           limit(10)
//         );
        
//         const snapshot2 = await getDocs(q2);
//         snapshot2.forEach(doc => {
//           rides.push(this.mapAirportTransferData(doc.id, doc.data()));
//         });
//         console.log('✈️ Airport transfers by email:', rides.length);
//       }
//     } catch (error) {
//       console.error('Error fetching airport transfers:', error);
//     }
    
//     return rides;
//   }

//   // Get rides from bookings collection
//   async getBookings(user) {
//     const rides = [];
    
//     try {
//       const bookingsRef = collection(db, 'bookings');
      
//       // Try by userId
//       const q1 = query(
//         bookingsRef,
//         where('userId', '==', user.uid),
//         orderBy('createdAt', 'desc'),
//         limit(10)
//       );
      
//       const snapshot1 = await getDocs(q1);
      
//       if (!snapshot1.empty) {
//         snapshot1.forEach(doc => {
//           rides.push(this.mapBookingData(doc.id, doc.data()));
//         });
//         console.log('🚗 Local bookings by userId:', rides.length);
//       } else {
//         // Try by customer email
//         const q2 = query(
//           bookingsRef,
//           where('customerEmail', '==', user.email),
//           orderBy('createdAt', 'desc'),
//           limit(10)
//         );
        
//         const snapshot2 = await getDocs(q2);
//         snapshot2.forEach(doc => {
//           rides.push(this.mapBookingData(doc.id, doc.data()));
//         });
//         console.log('🚗 Local bookings by email:', rides.length);
//       }
//     } catch (error) {
//       console.error('Error fetching bookings:', error);
//     }
    
//     return rides;
//   }

//   // Map airport transfer data
//   mapAirportTransferData(id, data) {
//     // Payment amount from vehiclePrice (string) or price field
//     const vehiclePrice = data.vehiclePrice || '0';
//     const price = parseFloat(vehiclePrice) || parseFloat(data.price) || 0;
    
//     return {
//       id: id,
//       ...data,
//       collectionType: 'airportTransfers',
      
//       // Payment info
//       fare: price,
//       fareAmount: price,
//       totalAmount: price,
//       isPaid: data.paymentStatus === 'paid',
//       paymentAmount: price,
//       paymentStatus: data.paymentStatus || 'pending',
      
//       // Location data
//       pickup: data.pickupLocation || data.pickup,
//       dropoff: data.dropoffLocation || data.dropoff,
      
//       // Vehicle data
//       vehicleType: data.vehicleType || 'Standard',
//       vehicleModel: data.vehicleModel || '',
//       vehicleDetails: {
//         name: data.vehicleType || 'Standard',
//         price: price
//       },
      
//       // Status
//       status: data.status || 'unknown',
//       isActive: !['cancelled', 'completed'].includes(data.status?.toLowerCase() || ''),
      
//       // Dates
//       createdAt: data.createdAt || new Date(),
//       updatedAt: data.updatedAt || new Date(),
      
//       // Driver info
//       driverName: data.driverName || '',
//       driverPhone: data.driverPhone || '',
//       driverId: data.driverId || ''
//     };
//   }

//   // Map booking data (local rides)
//   mapBookingData(id, data) {
//     // Payment amount from price field (number)
//     const price = parseFloat(data.price) || 0;
    
//     // Extract vehicle info from car object
//     const car = data.car || {};
//     const vehicleName = car.name || data.vehicleType || 'Car';
//     const vehicleModel = car.model || data.vehicleModel || '';
    
//     return {
//       id: id,
//       ...data,
//       collectionType: 'bookings',
      
//       // Payment info
//       fare: price,
//       fareAmount: price,
//       totalAmount: price,
//       isPaid: data.paymentStatus === 'paid' || data.status === 'completed',
//       paymentAmount: price,
//       paymentStatus: data.paymentStatus || 'pending',
      
//       // Location data - handle different field names
//       pickup: data.pickupLocation || {
//         name: data.pickupCity || data.pickupSublocality || 'Pickup Location',
//         address: data.pickupSublocalityAddress || data.pickupCity || ''
//       },
//       dropoff: data.dropoffLocation || {
//         name: data.destinationCity || data.destinationSublocality || 'Destination',
//         address: data.destinationSublocalityAddress || data.destinationCity || ''
//       },
      
//       // Vehicle data
//       vehicleType: vehicleName,
//       vehicleModel: vehicleModel,
//       vehicleDetails: {
//         ...car,
//         name: vehicleName,
//         price: price,
//         capacity: car.capacity || 4
//       },
      
//       // Status
//       status: data.status || 'pending',
//       isActive: !['cancelled', 'completed'].includes(data.status?.toLowerCase() || ''),
      
//       // Dates
//       createdAt: data.createdAt || new Date(),
//       updatedAt: data.updatedAt || new Date(),
      
//       // Passenger info
//       passengerCount: data.passengerCount || data.adults || 1,
//       adults: data.adults || data.passengerCount || 1,
//       children: data.children || 0,
      
//       // Trip info
//       distance: data.distance || 0,
//       days: data.days || 1
//     };
//   }

//   // Get single ride by ID from both collections
//   async getRideById(rideId) {
//     try {
//       console.log('🔍 Getting ride:', rideId);

//       // Try airportTransfers first
//       const airportRef = doc(db, 'airportTransfers', rideId);
//       const airportSnap = await getDoc(airportRef);

//       if (airportSnap.exists()) {
//         const data = airportSnap.data();
//         console.log('✅ Found in airportTransfers');
//         return this.mapAirportTransferData(airportSnap.id, data);
//       }

//       // Try bookings collection
//       const bookingRef = doc(db, 'bookings', rideId);
//       const bookingSnap = await getDoc(bookingRef);

//       if (bookingSnap.exists()) {
//         const data = bookingSnap.data();
//         console.log('✅ Found in bookings');
//         return this.mapBookingData(bookingSnap.id, data);
//       }

//       throw new Error('Ride not found in any collection');
//     } catch (error) {
//       console.error('❌ Error fetching ride:', error);
//       throw error;
//     }
//   }

//   // Get user's ride history (last 20)
//   async getUserHistory() {
//     try {
//       const user = this.getCurrentUser();
//       if (!user) return [];

//       const historyRef = doc(db, 'users', user.uid, 'history', 'rides');
//       const historyDoc = await getDoc(historyRef);

//       if (historyDoc.exists()) {
//         const historyData = historyDoc.data();
//         console.log('📚 Found', historyData.rides?.length || 0, 'rides in history');
//         return historyData.rides || [];
//       }
      
//       return [];
//     } catch (error) {
//       console.error('❌ Error fetching user history:', error);
//       return [];
//     }
//   }
// }

// export default new BookingHistoryService();


import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAuth } from 'firebase/auth';

class BookingHistoryService {
  constructor() {
    this.auth = getAuth();
  }

  getCurrentUser() {
    return this.auth.currentUser;
  }

  /* ===============================
     SAVE RIDE TO USER HISTORY
     =============================== */
  async saveToUserHistory(rideId, rideData, collectionType) {
    try {
      const user = this.getCurrentUser();
      if (!user || !rideId) return;

      const historyRideRef = doc(
        db,
        'users',
        user.uid,
        'history',
        rideId
      );

      await setDoc(
        historyRideRef,
        {
          ...rideData,
          id: rideId,
          collectionType,
          userId: user.uid,
          createdAt: rideData.createdAt || serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      console.log('📚 History saved:', rideId);
    } catch (error) {
      console.error('❌ Error saving to history:', error);
    }
  }

  /* ===============================
     GET USER HISTORY (LAST 20)
     =============================== */
  async getUserHistory() {
    try {
      const user = this.getCurrentUser();
      if (!user) return [];

      const historyRef = collection(
        db,
        'users',
        user.uid,
        'history'
      );

      const q = query(
        historyRef,
        orderBy('createdAt', 'desc'),
        limit(20)
      );

      const snapshot = await getDocs(q);
      const rides = [];

      snapshot.forEach(doc => {
        rides.push(doc.data());
      });

      return rides;
    } catch (error) {
      console.error('❌ Error fetching user history:', error);
      return [];
    }
  }

  /* ===============================
     GET SINGLE RIDE FROM HISTORY
     =============================== */
  async getHistoryRideById(rideId) {
    try {
      const user = this.getCurrentUser();
      if (!user || !rideId) return null;

      const rideRef = doc(
        db,
        'users',
        user.uid,
        'history',
        rideId
      );

      const snap = await getDoc(rideRef);
      return snap.exists() ? snap.data() : null;
    } catch (error) {
      console.error('❌ Error fetching history ride:', error);
      return null;
    }
  }

  /* ===============================
     MAP AIRPORT TRANSFER DATA
     =============================== */
  mapAirportTransferData(id, data) {
    const price = parseFloat(data.vehiclePrice || data.price || 0);

    return {
      id,
      ...data,
      collectionType: 'airportTransfers',
      fare: price,
      totalAmount: price,
      isPaid: data.paymentStatus === 'paid',
      paymentStatus: data.paymentStatus || 'pending',
      pickup: data.pickupLocation || data.pickup,
      dropoff: data.dropoffLocation || data.dropoff,
      vehicleType: data.vehicleType || 'Standard',
      status: data.status || 'unknown',
      createdAt: data.createdAt || new Date()
    };
  }

  /* ===============================
     MAP LOCAL BOOKING DATA
     =============================== */
  mapBookingData(id, data) {
    const price = parseFloat(data.price || 0);

    return {
      id,
      ...data,
      collectionType: 'bookings',
      fare: price,
      totalAmount: price,
      isPaid: data.paymentStatus === 'paid' || data.status === 'completed',
      paymentStatus: data.paymentStatus || 'pending',
      pickup: data.pickupLocation || data.pickupCity,
      dropoff: data.dropoffLocation || data.destinationCity,
      vehicleType: data.vehicleType || 'Car',
      status: data.status || 'pending',
      createdAt: data.createdAt || new Date()
    };
  }
}

export default new BookingHistoryService();
