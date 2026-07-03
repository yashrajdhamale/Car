import React from 'react';
import { CheckCircle, Clock, User, Car, Phone, MapPin, Calendar, AlertCircle } from 'lucide-react';
import { getBookingStatus } from '../utils/bookingUtils';

export default function BookingStatusCard({ booking }) {
  const statusInfo = getBookingStatus(booking.status);
  
  const renderStatusContent = () => {
    switch(booking.status) {
      case 'pending':
        return (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-yellow-500" />
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
                  <CheckCircle className="h-5 w-5 text-green-500" />
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
            
            <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
              <div className="px-4 py-5 sm:px-6 bg-gray-50">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  Your Driver Details
                </h3>
              </div>
              <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                  <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt className="text-sm font-medium text-gray-500 flex items-center">
                      <User className="mr-2 h-4 w-4 text-gray-400" />
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
                          <Car className="mr-2 h-4 w-4 text-gray-400" />
                          Vehicle
                        </dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                          {booking.vehicleDetails.make} {booking.vehicleDetails.model} ({booking.vehicleDetails.year})
                        </dd>
                      </div>
                      <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500 flex items-center">
                          <Car className="mr-2 h-4 w-4 text-gray-400" />
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
                        <Phone className="mr-2 h-4 w-4 text-gray-400" />
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
        
      case 'in_progress':
        return (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <Clock className="h-5 w-5 text-blue-500" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-blue-800">
                  Your trip is in progress
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  Your driver {booking.driverName} is on the way or currently driving you to your destination.
                </p>
              </div>
            </div>
          </div>
        );
        
      case 'completed':
        return (
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <CheckCircle className="h-5 w-5 text-green-500" />
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
                <AlertCircle className="h-5 w-5 text-red-500" />
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
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gray-50">
        <div>
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Booking Status
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Details about your holiday package booking
          </p>
        </div>
        <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium ${statusInfo.color} text-white`}>
          {statusInfo.text}
        </span>
      </div>
      
      <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
        <dl className="sm:divide-y sm:divide-gray-200">
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <Calendar className="mr-2 h-4 w-4 text-gray-400" />
              Travel Date
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {new Date(booking.travelDate).toLocaleDateString()}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500 flex items-center">
              <MapPin className="mr-2 h-4 w-4 text-gray-400" />
              Pickup Location
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {booking.pickupLocation || 'To be confirmed'}
            </dd>
          </div>
          
          <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
            <dt className="text-sm font-medium text-gray-500">
              Package
            </dt>
            <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
              {booking.packageName}
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
      </div>
      
      <div className="px-4 py-4 sm:px-6">
        {renderStatusContent()}
      </div>
    </div>
  );
}
