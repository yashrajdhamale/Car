const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

exports.updateDriverStatus = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to update driver status.'
    );
  }

  const { driverId, status } = data;

  try {
    // Update the driver's status
    await admin.firestore().collection('drivers').doc(driverId).update({
      status: status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, message: `Driver status updated to ${status}` };
  } catch (error) {
    console.error('Error updating driver status:', error);
    throw new functions.https.HttpsError(
      'internal',
      'Failed to update driver status',
      error.message
    );
  }
});
