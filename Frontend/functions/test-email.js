const credentials = require('./gmail-credentials');
const nodemailer = require('nodemailer');

// Create Nodemailer transporter with OAuth2
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    type: 'OAuth2',
    user: credentials.user,
    clientId: credentials.clientId,
    clientSecret: credentials.clientSecret,
    refreshToken: credentials.refreshToken
  }
});

// Email options
const mailOptions = {
  from: credentials.user,
  to: credentials.user, // Send to yourself for testing
  subject: 'Test Email from Firebase Functions',
  text: 'This is a test email sent from Firebase Functions using OAuth2.'
};

// Send email
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.messageId);
  }
});
