import React from 'react';
import { useNavigate } from 'react-router-dom';
import DriverLayout from '../../components/driver/DriverLayout';

const RideRequests = () => {
  const navigate = useNavigate();
  
  // This would normally come from an API
  const rideRequests = [
    { id: 1, from: 'Airport', to: 'Downtown', time: '10:00 AM', date: '2023-06-15', status: 'pending' },
    { id: 2, from: 'Train Station', to: 'Beach Resort', time: '2:30 PM', date: '2023-06-15', status: 'pending' },
  ];

  return (
    <DriverLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Ride Requests</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">From</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rideRequests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.from}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.to}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.date} at {request.time}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                        {request.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/driver/requests/${request.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        View
                      </button>
                      <button className="text-green-600 hover:text-green-900">Accept</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default RideRequests;
