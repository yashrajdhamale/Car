import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@material-tailwind/react";
import { 
  CheckCircleIcon, 
  ClockIcon, 
  UserIcon, 
  PhoneIcon, 
  MapPinIcon, 
  TruckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { getBookingStatus } from '../utils/bookingUtils';

const BookingConfirmation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [booking, setBooking] = useState(location.state?.booking || null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Set up real-time listener for booking updates
  useEffect(() => {
    if (!booking?.id) {
      setLoading(false);
      return;
    }

    const bookingRef = doc(db, 'holidayBookings', booking.id);
    const unsubscribe = onSnapshot(bookingRef, 
      (doc) => {
        if (doc.exists()) {
          setBooking({ id: doc.id, ...doc.data() });
        } else {
          setError('Booking not found');
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching booking:', error);
        setError('Failed to load booking details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [booking?.id]);

  const statusInfo = booking ? getBookingStatus(booking.status) : null;

  const renderStatusContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
        </div>
      );
    }

    if (error || !booking) {
      return (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                {error || 'No booking information found. Please check your email for confirmation details.'}
              </p>
            </div>
          </div>
        </div>
      );
    }

    switch(booking.status) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ClockIcon className="h-5 w-5 text-yellow-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your booking is being processed. We'll notify you once a driver is assigned.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'driver_accepted':
        return (
          <>
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Driver Assigned!
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    {booking.driverName} will be your driver for this trip.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6 border border-gray-200">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Driver Details
                </h3>
              </div>
              <div className="px-4 py-5 sm:p-0">
                <dl className="divide-y divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <UserIcon className="mr-2 h-5 w-5 text-gray-400" />
                      Driver
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.driverName}
                    </dd>
                  </div>
                  
                  {booking.vehicleDetails && (
                    <>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <TruckIcon className="mr-2 h-5 w-5 text-gray-400" />
                          Vehicle
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {booking.vehicleDetails.make} {booking.vehicleDetails.model} ({booking.vehicleDetails.year})
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <TruckIcon className="mr-2 h-5 w-5 text-gray-400" />
                          Vehicle Number
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {booking.vehicleDetails.registrationNumber}
                        </dd>
                      </div>
                    </>
                  )}
                  
                  {booking.driverPhone && (
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                      <dt className="text-sm font-medium text-gray-500 flex items-center">
                        <PhoneIcon className="mr-2 h-5 w-5 text-gray-400" />
                        Contact
                      </dt>
                      <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                        <a href={`tel:${booking.driverPhone}`} className="text-blue-600 hover:text-blue-800">
                          {booking.driverPhone}
                        </a>
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </>
        );
        
      case 'completed':
        return (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">
                  Trip Completed
                </p>
                <p className="text-sm text-green-700 mt-1">
                  We hope you had a great trip with {booking.driverName}!
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'cancelled':
        return (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  Booking Cancelled
                </p>
                <p className="text-sm text-red-700 mt-1">
                  This booking has been cancelled. Please contact support if you need any assistance.
                </p>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
          <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gradient-to-r from-orange-500 to-orange-600">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {booking ? 'Your Booking Details' : 'Booking Confirmation'}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-orange-100">
                {booking?.status === 'pending' 
                  ? 'We\'re processing your booking' 
                  : 'Your holiday package details'}
              </p>
            </div>
            {statusInfo && (
              <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${statusInfo.color} bg-white text-${statusInfo.color.split('-')[1]}-800`}>
                {statusInfo.text}
              </span>
            )}
          </div>
          
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            {!loading && booking && (
              <dl className="divide-y divide-gray-200">
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <MapPinIcon className="mr-2 h-5 w-5 text-gray-400" />
                    Package
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-medium sm:mt-0 sm:col-span-2">
                    {booking.packageName}
                  </dd>
                </div>
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500 flex items-center">
                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                    Travel Date
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(booking.travelDate).toLocaleDateString('en-IN', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </dd>
                </div>
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Booking Reference
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono sm:mt-0 sm:col-span-2">
                    {booking.id}
                  </dd>
                </div>
                
                <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">
                    Guests
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {booking.guests} {booking.guests > 1 ? 'people' : 'person'}
                  </dd>
                </div>
                
                {booking.specialRequests && (
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500">
                      Special Requests
                    </dt>
                    <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                      {booking.specialRequests}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
          
          <div className="px-4 py-4 sm:px-6">
            {renderStatusContent()}
          </div>
        </div>
        
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Need help with your booking?</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Our customer support team is here to help you with any questions or changes to your booking.
            </p>
          </div>
          <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
            <dl className="sm:divide-y sm:divide-gray-200">
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Email support
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a href="mailto:support@carziholidays.com" className="text-orange-600 hover:text-orange-800">
support@carziholidays.com
                  </a>
                </dd>
              </div>
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">
                  Phone support
                </dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                  <a href="tel:+911234567890" className="text-orange-600 hover:text-orange-800">
                    +91 12345 67890
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <Button
            color="orange"
            size="lg"
            className="px-8 py-3 text-base font-medium"
            onClick={() => navigate('/')}
          >
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BookingConfirmation;
