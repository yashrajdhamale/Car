// src/components/driver/MyRidesTab.jsx
// The entire "My Rides" tab content, extracted from DriverDashboard.
// Import this and drop it in where the myrides tab content was.

import AcceptedRideCard from './AcceptedRideCard';
import InterestedRoutesSection from '../../pages/driver/components/InterestedRoutesSection';

export default function MyRidesTab({
  acceptedRides,
  driverUid,
  driverName,
  driverLocation,
  customerPhones,
  fetchingPhones,
  onFetchPhone,
  onFetchAllPhones,
  onViewMap,
  onRideUpdated,
  cities,
}) {
  return (
    <div className="space-y-6">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6">

        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-green-800 flex items-center gap-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            My Accepted Rides ({acceptedRides.length})
          </h2>
          <button
            onClick={onFetchAllPhones}
            className="text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-2 rounded-lg flex items-center gap-1"
          >
            🔄 Fetch All Phones
          </button>
        </div>

        {/* Empty state */}
        {acceptedRides.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg">No accepted rides yet</p>
            <p className="text-sm">Accept a ride request to see it here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {acceptedRides.map((ride) => (
              <AcceptedRideCard
                key={ride.id}
                ride={ride}
                driverUid={driverUid}
                driverName={driverName}
                customerPhone={customerPhones[ride.id]}
                isFetchingPhone={!!fetchingPhones[ride.id]}
                onFetchPhone={onFetchPhone}
                onViewMap={onViewMap}
                onRideUpdated={onRideUpdated}
              />
            ))}
          </div>
        )}
      </div>

      <InterestedRoutesSection driverId={driverUid} cities={cities} />
    </div>
  );
}