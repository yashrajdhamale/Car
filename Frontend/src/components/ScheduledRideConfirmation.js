import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { db } from '../config/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { 
  FaCheckCircle, 
  FaUser, 
  FaPhone, 
  FaCar, 
  FaCalendarAlt, 
  FaClock,
  FaFileInvoice,
  FaEnvelope,
  FaMapMarkerAlt,
  FaFileContract,
  FaShieldAlt,
  FaTimesCircle
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ScheduledRideConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { bookingId } = useParams();
  
  const [bookingData, setBookingData] = useState(null);
  const [driverDetails, setDriverDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [sendingInvoice, setSendingInvoice] = useState(false);
  const [invoiceSent, setInvoiceSent] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showCancellation, setShowCancellation] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');
  const [bookingCollection, setBookingCollection] = useState('bookings');

  // Fetch booking data
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        if (!bookingId) {
          toast.error('Invalid booking ID');
          navigate('/');
          return;
        }

        // Try to get from bookings collection first
        let currentCollection = 'bookings';
        let bookingRef = doc(db, 'bookings', bookingId);
        let bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
          // Try airport transfers
          currentCollection = 'airportTransfers';
          bookingRef = doc(db, 'airportTransfers', bookingId);
          bookingSnap = await getDoc(bookingRef);
        }
        setBookingCollection(currentCollection);

        if (!bookingSnap.exists()) {
          toast.error('Booking not found');
          navigate('/');
          return;
        }

        const data = bookingSnap.data();
        setBookingData({
          id: bookingSnap.id,
          ...data
        });

        // Set driver details if available
        if (data.driverId || data.driverName) {
          setDriverDetails({
            id: data.driverId,
            name: data.driverName || 'Driver',
            phone: data.driverPhone || 'Not provided',
            vehicleType: data.vehicleType || 'Standard',
            vehicleModel: data.vehicleModel || '',
            vehicleNumber: data.vehicleNumber || '',
            photoURL: data.driverPhotoURL || null,
            rating: data.driverRating || 4.5
          });
        }

        // Get user info from booking
        setUserEmail(data.email || data.userEmail || data.customerEmail || '');
        setUserName(data.customerName || data.userName || data.displayName || 'Customer');

        setLoading(false);
      } catch (error) {
        console.error('Error fetching booking:', error);
        toast.error('Failed to load booking details');
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [bookingId, navigate]);

  // Function to send invoice email
  const sendInvoiceEmail = async () => {
    if (!bookingData || !userEmail) {
      toast.error('No booking data or email available');
      return false;
    }

    setSendingInvoice(true);
    try {
      const invoiceData = {
        to: userEmail,
        customerName: userName,
        bookingId: bookingData.id,
        bookingType: bookingData.type || 'scheduled_ride',
        vehicleType: bookingData.vehicleType || bookingData.car?.name || 'Vehicle',
        pickupLocation: bookingData.pickupLocation?.name || bookingData.pickupLocation || bookingData.pickupCity || '',
        dropoffLocation: bookingData.dropoffLocation?.name || bookingData.dropoffLocation || bookingData.destinationCity || '',
        travelDate: bookingData.travelDate || bookingData.rideDate || '',
        pickupTime: bookingData.pickupTime || bookingData.rideTime || '',
        passengerCount: bookingData.passengers || bookingData.adults || 1,
        distance: bookingData.distance || 0,
        price: bookingData.price || bookingData.fare || 0,
        paymentMethod: bookingData.paymentMethod || 'UPI',
        status: 'confirmed',
        driverName: driverDetails?.name || 'Driver',
        driverPhone: driverDetails?.phone || 'Not provided',
        driverVehicle: `${driverDetails?.vehicleType || ''} ${driverDetails?.vehicleModel || ''}`.trim(),
        scheduledAt: bookingData.scheduledDateTime || bookingData.createdAt || new Date().toISOString()
      };

      const backendUrl = window.location.origin.includes('localhost') ? 'http://localhost:5000' : '';
      const response = await fetch(
        `${backendUrl}/api/email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: invoiceData.customerEmail || invoiceData.to,
            subject: `Invoice for Scheduled Ride #${invoiceData.bookingId}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333; text-align: center;">Ride Invoice</h2>
                <p>Dear ${invoiceData.customerName},</p>
                <p>Here is your ride invoice for booking <strong>#${invoiceData.bookingId}</strong>.</p>
                <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>From:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.pickupLocation}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>To:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.dropoffLocation}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.travelDate} ${invoiceData.pickupTime ? `at ${invoiceData.pickupTime}` : ''}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Driver:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.driverName} (${invoiceData.driverPhone})</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Vehicle:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.driverVehicle}</td></tr>
                  <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Distance:</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${invoiceData.distance} km</td></tr>
                  <tr style="font-size: 16px; font-weight: bold; background-color: #f9f9f9;"><td style="padding: 10px;">Total Price:</td><td style="padding: 10px; color: #2e7d32;">₹${invoiceData.price}</td></tr>
                </table>
                <p style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">Thank you for riding with Cabroute!</p>
              </div>
            `
          }),
        }
      );

      const result = await response.json();
      
      if (result.success) {
        setInvoiceSent(true);
        
        // Update booking with invoice sent status
        const bookingRef = doc(db, bookingCollection, bookingData.id);
        await updateDoc(bookingRef, {
          invoiceSent: true,
          invoiceSentAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        
        return true;
      } else {
        throw new Error(result.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice email');
      return false;
    } finally {
      setSendingInvoice(false);
    }
  };

  // Handle payment confirmation
  const handlePaymentConfirmation = async () => {
    if (!acceptedTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    try {
      // Send invoice first
      const invoiceSent = await sendInvoiceEmail();
      
      if (invoiceSent) {
        // Update booking status
        const bookingRef = doc(db, bookingCollection, bookingData.id);
        await updateDoc(bookingRef, {
          status: 'confirmed',
          paymentStatus: 'paid',
          paymentConfirmedAt: serverTimestamp(),
          termsAccepted: true,
          termsAcceptedAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        setPaymentSuccess(true);
        toast.success('Payment confirmed and invoice sent!');
        
        // Also send confirmation to driver
        if (driverDetails?.id) {
          const driverRef = doc(db, 'drivers', driverDetails.id);
          const pickupStr = bookingData.pickupLocation?.name || bookingData.pickupLocation || '';
          const dropoffStr = bookingData.dropoffLocation?.name || bookingData.dropoffLocation || '';
          await updateDoc(driverRef, {
            hasNewNotification: true,
            notificationMessage: `Scheduled ride confirmed: ${pickupStr} to ${dropoffStr}`,
            notificationTime: serverTimestamp()
          });
        }
      }
    } catch (error) {
      console.error('Error confirming payment:', error);
      toast.error('Failed to confirm payment');
    }
  };

  // Function to cancel the ride
  const handleCancelRide = async () => {
    if (!window.confirm('Are you sure you want to cancel this scheduled ride?')) {
      return;
    }

    try {
      const bookingRef = doc(db, bookingCollection, bookingData.id);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledAt: serverTimestamp(),
        cancelledBy: 'customer',
        updatedAt: serverTimestamp()
      });

      // Notify driver if assigned
      if (driverDetails?.id) {
        const driverRef = doc(db, 'drivers', driverDetails.id);
        await updateDoc(driverRef, {
          hasNewNotification: true,
          notificationMessage: `Scheduled ride cancelled: ${bookingData.id}`,
          notificationTime: serverTimestamp()
        });
      }

      toast.success('Ride cancelled successfully');
      setTimeout(() => navigate('/'), 2000);
    } catch (error) {
      console.error('Error cancelling ride:', error);
      toast.error('Failed to cancel ride');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (!bookingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FaTimesCircle className="text-red-500 text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <ToastContainer position="top-right" autoClose={5000} />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Scheduled Ride Confirmation
              </h1>
              <p className="text-gray-600">Booking ID: {bookingData.id}</p>
            </div>
            <div className="mt-4 md:mt-0">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                bookingData.status === 'driver_assigned' ? 'bg-blue-100 text-blue-800' :
                bookingData.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {bookingData.status?.toUpperCase() || 'PENDING'}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Booking Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Success Message after Payment */}
            {paymentSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <FaCheckCircle className="text-green-500 text-3xl mr-3" />
                  <div>
                    <h3 className="text-xl font-bold text-green-800">Payment Confirmed!</h3>
                    <p className="text-green-600">Your scheduled ride is confirmed</p>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-green-100">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FaEnvelope className="text-green-500 mr-2" />
                      <span className="font-medium">Invoice Sent To:</span>
                    </div>
                    <span className="text-blue-600 font-medium">{userEmail}</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium"
                    >
                      View My Bookings
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-3 rounded-lg font-medium border border-gray-300"
                    >
                      Print Confirmation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Driver Details Card */}
            {driverDetails && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-500" />
                  Your Driver
                </h2>
                
                <div className="flex items-start space-x-4">
                  {driverDetails.photoURL ? (
                    <img
                      src={driverDetails.photoURL}
                      alt={driverDetails.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaUser className="text-blue-500 text-2xl" />
                    </div>
                  )}
                  
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{driverDetails.name}</h3>
                        <div className="flex items-center mt-1">
                          <FaPhone className="text-gray-500 text-sm mr-1" />
                          <a 
                            href={`tel:${driverDetails.phone}`}
                            className="text-blue-600 hover:underline"
                          >
                            {driverDetails.phone}
                          </a>
                        </div>
                      </div>
                      {driverDetails.rating && (
                        <div className="flex items-center">
                          <span className="text-yellow-500">⭐</span>
                          <span className="ml-1 font-medium">{driverDetails.rating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-4">
                      <div className="flex items-center text-gray-700">
                        <FaCar className="mr-2 text-gray-500" />
                        <span>{driverDetails.vehicleType} • {driverDetails.vehicleModel}</span>
                        {driverDetails.vehicleNumber && (
                          <span className="ml-2 text-sm text-gray-500">({driverDetails.vehicleNumber})</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Your driver will contact you before the scheduled pickup time.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Trip Details Card */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-green-500" />
                Trip Details
              </h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Pickup Location</p>
                    <p className="font-medium">{bookingData.pickupLocation?.name || bookingData.pickupLocation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Destination</p>
                    <p className="font-medium">{bookingData.dropoffLocation?.name || bookingData.dropoffLocation || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Travel Date</p>
                      <p className="font-medium">
                        {bookingData.travelDate ? new Date(bookingData.travelDate).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center">
                    <FaClock className="text-gray-500 mr-2" />
                    <div>
                      <p className="text-sm text-gray-500">Pickup Time</p>
                      <p className="font-medium">{bookingData.pickupTime || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Passengers</p>
                    <p className="font-medium">{bookingData.passengers || bookingData.adults || 1}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Distance</p>
                    <p className="font-medium">{bookingData.distance ? `${bookingData.distance} km` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Estimated Duration</p>
                    <p className="font-medium">{bookingData.estimatedDuration || 'N/A'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Details Card */}
            {!paymentSuccess && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <FaFileInvoice className="mr-2 text-purple-500" />
                  Payment Details
                </h2>
                
                <div className="space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">Total Amount</span>
                      <span className="text-2xl font-bold text-green-600">
                        ₹{bookingData.price || bookingData.fare || 0}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-500">
                      <p>Payment Method: UPI</p>
                      <p>UPI ID: carziholidays@upi</p>
                    </div>
                  </div>
                  
                  {/* QR Code Display */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <p className="text-center font-medium mb-3">Scan QR Code to Pay</p>
                    <div className="flex justify-center">
                      <div className="bg-white p-4 border border-gray-300 rounded-lg">
                        <div className="w-48 h-48 bg-gray-100 flex items-center justify-center">
                          {/* Replace with your QR code image */}
                          <div className="text-center">
                            <div className="text-4xl mb-2">💰</div>
                            <p className="text-xs text-gray-600">QR Code Placeholder</p>
                            <p className="text-xs text-gray-500">carziholidays@upi</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-3">
                      After payment, click "I've Made Payment" below
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Actions & Terms */}
          <div className="space-y-6">
            {/* Terms & Conditions */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FaFileContract className="mr-2 text-orange-500" />
                Terms & Conditions
              </h2>
              
              <div className="space-y-3">
                <div className="flex items-start">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-1 mr-3"
                  />
                  <label htmlFor="terms" className="text-sm text-gray-700">
                    I agree to the{' '}
                    <button
                      onClick={() => setShowTerms(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Terms & Conditions
                    </button>{' '}
                    and{' '}
                    <button
                      onClick={() => setShowCancellation(true)}
                      className="text-blue-600 hover:underline"
                    >
                      Cancellation Policy
                    </button>
                  </label>
                </div>
                
                <div className="text-xs text-gray-500">
                  <p>• Payment must be completed to confirm booking</p>
                  <p>• Cancellation charges apply as per policy</p>
                  <p>• Driver may contact you before pickup</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Actions</h2>
              
              <div className="space-y-3">
                {!paymentSuccess ? (
                  <>
                    <button
                      onClick={handlePaymentConfirmation}
                      disabled={!acceptedTerms || sendingInvoice}
                      className={`w-full py-3 px-4 rounded-lg font-medium ${
                        !acceptedTerms || sendingInvoice
                          ? 'bg-gray-300 cursor-not-allowed'
                          : 'bg-green-500 hover:bg-green-600'
                      } text-white transition-colors flex items-center justify-center gap-2`}
                    >
                      {sendingInvoice ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Sending Invoice...
                        </>
                      ) : (
                        <>
                          <FaCheckCircle />
                          I've Made Payment
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={handleCancelRide}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-red-100 hover:bg-red-200 text-red-700 border border-red-300 transition-colors"
                    >
                      Cancel This Ride
                    </button>
                  </>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/my-bookings')}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                    >
                      View All Bookings
                    </button>
                    
                    <button
                      onClick={() => window.print()}
                      className="w-full py-3 px-4 rounded-lg font-medium bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300 transition-colors"
                    >
                      Print Confirmation
                    </button>
                  </div>
                )}
                
                <button
                  onClick={() => navigate('/contact')}
                  className="w-full py-3 px-4 rounded-lg font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors text-sm"
                >
                  Need Help? Contact Support
                </button>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <FaShieldAlt className="text-yellow-500 mt-1 mr-3" />
                <div>
                  <h3 className="font-medium text-yellow-800 mb-1">Important Notes</h3>
                  <ul className="text-sm text-yellow-700 space-y-1">
                    <li>• Keep payment confirmation for reference</li>
                    <li>• Driver will call before pickup</li>
                    <li>• Arrive at pickup point 10 minutes early</li>
                    <li>• Contact support for any changes</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terms & Conditions Modal */}
      {showTerms && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Terms & Conditions</h3>
                <button
                  onClick={() => setShowTerms(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="prose max-w-none">
                <h4>1. Booking Confirmation</h4>
                <p>Your booking is confirmed only after payment is received and verified.</p>
                
                <h4>2. Cancellation Policy</h4>
                <p>Cancellations made 24 hours before pickup: Full refund</p>
                <p>Cancellations made less than 24 hours: 50% refund</p>
                <p>Cancellations made after driver dispatch: No refund</p>
                
                <h4>3. Driver Responsibilities</h4>
                <p>Driver will arrive at the scheduled pickup point within the agreed time window.</p>
                
                <h4>4. Passenger Responsibilities</h4>
                <p>Passengers must be ready at the pickup point at least 10 minutes before the scheduled time.</p>
              </div>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowTerms(false)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancellation Policy Modal */}
      {showCancellation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">Cancellation Policy</h3>
                <button
                  onClick={() => setShowCancellation(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-bold text-green-800 mb-2">Free Cancellation</h4>
                  <p className="text-green-700">Cancel up to 24 hours before pickup for a full refund.</p>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-bold text-yellow-800 mb-2">Partial Refund</h4>
                  <p className="text-yellow-700">Cancel less than 24 hours before pickup for a 50% refund.</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-bold text-red-800 mb-2">No Refund</h4>
                  <p className="text-red-700">No refund if cancelled after driver has been dispatched.</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-bold text-blue-800 mb-2">How to Cancel</h4>
                  <ul className="text-blue-700 list-disc pl-5 space-y-1">
                    <li>Click "Cancel This Ride" button</li>
                    <li>Contact customer support</li>
                    <li>Refunds processed within 5-7 business days</li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="p-6 border-t">
              <button
                onClick={() => setShowCancellation(false)}
                className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                I Understand
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ScheduledRideConfirmation;