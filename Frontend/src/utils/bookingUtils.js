import { doc, updateDoc, serverTimestamp, getDoc, query, collectionGroup, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { sendDriverAssignedEmail } from './emailService';

export const acceptHolidayRide = async (bookingId, driverId, driverName, vehicleDetails) => {
  try {
    console.log(`[acceptHolidayRide] Starting to accept holiday ride ${bookingId} for driver ${driverId}`);
    
    // First try to find the booking in holidayBookings collection
    const bookingRef = doc(db, 'holidayBookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    let bookingData = null;
    let bookingPath = `holidayBookings/${bookingId}`;
    
    // If not found in holidayBookings, try to find in user's holidayRequests
    if (!bookingDoc.exists()) {
      console.log(`[acceptHolidayRide] Booking not found in holidayBookings, checking user's holidayRequests...`);
      
      // Search across all users' holidayRequests subcollections
      const holidayRequestsQuery = query(
        collectionGroup(db, 'holidayRequests'),
        where('id', '==', bookingId),
        where('status', 'in', ['pending', 'searching_driver'])
      );
      
      const querySnapshot = await getDocs(holidayRequestsQuery);
      
      if (!querySnapshot.empty) {
        // Get the first matching document
        const docSnapshot = querySnapshot.docs[0];
        bookingData = docSnapshot.data();
        bookingPath = docSnapshot.ref.path;
        console.log(`[acceptHolidayRide] Found booking in user's holidayRequests:`, bookingPath);
      } else {
        throw new Error('Holiday booking request not found or already assigned');
      }
    } else {
      bookingData = bookingDoc.data();
      console.log(`[acceptHolidayRide] Found booking in holidayBookings`);
    }
    
    // Check if booking is already assigned to this driver
    if (bookingData.driverId === driverId) {
      return {
        success: true,
        bookingId,
        message: 'You have already accepted this booking',
        ...bookingData
      };
    }
    
    // Check if booking is assigned to another driver
    if (bookingData.status === 'accepted' || bookingData.status === 'completed' || bookingData.driverId) {
      throw new Error('This holiday booking has already been assigned to another driver');
    }
    
    // Prepare driver info
    const driverInfo = {
      id: driverId,
      name: driverName,
      phone: vehicleDetails.phoneNumber || '',
      photoURL: vehicleDetails.photoURL || '',
      vehicle: {
        type: vehicleDetails.type || 'Standard',
        model: vehicleDetails.model || 'N/A',
        number: vehicleDetails.registrationNumber || 'N/A',
        color: vehicleDetails.color || 'N/A',
        capacity: vehicleDetails.capacity || 4
      },
      rating: 5, // Default rating
      totalRides: 0 // Default total rides
    };
    
    // Update the booking with driver info
    const updateData = {
      status: 'accepted',
      driverId,
      driverName,
      driverPhone: driverInfo.phone,
      driverPhotoURL: driverInfo.photoURL,
      vehicle: driverInfo.vehicle,
      assignedDriver: driverInfo,
      updatedAt: serverTimestamp(),
      acceptedAt: serverTimestamp()
    };

    // Add location data if available
    if (vehicleDetails.currentLocation) {
      updateData.driverLocation = vehicleDetails.currentLocation;
      updateData['assignedDriver.currentLocation'] = vehicleDetails.currentLocation;
    }

    // Update booking with driver info
    await updateDoc(bookingRef, updateData);

    // Send email notification if customer email exists
    if (bookingData.customerEmail) {
      await sendDriverAssignedEmail({
        to: bookingData.customerEmail,
        customerName: bookingData.customerName || bookingData.userName || 'Customer',
        driverName,
        vehicleDetails: driverInfo.vehicle,
        bookingDetails: {
          ...bookingData,
          driverInfo,
          status: 'driver_assigned',
          driverAssignedAt: new Date().toISOString()
        },
        bookingId
      });
    }

    console.log(`Driver ${driverId} assigned to booking ${bookingId}`);
    return { 
      success: true,
      bookingId,
      driverInfo,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error accepting holiday ride:', error);
    throw error;
  }
};

export const getBookingStatus = (status) => {
  const statusMap = {
    pending: { text: 'Pending', color: 'bg-yellow-500' },
    finding_driver: { text: 'Finding Driver', color: 'bg-blue-300' },
    driver_assigned: { text: 'Driver Assigned', color: 'bg-green-500' },
    driver_accepted: { text: 'Driver Accepted', color: 'bg-green-400' },
    in_progress: { text: 'In Progress', color: 'bg-blue-500' },
    completed: { text: 'Completed', color: 'bg-green-700' },
    cancelled: { text: 'Cancelled', color: 'bg-red-500' },
    no_driver_available: { text: 'No Driver Available', color: 'bg-red-400' }
  };
  return statusMap[status] || { text: status, color: 'bg-gray-500' };
};