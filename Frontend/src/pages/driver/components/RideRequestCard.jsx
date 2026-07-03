import React, { memo, useState } from "react";
import { format } from 'date-fns';
import { FaCheck, FaTimes, FaSpinner, FaUser, FaPhone, FaMapMarkerAlt, FaCalendarAlt, FaUsers, FaCar, FaRupeeSign } from 'react-icons/fa';

const RideRequestCard = memo(({ request, onAccept, onReject }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [action, setAction] = useState(null);
  
  if (!request) return null;

  const isHolidayRequest = request.type === 'holiday';
  const requestTitle = isHolidayRequest ? 'HOLIDAY PACKAGE REQUEST' : 'NEW RIDE REQUEST';
  const isAccepted = request.status === 'accepted';
  
  // Format date in Indian/British style (e.g., 10 September 2025)
  const formatDate = (dateString) => {
    if (!dateString) return 'Not specified';
    try {
      return format(new Date(dateString), 'd MMMM yyyy');
    } catch (e) {
      return dateString;
    }
  };

  // Format time in 12-hour format with AM/PM
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'h:mm a');
    } catch (e) {
      return '';
    }
  };

  const renderInfoRow = (icon, label, value, hidden = false) => (
    <div className="flex items-start mb-3">
      <span className="text-indigo-500 w-8 flex-shrink-0 mt-1">{icon}</span>
      <div className="flex-1">
        <div className="text-xs text-gray-500 font-medium">{label}</div>
        <div className={`text-gray-800 ${hidden ? 'blur-sm hover:blur-none' : ''}`}>
          {hidden ? '••••••••••' : value || 'N/A'}
        </div>
      </div>
    </div>
  );

  // Handle payment button click
  const handlePaymentClick = () => {
    // TODO: Implement payment processing logic
    console.log('Processing payment for booking:', request.bookingId || request.id);
    // You can add your payment processing logic here
    // For example, redirect to a payment page or open a payment modal
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden border-l-4 border-indigo-500 mb-6 transform transition-all hover:shadow-lg">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-xl font-bold text-gray-800">{requestTitle}</h2>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            request.status === 'accepted' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {request.status?.toUpperCase() || 'PENDING'}
          </span>
        </div>

        <div className="space-y-1">
          {isHolidayRequest ? (
            <>
              {renderInfoRow(<FaMapMarkerAlt />, 'PACKAGE', request.packageName || 'N/A')}
              {renderInfoRow(
                <FaUser />, 
                'CUSTOMER', 
                isAccepted ? (request.customerName || 'Customer') : 'Hidden until accepted',
                !isAccepted
              )}
              {renderInfoRow(
                <FaPhone />, 
                'PHONE', 
                isAccepted ? (request.phoneNumber || request.phone || 'N/A') : '••••••••••',
                !isAccepted
              )}
              {renderInfoRow(<FaMapMarkerAlt />, 'DESTINATION', request.destination || request.state || 'N/A')}
              {renderInfoRow(<FaCalendarAlt />, 'TRAVEL DATE', formatDate(request.travelDate))}
              {renderInfoRow(<FaUsers />, 'GUESTS', request.guests || 'N/A')}
              {renderInfoRow(<FaCar />, 'VEHICLE', request.vehicleType || 'N/A')}
              {renderInfoRow(<FaRupeeSign />, 'PRICE', request.price || request.fare ? `₹${request.price || request.fare}` : 'N/A')}
            </>
          ) : (
            <>
              {renderInfoRow(<FaMapMarkerAlt />, 'PICKUP', request.pickupLocation || request.pickupAddress || request.pickupSublocalityAddress || request.from || 'N/A')}
              {renderInfoRow(<FaMapMarkerAlt className="text-red-500" />, 'DESTINATION', request.dropoffLocation || request.destinationAddress || request.destinationSublocalityAddress || request.to || 'N/A')}
              {renderInfoRow(
                <FaUser />, 
                'CUSTOMER', 
                isAccepted ? (request.userName || request.customerName || request.displayName || 'Customer') : 'Hidden until accepted',
                !isAccepted
              )}
              {renderInfoRow(
                <FaPhone />, 
                'PHONE', 
                isAccepted ? (request.phoneNumber || request.phone || 'N/A') : '••••••••••',
                !isAccepted
              )}
              {renderInfoRow(<FaCalendarAlt />, 'DATE', formatDate(request.createdAt?.toDate() || request.createdAt))}
              {request.time && renderInfoRow(<FaCalendarAlt />, 'TIME', formatTime(request.time))}
              {renderInfoRow(<FaRupeeSign />, 'FARE', request.fare ? `₹${request.fare}` : 'N/A')}
            </>
          )}
        </div>

        {request.status === 'pending' && (
          <div className="flex justify-between mt-6 space-x-4">
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
              className={`flex-1 py-3 px-2 font-bold text-white rounded-lg transition-all flex items-center justify-center space-x-2 ${
                isProcessing && action === 'reject'
                  ? 'bg-red-400'
                  : 'bg-red-500 hover:bg-red-600 active:scale-95'
              }`}
            >
              {isProcessing && action === 'reject' ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  <span>Rejecting...</span>
                </>
              ) : (
                <>
                  <FaTimes className="mr-2" />
                  <span>REJECT</span>
                </>
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
              className={`flex-1 py-3 px-2 font-bold text-white rounded-lg transition-all flex items-center justify-center space-x-2 ${
                isProcessing && action === 'accept'
                  ? 'bg-green-400'
                  : 'bg-green-500 hover:bg-green-600 active:scale-95'
              }`}
            >
              {isProcessing && action === 'accept' ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  <span>Accepting...</span>
                </>
              ) : (
                <>
                  <FaCheck className="mr-2" />
                  <span>ACCEPT</span>
                </>
              )}
            </button>
          </div>
        )}

        {request.status === 'accepted' && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg text-center">
            <p className="text-sm text-green-700">
              You have accepted this ride request
            </p>
            <p className="text-xs text-green-600 mt-1">
              Contact the customer at: {request.phoneNumber || request.phone || 'N/A'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

export default RideRequestCard;
