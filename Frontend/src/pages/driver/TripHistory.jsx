import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';

const TripHistory = () => {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState('month');
  
  // This would normally come from an API
  const tripHistory = [
    { 
      id: 1, 
      date: '2023-05-15',
      from: 'Airport', 
      to: 'Downtown Hotel',
      fare: 45.50,
      status: 'completed',
      rating: 5
    },
    { 
      id: 2, 
      date: '2023-05-10',
      from: 'Train Station', 
      to: 'Beach Resort',
      fare: 35.00,
      status: 'completed',
      rating: 4
    },
    { 
      id: 3, 
      date: '2023-05-01',
      from: 'City Center', 
      to: 'Airport',
      fare: 40.00,
      status: 'completed',
      rating: 5
    },
  ];

  const totalEarnings = tripHistory.reduce((sum, trip) => sum + trip.fare, 0);
  const totalTrips = tripHistory.length;
  const averageRating = (tripHistory.reduce((sum, trip) => sum + trip.rating, 0) / totalTrips).toFixed(1);

  return (
    <DriverLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Trip History</h1>
          <div className="flex space-x-2">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Earnings</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">${totalEarnings.toFixed(2)}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Total Trips</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">{totalTrips}</dd>
            </div>
          </div>
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <dt className="text-sm font-medium text-gray-500 truncate">Average Rating</dt>
              <dd className="mt-1 text-3xl font-semibold text-gray-900">
                {averageRating} <span className="text-yellow-400">★</span>
              </dd>
            </div>
          </div>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {tripHistory.map((trip) => (
              <li key={trip.id}>
                <div className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-600 truncate">
                      {trip.from} to {trip.to}
                    </p>
                    <div className="ml-2 flex-shrink-0 flex">
                      <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {trip.status}
                      </p>
                    </div>
                  </div>
                  <div className="mt-2 sm:flex sm:justify-between">
                    <div className="sm:flex">
                      <p className="flex items-center text-sm text-gray-500">
                        {trip.date}
                      </p>
                      <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                        Rating: {Array(trip.rating).fill('★').join('')}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                      <p>${trip.fare.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DriverLayout>
  );
};

export default TripHistory;
