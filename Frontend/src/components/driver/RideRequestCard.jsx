import { useState } from 'react';
import { 
  FaCheck, 
  FaTimes, 
  FaSpinner, 
  FaMapMarkerAlt, 
  FaCalendarAlt, 
  FaCar, 
  FaRupeeSign,
  FaRoad,
  FaUser,
  FaPhone,
  FaCarAlt,
  FaInfoCircle
} from 'react-icons/fa';

export default function RideRequestCard({ request, onAccept, onReject }) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState(null);
  
  if (!request) return null;

  const isAccepted = request.status === 'accepted';
  
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      const date = dateString.toDate ? dateString.toDate() : new Date(dateString);
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return dateString;
    }
  };

  // Format fare to 2 decimal places
  const formatFare = (fare) => {
    if (fare === undefined || fare === null) return 'N/A';
    const num = parseFloat(fare);
    return `₹${num.toFixed(2)}`;
  };

  const renderInfoRow = (icon, label, value, className = '') => {
    // Safely convert value to string, handling objects and null/undefined
    const renderValue = (val) => {
      if (val === null || val === undefined) return 'N/A';
      if (typeof val === 'object') {
        // If it's an object with a toString method, use that
        if (typeof val.toString === 'function' && val.toString !== Object.prototype.toString) {
          return val.toString();
        }
        // Otherwise show a placeholder indicating the type of object
        return `[${Object.keys(val).join(', ')}]`;
      }
      return val;
    };

    return (
      <div className={`flex items-center text-base ${className}`}>
        <span className="text-indigo-500 w-6 flex-shrink-0">{icon}</span>
        <div className="flex-1 flex items-center">
          <span className="text-gray-600 mr-2 font-medium">{label}:</span>
          <span className="text-gray-900 truncate font-medium">
            {renderValue(value) || 'N/A'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden border-l-4 border-indigo-500">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-bold text-gray-800"> OUTSTATION RIDE REQUEST</h2>
          <span className={`px-2.5 py-1 rounded-full text-sm font-semibold ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'accepted' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {request.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>

        <div className="space-y-3">
          {renderInfoRow(
            <FaMapMarkerAlt className="text-green-500 text-lg" />, 
            'From',
            request.pickupSublocalityAddress || request.pickupLocation || request.from || 'N/A'
          )}
          
          {renderInfoRow(
            <FaMapMarkerAlt className="text-red-500 text-lg" />, 
            'To',
            request.destinationSublocalityAddress || request.dropoffLocation || request.to || 'N/A'
          )}

          <div className="grid grid-cols-2 gap-3">
            {renderInfoRow(
              <FaCalendarAlt className="text-blue-500 text-lg" />, 
              'Date', 
              request.date || formatDate(request.createdAt),
              'col-span-1'
            )}
            
            {renderInfoRow(
              <FaCar className="text-purple-500 text-lg" />, 
              'Vehicle', 
              request.carName || (request.vehicle?.name || 'N/A'),
              'col-span-1'
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {renderInfoRow(
              <FaRupeeSign className="text-green-600 text-lg" />, 
              'Fare', 
              formatFare(request.fare),
              'col-span-1'
            )}
            
            {request.distance && renderInfoRow(
              <FaRoad className="text-blue-400 text-lg" />, 
              'Distance', 
              `${request.distance} km`,
              'col-span-1'
            )}
          </div>
        </div>

        {request.status === 'pending' && (
          <div className="flex justify-between mt-5 space-x-3">
            <button
              onClick={async () => {
                setIsProcessing(true);
                setAction('reject');
                try {
                  await onReject();
                } finally {
                  setIsProcessing(false);
                  setAction(null);
                }
              }}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-3 text-base font-medium text-white rounded-md transition-all ${
                isProcessing && action === 'reject'
                  ? 'bg-red-400'
                  : 'bg-red-500 hover:bg-red-600 active:scale-95'
              }`}
            >
              {isProcessing && action === 'reject' ? (
                <FaSpinner className="animate-spin mx-auto" />
              ) : (
                <span>REJECT</span>
              )}
            </button>
            
            <button
              onClick={async () => {
                setIsProcessing(true);
                setAction('accept');
                try {
                  await onAccept();
                } finally {
                  setIsProcessing(false);
                  setAction(null);
                }
              }}
              disabled={isProcessing}
              className={`flex-1 py-2.5 px-3 text-base font-medium text-white rounded-md transition-all ${
                isProcessing && action === 'accept'
                  ? 'bg-green-400'
                  : 'bg-green-500 hover:bg-green-600 active:scale-95'
              }`}
            >
              {isProcessing && action === 'accept' ? (
                <FaSpinner className="animate-spin mx-auto" />
              ) : (
                <span>ACCEPT</span>
              )}
            </button>
          </div>
        )}

        {request.status === 'accepted' && (
          <div className="mt-4 bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-green-50 border-b border-green-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <FaCheck className="text-green-500 mr-2" />
                  <span className="font-medium text-green-800">Ride Confirmed</span>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Driver Assigned
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-2xl text-blue-500">
                    <FaUser />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {request.driverName || 'Driver'}
                  </h3>
                  <div className="flex items-center mt-1 text-sm text-gray-500">
                    <FaCarAlt className="mr-1.5 flex-shrink-0" />
                    <span className="truncate">
                      {request.vehicleModel || 'Car'} • {request.vehicleNumber || 'MH 01 XX XXXX'}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      <FaInfoCircle className="mr-1" />
                      {request.vehicleColor || 'Car Color'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">Contact</span>
                    <a 
                      href={`tel:${request.driverPhone || request.userPhone || ''}`}
                      className="text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <FaPhone className="mr-1.5" />
                      {request.driverPhone || request.userPhone || 'N/A'}
                    </a>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-xs text-gray-500">Fare</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatFare(request.fare)}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Pickup</div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.pickupSublocalityAddress || request.pickupLocation || 'N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Drop</div>
                    <div className="text-sm font-medium text-gray-900">
                      {request.destinationSublocalityAddress || request.dropoffLocation || 'N/A'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}