import { httpsCallable } from 'firebase/functions';
import { functions } from '../config/firebase';

export const sendEmail = async (emailData) => {
  try {
    const sendEmailFunction = httpsCallable(functions, 'sendEmail');
    await sendEmailFunction(emailData);
    return { success: true };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

export const sendHolidayBookingConfirmation = async ({ to, customerName, bookingDetails }) => {
  const emailData = {
    to,
    subject: `Booking Confirmation #${bookingDetails.bookingId}`,
    template: 'holidayBookingConfirmation',
    data: {
      customerName,
      bookingDetails,
      bookingId: bookingDetails.bookingId,
      packageName: bookingDetails.packageName,
      travelDate: bookingDetails.travelDate,
      totalAmount: bookingDetails.totalAmount,
      status: 'Confirmed'
    }
  };

  return sendEmail(emailData);
};

export const sendDriverAssignedEmail = async ({ 
  to, 
  customerName, 
  driverName, 
  vehicleDetails,
  bookingDetails,
  bookingId
}) => {
  const emailData = {
    to,
    subject: `Driver Assigned for Your Booking #${bookingId}`,
    template: 'driverAssigned',
    data: {
      customerName,
      driverName,
      vehicleDetails,
      bookingDetails: {
        ...bookingDetails,
        bookingId,
        packageName: bookingDetails.packageName || 'Holiday Package',
        travelDate: bookingDetails.travelDate || bookingDetails.date,
        pickupLocation: bookingDetails.pickupLocation || 'As per booking',
        contactNumber: bookingDetails.contactNumber || 'N/A'
      }
    }
  };

  return sendEmail(emailData);
};
