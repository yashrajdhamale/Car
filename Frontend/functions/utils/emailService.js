// functions/utils/emailService.js
require('dotenv').config();
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const fs = require('fs').promises;
const path = require('path');

// Load email configuration from environment variables
const emailConfig = {
  user: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASSWORD,
  from: process.env.EMAIL_FROM,
  adminEmail: process.env.ADMIN_EMAIL,
  service: 'gmail',
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
};

// Validate required environment variables
const requiredVars = ['EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM', 'ADMIN_EMAIL'];
const missingVars = requiredVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all required variables are set.');
}

console.log('Email service initialized (sending disabled)');

// Email sending is disabled
const sendBookingConfirmation = async (to, bookingDetails) => {
  console.log('ℹ️ Email sending is disabled. Would have sent booking confirmation to:', to);
  console.log('Booking details:', bookingDetails);
  return { success: true, messageId: 'email_disabled' };
};

// Admin notification is disabled
const sendAdminNotification = async (bookingDetails) => {
  console.log('ℹ️ Admin notification is disabled. Would have sent notification for booking:', 
    bookingDetails?.bookingId || 'unknown');
  return { success: true, messageId: 'notification_disabled' };
};

// Test email function is disabled
const testEmail = async (to) => {
  console.log('ℹ️ Test email is disabled. Would have sent to:', to);
  return { success: true, message: 'Test email is disabled' };
};

// Initialize transporter (no-op)
const initializeTransporter = () => ({
  verify: (callback) => callback(null, { success: true, message: 'Email sending is disabled' })
});

module.exports = {
  sendBookingConfirmation,
  sendAdminNotification,
  testEmail,
  initializeTransporter
};
