const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const serviceAccount = require('../serviceAccountKey.json');

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

async function updateDriverStatus(driverId, status) {
  try {
    const driverRef = db.collection('drivers').doc(driverId);
    await driverRef.update({
      status: status,
      updatedAt: new Date().toISOString()
    });
    console.log(`Successfully updated driver ${driverId} status to ${status}`);
  } catch (error) {
    console.error('Error updating driver status:', error);
  }
}

// Update the specific driver's status
updateDriverStatus('a7hFsh0LoyNl7AnRVDCHDLAg2bV2', 'active');
