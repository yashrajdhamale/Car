import React from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';

const UpcomingTrips = () => {
  const navigate = useNavigate();
  
  // This would normally come from an API
  const upcomingTrips = [
    { 
      id: 1, 
      from: 'Airport', 
      to: 'Downtown Hotel', 
      date: '2023-06-20',
      time: '10:00 AM',
      passenger: 'John Doe',
      status: 'confirmed'
    },
    { 
      id: 2, 
      from: 'Train Station', 
      to: 'Beach Resort', 
      date: '2023-06-22',
      time: '2:30 PM',
      passenger: 'Jane Smith',
      status: 'confirmed'
    },
  ];

  return (
    <DriverLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Upcoming Trips</h1>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {upcomingTrips.map((trip) => (
            <div key={trip.id} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">{trip.from} to {trip.to}</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {trip.date} at {trip.time}
                    </p>
                    <p className="mt-2 text-sm text-gray-600">Passenger: {trip.passenger}</p>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {trip.status}
                  </span>
                </div>
                <div className="mt-4 flex space-x-3">
                  <button
                    onClick={() => navigate(`/driver/trips/${trip.id}`)}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    View Details
                  </button>
                  <button className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                    Contact Passenger
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DriverLayout>
  );
};

export default UpcomingTrips;
