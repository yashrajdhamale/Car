import { db } from '../config/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';

async function updateDriverStatus(driverId, status) {
  try {
    const driverRef = doc(db, 'drivers', driverId);
    await updateDoc(driverRef, {
      status: status,
      updatedAt: new Date().toISOString()
    });
    console.log(`Successfully updated driver ${driverId} status to ${status}`);
    
    // Verify the update
    const updatedDoc = await getDoc(driverRef);
    console.log('Updated driver document:', updatedDoc.data());
  } catch (error) {
    console.error('Error updating driver status:', error);
  }
}

// Update the specific driver's status
updateDriverStatus('a7hFsh0LoyNl7AnRVDCHDLAg2bV2', 'active');
