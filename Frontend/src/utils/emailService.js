const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

const sendEmailRequest = async (emailData) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(emailData || {}),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || data.message || "Failed to send email");
    error.data = data;
    throw error;
  }

  return data;
};

export const sendEmail = async (emailData) => {
  return sendEmailRequest(emailData);
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
