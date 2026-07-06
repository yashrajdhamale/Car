import React, { useState } from 'react';
import { Button, Input, Typography, Card, CardBody } from "@material-tailwind/react";

export const TestEmail = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const sendTestEmail = async () => {
    if (!email) {
      setMessage({ text: 'Please enter an email address', type: 'error' });
      return;
    }

    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: email,
          subject: 'Test Booking Confirmation',
          template: 'holidayBookingConfirmation',
          data: {
            customerName: 'Test User',
            bookingDetails: {
              bookingId: 'TEST-123',
              packageName: 'Test Package',
              travelDate: '2025-12-15',
              totalAmount: '9999'
            }
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send test email');
      }

      setMessage({ 
        text: 'Test email sent successfully! Please check your inbox (and spam folder).', 
        type: 'success' 
      });
    } catch (error) {
      console.error('Test email error:', error);
      setMessage({ 
        text: error.message || 'Failed to send test email. Please check the console for details.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardBody className="flex flex-col gap-4">
          <Typography variant="h4" color="blue-gray" className="mb-2">
            Test Email Functionality
          </Typography>
          
          <Typography color="gray" className="mb-4">
            Enter your email to test the booking confirmation email functionality.
          </Typography>

          <div className="mb-4">
            <Input
              type="email"
              label="Your Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {message.text && (
            <div 
              className={`p-3 rounded-md ${
                message.type === 'error' 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button 
            onClick={sendTestEmail}
            disabled={loading}
            color="blue"
            className="mt-2"
          >
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>

          <Typography variant="small" color="gray" className="mt-4 text-center">
            Note: This will send a test booking confirmation email to the specified address.
          </Typography>
        </CardBody>
      </Card>
    </div>
  );
};

export default TestEmail;
