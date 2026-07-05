import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useUser } from '../context/UserContext';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const apiRequest = async (path, { method = 'GET', body } = {}, user) => {
  const idToken = user?.getIdToken ? await user.getIdToken() : null;
  const response = await fetch(`${BACKEND_BASE_URL}/api${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message || data?.error || 'Request failed');
  }

  return data;
};

const BookingPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  // Extract data from location state
  const transferDetails = state?.transferDetails;
  const vehicleDetails = state?.vehicleDetails;

  if (!transferDetails || !vehicleDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Booking</h1>
          <p>Please start your booking from the beginning.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-md hover:bg-orange-600"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  // This is where you confirm and save the booking
  const handleConfirmBooking = async () => {
    if (!user) {
      navigate('/login', { state: { from: '/booking' } });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiRequest('/airport-bookings', {
        method: 'POST',
        body: {
          transferDetails,
          vehicleDetails,
          userId: user.uid,
          bookingId: transferDetails.bookingId,
        },
      }, user);

      // Always put ALL details needed for later pages in bookingDetails:
      navigate('/find-driver', {
        state: {
          bookingId: response.bookingId,
          bookingType: 'airport',
          bookingDetails: {
            ...transferDetails,
            ...vehicleDetails,
            id: response.bookingId,
            status: response.status || 'searching_driver',
            vehicleDetails // Keep the nested object for easy reference in PaymentPage
          }
        }
      });
    } catch (error) {
      console.error('Error creating booking:', error);
      // Optionally show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Confirm Your Booking
        </h1>
        {/* Transfer Details Card */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Transfer Details</h2>
          </div>
          <div className="px-6 py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Pickup Location</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {transferDetails.pickup?.name || transferDetails.pickup?.address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transferDetails.pickup?.category}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Drop-off Location</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {transferDetails.dropoff?.name || transferDetails.dropoff?.address}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {transferDetails.dropoff?.category}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Date & Time</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {new Date(transferDetails.travelDate).toLocaleDateString()} at {transferDetails.hour}:{transferDetails.minute}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Passengers</h3>
                <p className="mt-1 text-sm text-gray-900">
                  {transferDetails.adults} Adult(s), {transferDetails.children} Child(ren)
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Vehicle Details Card */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Vehicle Details</h2>
          </div>
          <div className="px-6 py-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center">
              <div className="flex-shrink-0">
                <img
                  className="h-32 w-full object-cover sm:h-32 sm:w-48"
                  src={vehicleDetails.image || 'https://via.placeholder.com/200'}
                  alt={vehicleDetails.name}
                />
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-6">
                <h3 className="text-lg font-medium text-gray-900">{vehicleDetails.name}</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {vehicleDetails.description}
                </p>
                <div className="mt-2">
                  <span className="text-sm font-medium text-gray-900">
                    ₹{vehicleDetails.price}
                  </span>
                  <span className="text-sm text-gray-500 ml-2">for this trip</span>
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="flex items-center">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                    </svg>
                    {vehicleDetails.seats} Seats
                  </span>
                  <span className="flex items-center ml-4">
                    <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                      <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1v-1h.05a2.5 2.5 0 014.9 0h1.05a1 1 0 001-1v-2h1a1 1 0 00.894-1.447l-4-8A1 1 0 0014 3H4a1 1 0 00-.894.553l-4 8A1 1 0 001 10v1h1a1 1 0 001 1h.05a2.5 2.5 0 014.9 0H10v-1h.05a2.5 2.5 0 014.9 0H15v1a1 1 0 01-1 1h-1.05a2.5 2.5 0 00-4.9 0H5.05a2.5 2.5 0 01-4.9 0H3v-1h1a1 1 0 001-1v-1h1.05a2.5 2.5 0 014.9 0H10V9h-.05a2.5 2.5 0 01-4.9 0H3V5h10v1a1 1 0 001 1h1V5a1 1 0 00-1-1H4.5a.5.5 0 01-.447-.276L3 4z" />
                    </svg>
                    {vehicleDetails.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Total Price */}
        <div className="bg-white shadow overflow-hidden rounded-lg mb-8">
          <div className="px-6 py-5">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-medium text-gray-900">Total Amount</h2>
              <span className="text-2xl font-bold text-orange-600">
                ₹{vehicleDetails.price}
              </span>
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end space-y-4 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
          >
            Back
          </button>
          <button
            onClick={handleConfirmBooking}
            disabled={isLoading}
            className="px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-orange-500 hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Confirm & Find Driver'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
