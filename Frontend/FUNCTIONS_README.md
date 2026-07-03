# Email Notification Setup Guide

This guide will help you set up the email notification system for the booking form.

## Prerequisites

1. Node.js 18 or higher
2. Firebase CLI (`npm install -g firebase-tools`)
3. A Firebase project with Blaze plan (or higher) for Cloud Functions
4. A Gmail account (for sending emails)

## Setup Instructions

### 1. Initialize Firebase in your project

```bash
# Login to Firebase
firebase login

# Initialize Firebase in your project directory
firebase init functions

# Select your Firebase project when prompted
# Choose JavaScript as the language
# Set up ESLint (recommended)
# Install dependencies with npm (select Yes)
```

### 2. Configure Gmail credentials

1. Go to your Google Account settings: https://myaccount.google.com/
2. Navigate to "Security"
3. Enable "2-Step Verification" if not already enabled
4. Go to "App passwords"
5. Generate a new app password for your application
6. Set the Gmail credentials in Firebase Functions config:

```bash
firebase functions:config:set gmail.email="your-email@gmail.com" gmail.password="your-app-specific-password"
```

### 3. Update the BookingPage component

In `src/components/BookingPage.jsx`, update the `functionUrl` in the `handleSubmit` function with your actual Firebase project ID:

```javascript
const functionUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:5001/YOUR_PROJECT_ID/us-central1/sendBookingConfirmation'
  : 'https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendBookingConfirmation';
```

### 4. Deploy the Cloud Function

```bash
# Install dependencies
cd functions
npm install
cd ..

# Deploy the function
firebase deploy --only functions
```

### 5. Test the Function

1. Fill out the booking form and submit
2. Check the email address you provided in the form
3. You should receive a confirmation email with the booking details

## Local Development

To test the function locally:

```bash
# Start the Firebase emulator
firebase emulators:start

# In a separate terminal, start your React app
npm run dev
```

## Troubleshooting

1. **Emails not sending**
   - Check the Firebase Functions logs: `firebase functions:log`
   - Verify your Gmail credentials are correctly set in the Firebase config
   - Ensure you're using an App Password, not your regular Gmail password

2. **CORS errors**
   - Make sure the function URL in your frontend code matches the deployed function URL
   - Check that the request method is POST

3. **Firestore permissions**
   - Ensure your Firestore rules allow write access to the 'bookings' collection

## Security Notes

1. Never commit your Gmail password to version control
2. Use environment variables for sensitive information
3. Consider using a dedicated email service like SendGrid for production use
