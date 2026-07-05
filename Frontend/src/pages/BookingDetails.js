import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

const BookingDetails = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBooking = async () => {
      if (!user) {
        navigate('/login');
        return;
      }
      if (!state?.bookingId) {
        toast.error('No booking ID provided');
        navigate('/user-dashboard');
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/api/airport-bookings/${state.bookingId}`);
        if (!response.ok) throw new Error('Booking not found');
        const payload = await response.json();
        const bookingData = payload.booking;
        setBooking({
          id: bookingData.id,
          ...bookingData,
          pickup: bookingData.pickupLocation?.name || bookingData.pickupLocation?.address || bookingData.pickupLocation || 'Pune',
          dropoff: bookingData.dropoffLocation?.name || bookingData.dropoffLocation?.address || bookingData.dropoffLocation || 'Navi Mumbai',
          fare: bookingData.vehiclePrice || bookingData.price || bookingData.fareAmount || bookingData.totalFare || 0,
          paymentStatus: bookingData.paymentStatus || 'pending',
        });
      } catch (error) {
        toast.error('Failed to load booking');
        navigate('/user-dashboard');
      } finally {
        setLoading(false);
      }
    };
    loadBooking();
  }, [navigate, state?.bookingId, user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading booking details...</div>;
  if (!booking) return <div className="min-h-screen flex items-center justify-center">Booking not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold">Booking Details</h1>
        <p>Status: {booking.status}</p>
        <p>Pickup: {booking.pickup}</p>
        <p>Dropoff: {booking.dropoff}</p>
        <p>Fare: ₹{booking.fare}</p>
      </div>
    </div>
  );
};

export default BookingDetails;
