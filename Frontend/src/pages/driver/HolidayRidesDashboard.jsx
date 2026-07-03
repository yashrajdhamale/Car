import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, serverTimestamp, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import HolidayRideCard from '../../components/driver/HolidayRideCard';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HolidayRidesDashboard = () => {
  const { currentUser, userData } = useAuth();
  const [availableRides, setAvailableRides] = useState([]);
  const [acceptedRides, setAcceptedRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  // Fetch available holiday rides
  useEffect(() => {
    if (!currentUser?.uid) return;

    setLoading(true);
    
    // Query for available holiday rides (status: pending or searching_driver)
    const ridesQuery = query(
      collection(db, 'holidayBookings'),
      where('status', 'in', ['pending', 'searching_driver']),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(ridesQuery, 
      (snapshot) => {
        const rides = [];
        snapshot.forEach((doc) => {
          rides.push({ id: doc.id, ...doc.data() });
        });
        setAvailableRides(rides);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching holiday rides:', error);
        toast.error('Failed to load available rides');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Fetch driver's accepted rides
  useEffect(() => {
    if (!currentUser?.uid) return;

    const acceptedQuery = query(
      collection(db, 'holidayBookings'),
      where('driverId', '==', currentUser.uid),
      where('status', 'in', ['driver_accepted', 'in_progress']),
      orderBy('travelDate', 'asc')
    );

    const unsubscribe = onSnapshot(acceptedQuery, 
      (snapshot) => {
        const rides = [];
        snapshot.forEach((doc) => {
          rides.push({ id: doc.id, ...doc.data() });
        });
        setAcceptedRides(rides);
      },
      (error) => {
        console.error('Error fetching accepted rides:', error);
        toast.error('Failed to load your rides');
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  const handleAcceptRide = useCallback(async (rideId) => {
    if (!currentUser?.uid || !userData) {
      toast.error('Please log in to accept rides');
      return;
    }

    try {
      const rideRef = doc(db, 'holidayBookings', rideId);
      await updateDoc(rideRef, {
        status: 'driver_accepted',
        driverId: currentUser.uid,
        driverName: userData.fullName || userData.displayName || 'Driver',
        driverPhone: userData.phoneNumber || '',
        vehicleDetails: userData.vehicleDetails || {
          make: 'N/A',
          model: 'N/A',
          year: 'N/A',
          registrationNumber: 'N/A'
        },
        acceptedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      toast.success('Ride accepted successfully!');
    } catch (error) {
      console.error('Error accepting ride:', error);
      toast.error('Failed to accept ride. Please try again.');
    }
  }, [currentUser, userData]);

  const handleStartRide = async (rideId) => {
    try {
      const rideRef = doc(db, 'holidayBookings', rideId);
      await updateDoc(rideRef, {
        status: 'in_progress',
        startedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Ride started!');
    } catch (error) {
      console.error('Error starting ride:', error);
      toast.error('Failed to start ride. Please try again.');
    }
  };

  const handleCompleteRide = async (rideId) => {
    try {
      const rideRef = doc(db, 'holidayBookings', rideId);
      await updateDoc(rideRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.success('Ride completed successfully!');
    } catch (error) {
      console.error('Error completing ride:', error);
      toast.error('Failed to complete ride. Please try again.');
    }
  };

  const handleCancelRide = async (rideId) => {
    if (!window.confirm('Are you sure you want to cancel this ride? This action cannot be undone.')) {
      return;
    }

    try {
      const rideRef = doc(db, 'holidayBookings', rideId);
      await updateDoc(rideRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      toast.info('Ride cancelled');
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Holiday Rides Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            {activeTab === 'available' 
              ? 'Available holiday package rides in your area'
              : 'Your accepted holiday package rides'}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('available')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'available'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Available Rides
              <span className="ml-2 bg-gray-100 text-gray-900 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {availableRides.length}
              </span>
            </button>
            <button
              onClick={() => setActiveTab('accepted')}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'accepted'
                  ? 'border-orange-500 text-orange-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Rides
              <span className="ml-2 bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {acceptedRides.length}
              </span>
            </button>
          </nav>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        ) : activeTab === 'available' ? (
          <div className="space-y-6">
            {availableRides.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {availableRides.map((ride) => (
                  <HolidayRideCard
                    key={ride.id}
                    ride={ride}
                    onAccept={() => handleAcceptRide(ride.id)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No rides available</h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are currently no holiday package rides available in your area.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {acceptedRides.length > 0 ? (
              <div className="space-y-4">
                {acceptedRides.map((ride) => (
                  <div key={ride.id} className="bg-white shadow overflow-hidden rounded-lg">
                    <div className="px-4 py-5 sm:px-6 flex justify-between items-center bg-gradient-to-r from-orange-50 to-orange-100">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{ride.packageName}</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          {new Date(ride.travelDate).toLocaleDateString('en-IN', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-orange-100 text-orange-800">
                        {ride.status === 'driver_accepted' ? 'Assigned' : 'In Progress'}
                      </span>
                    </div>
                    <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Customer</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {ride.customerName || 'N/A'}
                          </p>
                          {ride.customerPhone && (
                            <a
                              href={`tel:${ride.customerPhone}`}
                              className="mt-2 inline-flex items-center text-sm text-orange-600 hover:text-orange-800"
                            >
                              <svg
                                className="h-5 w-5 mr-1"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                />
                              </svg>
                              {ride.customerPhone}
                            </a>
                          )}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Pickup Location</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {ride.pickupLocation || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Guests</h4>
                          <p className="mt-1 text-sm text-gray-900">
                            {ride.guests || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Total Amount</h4>
                          <p className="mt-1 text-sm text-gray-900 font-medium">
                            ₹{ride.totalAmount?.toLocaleString() || 'N/A'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-6 flex space-x-3">
                        {ride.status === 'driver_accepted' && (
                          <button
                            type="button"
                            onClick={() => handleStartRide(ride.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                          >
                            <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Start Ride
                          </button>
                        )}
                        
                        {ride.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={() => handleCompleteRide(ride.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                          >
                            <svg
                              className="-ml-1 mr-2 h-5 w-5"
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                            Complete Ride
                          </button>
                        )}
                        
                        <button
                          type="button"
                          onClick={() => handleCancelRide(ride.id)}
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <svg
                            className="-ml-1 mr-2 h-5 w-5 text-gray-500"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                            aria-hidden="true"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Cancel Ride
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-gray-900">No accepted rides</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You haven't accepted any holiday package rides yet.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={() => setActiveTab('available')}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    View Available Rides
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayRidesDashboard;
