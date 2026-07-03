import { db } from '@config/firebase';
import { runTransaction, doc, serverTimestamp, getDoc, collection, addDoc } from 'firebase/firestore';

export const acceptRide = async (rideId, driverId) => {
  const rideRef = doc(db, 'rides', rideId);
  const availableRideRef = doc(db, 'availableRides', rideId);
  const driverRef = doc(db, 'drivers', driverId);
  
  try {
    // First, get the driver's information
    const [driverDoc, rideDoc] = await Promise.all([
      getDoc(driverRef),
      getDoc(rideRef)
    ]);
    
    if (!driverDoc.exists()) {
      throw new Error('Driver not found');
    }
    
    if (!rideDoc.exists()) {
      throw new Error('Ride not found');
    }
    
    const driverData = driverDoc.data();
    const rideData = rideDoc.data();
    
    // Validate required driver information
    if (!driverData.name || !driverData.phone) {
      throw new Error('Driver profile is incomplete. Please update your profile with name and phone number.');
    }
    
    // Run the transaction to update the ride status and remove from available rides
    await runTransaction(db, async (transaction) => {
      // Check if ride is still available
      const [rideDoc, availableRideDoc] = await Promise.all([
        transaction.get(rideRef),
        transaction.get(availableRideRef)
      ]);
      
      if (!rideDoc.exists() || !availableRideDoc.exists()) {
        throw new Error('Ride is no longer available');
      }
      
      const rideData = rideDoc.data();
      
      if (rideData.status !== 'pending') {
        throw new Error('Ride already taken');
      }
      
      // Check if the ride has expired
      if (rideData.expiresAt && new Date(rideData.expiresAt.toDate()) < new Date()) {
        // Update the status to expired if it's not already set
        if (rideData.status !== 'expired') {
          await transaction.update(rideRef, {
            status: 'expired',
            statusUpdatedAt: serverTimestamp(),
            cancellationReason: 'Ride expired before driver acceptance',
            updatedAt: serverTimestamp()
          });
        }
        throw new Error('This ride has expired. Please look for another ride.');
      }
      
      // Validate required driver and vehicle information
      const requiredFields = [
        'name', 'phone', 'vehicleModel', 'vehicleColor', 'vehicleNumber'
      ];
      
      const missingFields = requiredFields.filter(field => !driverData[field]);
      if (missingFields.length > 0) {
        throw new Error(`Please complete your profile with: ${missingFields.join(', ')}`);
      }
      
      // Update the ride with driver information
      const updateData = {
        status: 'accepted',
        driverId: driverId,
        driverName: driverData.name,
        driverPhone: driverData.phone,
        vehicleModel: driverData.vehicleModel,
        vehicleColor: driverData.vehicleColor,
        vehicleNumber: driverData.vehicleNumber,
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      // Update the ride document and remove from available rides
      transaction.update(rideRef, updateData);
      transaction.delete(availableRideRef);
      
      // Return the updated ride data for the confirmation
      return { ...rideData, ...updateData, id: rideDoc.id };
    });
    
    // After successful transaction, create mail document
    try {
      const mailCollection = collection(db, 'mail');
      const formattedPickupTime = new Date(updatedRide.pickupTime).toLocaleString();
      
      await addDoc(mailCollection, {
        to: updatedRide.customerEmail,
        message: {
          subject: 'Your Ride is Confirmed 🚖',
          text: `Hello ${updatedRide.customerName},

Your ride has been confirmed!

Pickup: ${updatedRide.pickup}
Drop: ${updatedRide.drop}
Pickup Time: ${formattedPickupTime}

Vehicle: ${updatedRide.vehicleModel} (${updatedRide.vehicleColor})
Vehicle Number: ${updatedRide.vehicleNumber}

Driver: ${updatedRide.driverName}
Contact: ${updatedRide.driverPhone}

Thank you for choosing us!`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; line-height: 1.6; color: #333;">
              <h1 style="color: #1a365d; text-align: center; margin-bottom: 20px;">Your Ride is Confirmed! 🚖</h1>
              
              <p>Hello ${updatedRide.customerName},</p>
              <p>Your ride has been confirmed!</p>
              
              <div style="background: #f8fafc; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0; border-radius: 0 4px 4px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Ride Details</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li><strong>Pickup:</strong> ${updatedRide.pickup}</li>
                  <li><strong>Drop:</strong> ${updatedRide.drop}</li>
                  <li><strong>Pickup Time:</strong> ${formattedPickupTime}</li>
                </ul>
                
                <h3 style="margin: 20px 0 10px 0; color: #1e40af;">Vehicle Details</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li><strong>Vehicle:</strong> ${updatedRide.vehicleModel} (${updatedRide.vehicleColor})</li>
                  <li><strong>Vehicle Number:</strong> ${updatedRide.vehicleNumber}</li>
                </ul>
                
                <h3 style="margin: 20px 0 10px 0; color: #1e40af;">Driver Details</h3>
                <ul style="padding-left: 20px; margin: 10px 0;">
                  <li><strong>Driver:</strong> ${updatedRide.driverName}</li>
                  <li><strong>Contact:</strong> ${updatedRide.driverPhone}</li>
                </ul>
              </div>
              
              <p style="margin-top: 20px; text-align: center; color: #4b5563;">
                Thank you for choosing us!
              </p>
              
              <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #6b7280;">
                <p>For any queries, please contact our support team.</p>
              </div>
            </div>
          `
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        metadata: {
          rideId: updatedRide.id,
          customerId: updatedRide.customerId || '',
          driverId: driverId
        }
      });
      
      console.log('Email sending is disabled');
    } catch (mailError) {
      console.log('Email sending is disabled');
      // Email sending is disabled, just log the info
    }
    
    return { success: true };
  } catch (error) {
    console.error('Transaction failed: ', error);
    return { 
      success: false, 
      message: error.message.includes('already taken') ? 'Ride already accepted by another driver' : 
              error.message.includes('not found') ? error.message :
              'Failed to accept ride. Please try again.'
    };
  }
};
