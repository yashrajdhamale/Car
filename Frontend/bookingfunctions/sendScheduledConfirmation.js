// sendScheduledConfirmation.js (Cloud Function)
const functions = require('firebase-functions');
const nodemailer = require('nodemailer');
const admin = require('firebase-admin');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password
  }
});

exports.sendScheduledConfirmation = functions.https.onRequest(async (req, res) => {
  // Enable CORS
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    const {
      to,
      customerName,
      bookingId,
      pickupLocation,
      dropoffLocation,
      travelDate,
      pickupTime,
      driverName,
      driverPhone,
      vehicleDetails,
      vehicleNumber,
      confirmationLink
    } = req.body;

    const mailOptions = {
      from: '"Carzi Holidays" <noreply@carziholidays.com>',
      to: to,
      subject: `Scheduled Ride Confirmation - ${bookingId}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .section { margin-bottom: 25px; padding: 20px; background: white; border-radius: 8px; border-left: 4px solid #4F46E5; }
            .button { display: inline-block; padding: 12px 24px; background: #4F46E5; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; }
            .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #666; }
            .driver-card { background: #E0E7FF; padding: 15px; border-radius: 8px; margin: 15px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎉 Scheduled Ride Confirmed!</h1>
            </div>
            
            <div class="content">
              <div class="section">
                <h2>Hello ${customerName},</h2>
                <p>Your scheduled ride has been confirmed! A driver has been assigned for your trip.</p>
              </div>
              
              <div class="section">
                <h3>🔑 Booking Details</h3>
                <div class="info-row">
                  <span class="info-label">Booking ID:</span>
                  <span>${bookingId}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Pickup:</span>
                  <span>${pickupLocation}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Destination:</span>
                  <span>${dropoffLocation}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Date:</span>
                  <span>${new Date(travelDate).toLocaleDateString()}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Pickup Time:</span>
                  <span>${pickupTime}</span>
                </div>
              </div>
              
              <div class="section">
                <h3>👨‍✈️ Driver Details</h3>
                <div class="driver-card">
                  <div class="info-row">
                    <span class="info-label">Driver Name:</span>
                    <span>${driverName}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Contact Number:</span>
                    <span>${driverPhone}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Vehicle:</span>
                    <span>${vehicleDetails}</span>
                  </div>
                  <div class="info-row">
                    <span class="info-label">Vehicle Number:</span>
                    <span>${vehicleNumber}</span>
                  </div>
                </div>
                <p><strong>Note:</strong> Your driver will contact you before the scheduled pickup time.</p>
              </div>
              
              <div class="section">
                <h3>💳 Payment & Confirmation</h3>
                <p>Please complete your payment to finalize the booking:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <a href="${confirmationLink}" class="button">
                    Complete Payment & Review Terms
                  </a>
                </div>
                <p style="font-size: 14px; color: #666;">
                  After payment, you'll receive a detailed invoice and confirmation.
                </p>
              </div>
              
              <div class="section">
                <h3>📋 Important Information</h3>
                <ul>
                  <li>Arrive at pickup point 10 minutes before scheduled time</li>
                  <li>Keep your booking ID for reference</li>
                  <li>Driver may call to confirm details</li>
                  <li>Review cancellation policy before payment</li>
                </ul>
              </div>
              
              <div class="footer">
                <p>Thank you for choosing Carzi Holidays!</p>
                <p>For support, contact: support@carziholidays.com | +91 1234567890</p>
                <p>© ${new Date().getFullYear()} Carzi Holidays. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.status(200).json({ success: true, message: 'Confirmation email sent' });
    
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});