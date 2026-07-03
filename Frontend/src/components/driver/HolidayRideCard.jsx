import React, { useState } from 'react';
import { Calendar, MapPin, Users, Car, Clock, Info } from 'lucide-react';
import { acceptHolidayRide } from '../../utils/bookingUtils';
import { useAuth } from '../../contexts/AuthContext';

export default function HolidayRideCard({ ride, onAccept }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { currentUser } = useAuth();

  const handleAccept = async () => {
    if (!currentUser || !currentUser.vehicleDetails) {
      setError('Vehicle details not found. Please update your profile.');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await acceptHolidayRide(
        ride.id,
        currentUser.uid,
        currentUser.displayName || 'Driver',
        currentUser.vehicleDetails
      );
      onAccept(ride.id);
    } catch (err) {
      console.error('Error accepting ride:', err);
      setError('Failed to accept ride. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-gray-900">{ride.packageName}</h3>
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
            {ride.status}
          </span>
        </div>
        
        <div className="space-y-3 text-gray-700">
          <div className="flex items-center">
            <MapPin className="w-5 h-5 text-orange-500 mr-2" />
            <span>{ride.pickupLocation}</span>
          </div>
          
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-orange-500 mr-2" />
            <span>{new Date(ride.travelDate).toLocaleDateString()}</span>
          </div>
          
          <div className="flex items-center">
            <Users className="w-5 h-5 text-orange-500 mr-2" />
            <span>{ride.guests} {ride.guests > 1 ? 'Guests' : 'Guest'}</span>
          </div>
          
          <div className="flex items-center">
            <Car className="w-5 h-5 text-orange-500 mr-2" />
            <span>{ride.vehicleType || 'Any Vehicle'}</span>
          </div>
          
          {ride.specialRequests && (
            <div className="flex items-start">
              <Info className="w-5 h-5 text-orange-500 mr-2 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{ride.specialRequests}</span>
            </div>
          )}
        </div>
        
        <div className="mt-6 flex justify-between items-center">
          <div className="text-2xl font-bold text-gray-900">
            ₹{ride.totalAmount}
            <span className="text-sm font-normal text-gray-500 ml-1">total</span>
          </div>
          
          <button
            onClick={handleAccept}
            disabled={isLoading}
            className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white font-medium rounded-lg hover:from-orange-600 hover:to-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-300 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Accepting...' : 'Accept Ride'}
          </button>
        </div>
        
        {error && (
          <div className="mt-4 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
