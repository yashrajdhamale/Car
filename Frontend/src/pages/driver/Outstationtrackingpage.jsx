
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  FaMapMarkerAlt, 
  FaCar, 
  FaUser, 
  FaPhone, 
  FaClock, 
  FaRoute,
  FaCheckCircle,
  FaSpinner,
  FaTimesCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaShieldAlt
} from 'react-icons/fa';
import OutstationTrackingMap from './Outstationtrackingmap';

// ─── Refund policy based on booking status when user cancels ─────
const getRefundPolicy = (bookingStatus) => {
  switch (bookingStatus) {
    case 'searching_driver':
    case 'driver_assigned':
      return {
        percentage: 75,
        label: '75% Refund',
        desc: 'Since your driver hasn\'t departed yet, you\'ll receive 75% of your payment back.',
        badgeBg: '#ffedd5',
        badgeColor: '#c2410c',
        icon: '💰',
      };
    case 'driver_on_way':
    case 'driver_arrived':
      return {
        percentage: 0,
        label: 'No Refund',
        desc: 'Your driver has already departed towards your location. Cancellation at this stage is non-refundable.',
        badgeBg: '#fee2e2',
        badgeColor: '#dc2626',
        icon: '🚫',
      };
    case 'in_progress':
      return {
        percentage: 0,
        label: 'No Refund',
        desc: 'Your trip is already in progress. Cancellation is non-refundable.',
        badgeBg: '#fee2e2',
        badgeColor: '#dc2626',
        icon: '🚫',
      };
    default:
      return {
        percentage: 75,
        label: '75% Refund',
        desc: 'You\'ll receive 75% of your payment back as per our cancellation policy.',
        badgeBg: '#ffedd5',
        badgeColor: '#c2410c',
        icon: '💰',
      };
  }
};

// ─── Cancel Ride Modal ────────────────────────────────────────────
function CancelRideModal({ booking, onConfirm, onClose, cancelling }) {
  const [reason, setReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const refundPolicy = getRefundPolicy(booking?.status);

  const reasons = [
    'Change of plans',
    'Booked by mistake',
    'Found another ride',
    'Driver is taking too long',
    'Emergency at home',
    'Other',
  ];

  const finalReason = reason === 'Other' ? customReason : reason;
  const canSubmit = reason && (reason !== 'Other' || customReason.trim().length > 2);

  return (
    <>
      <style>{`
        @keyframes cancelFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes cancelSlideUp {
          from{opacity:0;transform:translateY(40px) scale(0.97)}
          to{opacity:1;transform:translateY(0) scale(1)}
        }
        .cancel-modal-overlay { animation: cancelFadeIn 0.25s ease; }
        .cancel-modal-box    { animation: cancelSlideUp 0.32s cubic-bezier(0.34,1.56,0.64,1); }
        .cancel-reason-btn:hover:not(.active-reason) { background:#fff7ed!important; border-color:#f97316!important; }
        .cancel-confirm-btn:hover:not([disabled]) {
          transform:translateY(-1px);
          box-shadow:0 8px 24px rgba(220,38,38,0.35)!important;
        }
        .cancel-confirm-btn:active:not([disabled]){ transform:translateY(0); }
        .cancel-close-btn:hover{ background:#f1f5f9!important; }
        .cancel-modal-scroll::-webkit-scrollbar{width:4px}
        .cancel-modal-scroll::-webkit-scrollbar-thumb{background:#fdba74;border-radius:99px}
      `}</style>

      <div
        className="cancel-modal-overlay"
        style={{
          position:'fixed', inset:0, zIndex:99999,
          background:'rgba(15,5,0,0.72)',
          backdropFilter:'blur(8px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          padding:'16px',
        }}
        onClick={(e)=>e.target===e.currentTarget && onClose()}
      >
        <div
          className="cancel-modal-box cancel-modal-scroll"
          style={{
            background:'#fff', borderRadius:'24px',
            width:'100%', maxWidth:'480px', maxHeight:'90vh',
            overflow:'auto',
            boxShadow:'0 32px 80px rgba(220,38,38,0.18), 0 0 0 1px rgba(255,255,255,0.1)',
          }}
        >
          {/* Header */}
          <div style={{
            background:'linear-gradient(135deg, #7f1d1d 0%, #dc2626 60%, #ef4444 100%)',
            padding:'24px 28px 20px', position:'relative', overflow:'hidden', borderRadius:'24px 24px 0 0',
          }}>
            <div style={{position:'absolute',top:'-40px',right:'-30px',width:'140px',height:'140px',background:'rgba(255,255,255,0.06)',borderRadius:'50%'}}/>
            <div style={{position:'absolute',bottom:'-50px',left:'-20px',width:'110px',height:'110px',background:'rgba(255,255,255,0.04)',borderRadius:'50%'}}/>
            <div style={{display:'flex',alignItems:'center',gap:'10px',marginBottom:'8px'}}>
              <div style={{width:'38px',height:'38px',borderRadius:'50%',background:'rgba(255,255,255,0.18)',display:'flex',alignItems:'center',justifyContent:'center'}}>
                <FaTimesCircle style={{color:'#fff',fontSize:'18px'}}/>
              </div>
              <h2 style={{color:'#fff',fontSize:'20px',fontWeight:'800',margin:0}}>Cancel Your Ride</h2>
            </div>
            <p style={{color:'#fca5a5',fontSize:'13px',margin:0}}>Please review the refund policy before proceeding.</p>
          </div>

          <div style={{padding:'22px 24px'}}>
            {/* Refund Policy Card */}
            <div style={{
              background: refundPolicy.percentage > 0 ? '#fff7ed' : '#fff5f5',
              border: `1.5px solid ${refundPolicy.percentage > 0 ? '#fdba74' : '#fca5a5'}`,
              borderRadius:'14px', padding:'16px', marginBottom:'20px',
            }}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'8px'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',fontWeight:'700',fontSize:'14px',color: refundPolicy.percentage > 0 ? '#c2410c' : '#dc2626'}}>
                  <span style={{fontSize:'20px'}}>{refundPolicy.icon}</span>
                  Cancellation Refund
                </div>
                <span style={{
                  background:refundPolicy.badgeBg, color:refundPolicy.badgeColor,
                  borderRadius:'100px', padding:'4px 12px', fontSize:'12px', fontWeight:'800',
                }}>
                  {refundPolicy.label}
                </span>
              </div>
              <p style={{fontSize:'12.5px',color:'#78716c',lineHeight:'1.55',margin:0}}>
                {refundPolicy.desc}
              </p>
              {refundPolicy.percentage > 0 && booking?.totalPrice && (
                <div style={{
                  marginTop:'10px', padding:'8px 12px',
                  background:'#fff', borderRadius:'8px', border:'1px solid #fdba74',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                }}>
                  <span style={{fontSize:'12px',color:'#92400e'}}>Estimated refund:</span>
                  <span style={{fontSize:'15px',fontWeight:'800',color:'#c2410c'}}>
                    ₹{Math.round((booking.totalPrice * refundPolicy.percentage) / 100)}
                  </span>
                </div>
              )}
            </div>

            {/* Booking ID */}
            <div style={{
              background:'#f8fafc', border:'1px solid #e2e8f0',
              borderRadius:'10px', padding:'10px 14px', marginBottom:'18px',
              display:'flex', alignItems:'center', justifyContent:'space-between',
            }}>
              <span style={{fontSize:'12px',color:'#64748b'}}>Booking ID</span>
              <span style={{fontSize:'12px',fontWeight:'700',color:'#1e293b',fontFamily:'monospace'}}>
                {booking?.id?.slice(0,12).toUpperCase()}...
              </span>
            </div>

            {/* Reason Selection */}
            <div style={{marginBottom:'18px'}}>
              <label style={{fontSize:'13px',fontWeight:'700',color:'#1c0a00',display:'block',marginBottom:'10px'}}>
                Reason for cancellation <span style={{color:'#ef4444'}}>*</span>
              </label>
              <div style={{display:'flex',flexDirection:'column',gap:'7px'}}>
                {reasons.map((r) => (
                  <button
                    key={r}
                    className={`cancel-reason-btn ${reason===r?'active-reason':''}`}
                    onClick={() => setReason(r)}
                    style={{
                      textAlign:'left', padding:'10px 14px',
                      borderRadius:'10px', border:'1.5px solid',
                      borderColor: reason===r ? '#f97316' : '#e2e8f0',
                      background: reason===r ? '#fff7ed' : '#fff',
                      fontSize:'13px', fontWeight: reason===r ? '700' : '500',
                      color: reason===r ? '#7c2d12' : '#374151',
                      cursor:'pointer', transition:'all 0.15s',
                      display:'flex', alignItems:'center', gap:'8px',
                    }}
                  >
                    <span style={{
                      width:'16px', height:'16px', borderRadius:'50%',
                      border: `2px solid ${reason===r ? '#f97316' : '#d1d5db'}`,
                      background: reason===r ? '#f97316' : 'transparent',
                      flexShrink:0, transition:'all 0.15s', marginTop:'1px',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      {reason===r && <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#fff',display:'block'}}/>}
                    </span>
                    {r}
                  </button>
                ))}
              </div>

              {reason === 'Other' && (
                <textarea
                  value={customReason}
                  onChange={(e)=>setCustomReason(e.target.value)}
                  placeholder="Please describe your reason..."
                  maxLength={200}
                  style={{
                    marginTop:'10px', width:'100%', padding:'10px 14px',
                    borderRadius:'10px', border:'1.5px solid #fdba74',
                    background:'#fff7ed', fontSize:'13px', color:'#1c0a00',
                    resize:'vertical', minHeight:'80px', outline:'none',
                    fontFamily:'inherit', boxSizing:'border-box',
                  }}
                />
              )}
            </div>

            {/* Warning Banner */}
            <div style={{
              display:'flex', alignItems:'flex-start', gap:'10px',
              padding:'12px 14px', borderRadius:'10px',
              background:'#fefce8', border:'1px solid #fde68a',
              marginBottom:'20px', fontSize:'12px', color:'#92400e', lineHeight:'1.5',
            }}>
              <FaExclamationTriangle style={{color:'#f59e0b',marginTop:'2px',flexShrink:0}}/>
              <span>
                This action <strong>cannot be undone</strong>. Your driver will be notified immediately. 
                Refunds (if applicable) are processed within 5–7 business days.
              </span>
            </div>

            {/* Buttons */}
            <div style={{display:'flex',gap:'10px'}}>
              <button
                className="cancel-close-btn"
                onClick={onClose}
                disabled={cancelling}
                style={{
                  flex:1, padding:'13px', borderRadius:'12px',
                  border:'1.5px solid #e2e8f0', background:'#f8fafc',
                  fontSize:'14px', fontWeight:'700', color:'#374151',
                  cursor:'pointer', transition:'all 0.15s',
                }}
              >
                Keep Ride
              </button>
              <button
                className="cancel-confirm-btn"
                onClick={() => canSubmit && onConfirm(finalReason, refundPolicy)}
                disabled={!canSubmit || cancelling}
                style={{
                  flex:1, padding:'13px', borderRadius:'12px',
                  border:'none',
                  background: canSubmit && !cancelling
                    ? 'linear-gradient(135deg, #991b1b 0%, #dc2626 50%, #ef4444 100%)'
                    : '#e7e5e4',
                  fontSize:'14px', fontWeight:'800', color: canSubmit && !cancelling ? '#fff' : '#a8a29e',
                  cursor: canSubmit && !cancelling ? 'pointer' : 'not-allowed',
                  transition:'all 0.2s',
                  boxShadow: canSubmit && !cancelling ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
                  display:'flex', alignItems:'center', justifyContent:'center', gap:'8px',
                }}
              >
                {cancelling ? (
                  <><FaSpinner style={{animation:'spin 1s linear infinite'}}/> Cancelling...</>
                ) : (
                  <><FaTimesCircle/> Cancel Ride</>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </>
  );
}

// ─── Cancellation Success Banner ──────────────────────────────────
function CancelSuccessBanner({ refundPolicy, booking, onGoHome }) {
  return (
    <div style={{
      background:'linear-gradient(135deg, #fff7ed, #ffedd5)',
      border:'2px solid #fdba74', borderRadius:'16px',
      padding:'20px 22px', margin:'0 0 16px',
    }}>
      <div style={{display:'flex',alignItems:'flex-start',gap:'14px'}}>
        <div style={{
          width:'44px', height:'44px', borderRadius:'50%',
          background:'linear-gradient(135deg, #ea580c, #f97316)',
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0, boxShadow:'0 3px 10px rgba(234,88,12,0.3)',
        }}>
          <FaCheckCircle style={{color:'#fff',fontSize:'20px'}}/>
        </div>
        <div style={{flex:1}}>
          <h3 style={{fontWeight:'800',fontSize:'16px',color:'#7c2d12',margin:'0 0 4px'}}>
            Ride Cancelled Successfully
          </h3>
          <p style={{fontSize:'13px',color:'#9a3412',margin:'0 0 10px',lineHeight:'1.5'}}>
            {refundPolicy.percentage > 0
              ? `A refund of ₹${Math.round((booking.totalPrice * refundPolicy.percentage) / 100)} (${refundPolicy.percentage}%) will be processed within 5–7 business days.`
              : 'No refund is applicable as per our cancellation policy.'
            }
          </p>
          <button
            onClick={onGoHome}
            style={{
              padding:'9px 20px', borderRadius:'10px', border:'none',
              background:'linear-gradient(135deg, #c2410c, #ea580c)',
              color:'#fff', fontSize:'13px', fontWeight:'700',
              cursor:'pointer', boxShadow:'0 3px 10px rgba(234,88,12,0.3)',
            }}
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────
export default function OutstationTrackingPage() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [driverLocation, setDriverLocation] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [locationPermission, setLocationPermission] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [user, setUser] = useState(null);

  // ─── Cancel ride state ───────────────────────────────────────
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelledSuccess, setCancelledSuccess] = useState(false);
  const [appliedRefundPolicy, setAppliedRefundPolicy] = useState(null);
  // ─────────────────────────────────────────────────────────────
  
  const locationWatchId = useRef(null);

  // Can only cancel if not yet completed / already cancelled
  const canCancel = booking &&
    !['completed', 'cancelled'].includes(booking.status) &&
    !cancelledSuccess;

  // Check authentication
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        navigate('/login', { 
          state: { 
            from: `/track-outstation/${bookingId}`,
            message: 'Please log in to track your ride'
          } 
        });
      }
    });
    return () => unsubscribe();
  }, [bookingId, navigate]);

  // Listen to booking updates in real-time
  useEffect(() => {
    if (!bookingId || !user) return;

    const bookingRef = doc(db, 'bookings', bookingId);
    
    const unsubscribe = onSnapshot(
      bookingRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setBooking(data);
          if (data.driverLocation) setDriverLocation(data.driverLocation);
          if (data.status === 'cancelled') setCancelledSuccess(true);
          setLoading(false);
        } else {
          setError('Booking not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Error fetching booking:', err);
        setError('Failed to load booking details');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [bookingId, user]);

  // Request and track user location
  useEffect(() => {
    if (!booking || booking.status === 'completed' || booking.status === 'cancelled') return;

    if (booking.userLocation) {
      setUserLocation(booking.userLocation);
      setLocationPermission('granted');
    }

    if ('geolocation' in navigator) requestLocationPermission();
    else setError('Geolocation is not supported by your browser');

    return () => {
      if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
    };
  }, [booking?.id]); // only re-run when booking id changes, not on every update

  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);
      if (['granted', 'prompt'].includes(permission.state)) startLocationTracking();
    } catch {
      startLocationTracking();
    }
  };

  const startLocationTracking = () => {
    if (isTracking) return;
    setIsTracking(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          timestamp: Date.now(), accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || 0, heading: pos.coords.heading || null,
        };
        setUserLocation(loc);
        setLocationPermission('granted');
        updateLocationInFirestore(loc);
      },
      handleLocationError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    locationWatchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const loc = {
          lat: pos.coords.latitude, lng: pos.coords.longitude,
          timestamp: Date.now(), accuracy: pos.coords.accuracy,
          speed: pos.coords.speed || 0, heading: pos.coords.heading || null,
        };
        setUserLocation(loc);
        updateLocationInFirestore(loc);
      },
      handleLocationError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleLocationError = (err) => {
    const msgs = {
      1: 'Please enable location permissions to track your ride.',
      2: 'Location information is unavailable.',
      3: 'Location request timed out.',
    };
    setError(`Unable to get your location. ${msgs[err.code] || 'An unknown error occurred.'}`);
    if (err.code === 1) setLocationPermission('denied');
    setIsTracking(false);
  };

  const updateLocationInFirestore = async (location) => {
    if (!bookingId) return;
    try {
      await updateDoc(doc(db, 'bookings', bookingId), {
        userLocation: location,
        userLocationUpdatedAt: serverTimestamp(),
        locationShared: true,
        waitingForLocation: false,
      });
    } catch (e) {
      console.error('Error updating location:', e);
    }
  };

  useEffect(() => {
    if (userLocation && driverLocation) calculateRouteInfo();
  }, [userLocation, driverLocation]);

  const calculateRouteInfo = () => {
    if (!userLocation || !driverLocation) return;
    const R = 6371;
    const dLat = (userLocation.lat - driverLocation.lat) * Math.PI / 180;
    const dLon = (userLocation.lng - driverLocation.lng) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(driverLocation.lat * Math.PI / 180) * Math.cos(userLocation.lat * Math.PI / 180) *
      Math.sin(dLon / 2) ** 2;
    const distance = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    setRouteInfo({
      distance: distance.toFixed(2),
      estimatedTime: Math.ceil((distance / 40) * 60),
      lastUpdated: Date.now(),
    });
  };

  // ─── Handle cancel ride confirmation ────────────────────────
  const handleCancelConfirm = async (reason, refundPolicy) => {
    setCancelling(true);
    try {
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'cancelled',
        cancelledBy: 'user',
        cancellationReason: reason,
        cancelledAt: serverTimestamp(),
        refundPercentage: refundPolicy.percentage,
        refundStatus: refundPolicy.percentage > 0 ? 'pending' : 'not_applicable',
        refundAmount: refundPolicy.percentage > 0
          ? Math.round(((booking.totalPrice || booking.price || 0) * refundPolicy.percentage) / 100)
          : 0,
        updatedAt: serverTimestamp(),
      });
      setAppliedRefundPolicy(refundPolicy);
      setCancelledSuccess(true);
      setShowCancelModal(false);
    } catch (err) {
      console.error('Error cancelling ride:', err);
      alert('Failed to cancel ride. Please try again or contact support.');
    } finally {
      setCancelling(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'searching_driver': 'bg-yellow-100 text-yellow-800',
      'driver_assigned':  'bg-orange-100 text-orange-800',
      'driver_on_way':    'bg-amber-100 text-amber-800',
      'driver_arrived':   'bg-green-100 text-green-800',
      'in_progress':      'bg-orange-100 text-orange-800',
      'completed':        'bg-gray-100 text-gray-800',
      'cancelled':        'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusText = (status) => {
    const texts = {
      'searching_driver': 'Searching for Driver',
      'driver_assigned':  'Driver Assigned',
      'driver_on_way':    'Driver on the Way',
      'driver_arrived':   'Driver Arrived',
      'in_progress':      'Trip in Progress',
      'completed':        'Trip Completed',
      'cancelled':        'Trip Cancelled',
    };
    return texts[status] || status;
  };

  // ─── Loading / error states ───────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-5xl text-orange-500 mx-auto mb-4" />
          <p className="text-lg text-gray-700">Loading tracking information...</p>
        </div>
      </div>
    );
  }

  if (error && !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50 p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg transition">
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-orange-50">
        <p className="text-lg text-gray-700">Booking not found</p>
      </div>
    );
  }

  const resolvedTotal = booking.totalPrice || booking.price || 0;

  return (
    <>
      {/* Cancel Ride Modal */}
      {showCancelModal && (
        <CancelRideModal
          booking={{ ...booking, totalPrice: resolvedTotal }}
          onConfirm={handleCancelConfirm}
          onClose={() => setShowCancelModal(false)}
          cancelling={cancelling}
        />
      )}

      <div className="min-h-screen bg-orange-50">
        {/* Header */}
        <div className="bg-white shadow-md border-b-2 border-orange-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate('/')} className="text-gray-600 hover:text-orange-600 font-medium transition">
                ← Back
              </button>
              <h1 className="text-xl font-bold text-gray-800">Track Your Ride</h1>
              <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(booking.status)}`}>
                {getStatusText(booking.status)}
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── Map + Cancel Section (left/center) ─────────────── */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-orange-100">
                <div className="h-[480px] lg:h-[560px]">
                  <OutstationTrackingMap
                    userLocation={userLocation}
                    driverLocation={driverLocation}
                    pickupLocation={booking.pickupCity}
                    destinationLocation={booking.destinationCity}
                    routeInfo={routeInfo}
                  />
                </div>

                {/* Location Permission Banner */}
                {locationPermission === 'denied' && (
                  <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <div className="flex items-start gap-3">
                      <svg className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
                      </svg>
                      <div>
                        <p className="text-sm text-red-700">
                          <strong>Location Access Denied</strong> — Please enable location permissions to track your ride.
                        </p>
                        <button onClick={() => startLocationTracking()} className="mt-1 text-sm text-red-700 underline hover:text-red-800">
                          Try Again
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {!userLocation && locationPermission !== 'denied' && (
                  <div className="bg-amber-50 border-l-4 border-amber-400 p-4">
                    <div className="flex items-center gap-3">
                      <FaSpinner className="text-amber-400 animate-spin" />
                      <p className="text-sm text-amber-700">Getting your location...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* ── CANCEL RIDE SECTION ── below the map ────────── */}
              {cancelledSuccess ? (
                <CancelSuccessBanner
                  refundPolicy={appliedRefundPolicy || getRefundPolicy(booking.status)}
                  booking={{ ...booking, totalPrice: resolvedTotal }}
                  onGoHome={() => navigate('/')}
                />
              ) : canCancel ? (
                <div style={{
                  background:'#fff',
                  border:'1.5px solid #fed7aa',
                  borderRadius:'16px',
                  padding:'18px 22px',
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'space-between',
                  gap:'16px',
                  flexWrap:'wrap',
                  boxShadow:'0 2px 12px rgba(234,88,12,0.06)',
                }}>
                  {/* Left: refund preview */}
                  <div style={{display:'flex',alignItems:'center',gap:'12px',flex:1,minWidth:'220px'}}>
                    <div style={{
                      width:'42px',height:'42px',borderRadius:'12px',
                      background:'linear-gradient(135deg, #fff7ed, #ffedd5)',
                      border:'1.5px solid #fdba74',
                      display:'flex',alignItems:'center',justifyContent:'center',
                      flexShrink:0,fontSize:'20px',
                    }}>
                      🛡️
                    </div>
                    <div>
                      <div style={{fontWeight:'700',fontSize:'13.5px',color:'#1c0a00'}}>
                        Need to cancel your ride?
                      </div>
                      <div style={{fontSize:'12px',color:'#9a3412',marginTop:'2px'}}>
                        {(() => {
                          const p = getRefundPolicy(booking.status);
                          return p.percentage > 0
                            ? `${p.percentage}% refund applies at this stage`
                            : 'No refund at this stage';
                        })()}
                        {' • '}
                        <span
                          style={{textDecoration:'underline',cursor:'pointer',color:'#ea580c'}}
                          onClick={() => setShowCancelModal(true)}
                        >
                          See policy
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: cancel button */}
                  <button
                    onClick={() => setShowCancelModal(true)}
                    style={{
                      padding:'11px 22px',
                      borderRadius:'12px',
                      border:'1.5px solid #fca5a5',
                      background:'linear-gradient(135deg, #fff5f5, #fee2e2)',
                      color:'#dc2626',
                      fontSize:'13px',
                      fontWeight:'700',
                      cursor:'pointer',
                      transition:'all 0.2s',
                      display:'flex',
                      alignItems:'center',
                      gap:'7px',
                      flexShrink:0,
                    }}
                    onMouseEnter={e=>{e.currentTarget.style.background='linear-gradient(135deg,#dc2626,#ef4444)';e.currentTarget.style.color='#fff';e.currentTarget.style.borderColor='#dc2626';}}
                    onMouseLeave={e=>{e.currentTarget.style.background='linear-gradient(135deg,#fff5f5,#fee2e2)';e.currentTarget.style.color='#dc2626';e.currentTarget.style.borderColor='#fca5a5';}}
                  >
                    <FaTimesCircle style={{fontSize:'14px'}}/>
                    Cancel Ride
                  </button>
                </div>
              ) : booking.status === 'completed' ? (
                <div style={{
                  background:'#f0fdf4',border:'1.5px solid #86efac',
                  borderRadius:'14px',padding:'14px 18px',
                  display:'flex',alignItems:'center',gap:'10px',
                }}>
                  <FaCheckCircle style={{color:'#16a34a',fontSize:'20px',flexShrink:0}}/>
                  <div>
                    <div style={{fontWeight:'700',fontSize:'13.5px',color:'#15803d'}}>Trip Completed</div>
                    <div style={{fontSize:'12px',color:'#166534'}}>We hope you had a great journey! 🎉</div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* ── Info Sidebar (right) ────────────────────────────── */}
            <div className="lg:col-span-1 space-y-4">
              {/* ETA Card */}
              {routeInfo && driverLocation && booking.status !== 'completed' && (
                <div style={{
                  background:'linear-gradient(135deg, #c2410c 0%, #ea580c 60%, #f97316 100%)',
                  borderRadius:'14px', padding:'20px 22px', color:'#fff',
                  boxShadow:'0 4px 20px rgba(234,88,12,0.3)',
                }}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Driver ETA</h3>
                    <FaClock className="text-2xl opacity-80" />
                  </div>
                  <div className="text-4xl font-extrabold mb-2">{routeInfo.estimatedTime} min</div>
                  <div className="flex items-center" style={{color:'#fed7aa'}}>
                    <FaRoute className="mr-2" />
                    <span>{routeInfo.distance} km away</span>
                  </div>
                  <div className="mt-3 text-xs" style={{color:'#fdba74'}}>
                    Updated {new Date(routeInfo.lastUpdated).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Driver Info Card */}
              {booking.driverName && (
                <div className="bg-white rounded-xl shadow-md p-5 border border-orange-100">
                  <h3 className="text-base font-bold mb-4 flex items-center text-gray-800">
                    <FaCar className="mr-2 text-orange-500" />
                    Your Driver
                  </h3>
                  
                  <div className="flex items-center mb-4">
                    {booking.driverPhotoURL ? (
                      <img src={booking.driverPhotoURL} alt={booking.driverName} className="w-14 h-14 rounded-full object-cover mr-3 border-2 border-orange-200" />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center mr-3">
                        <FaUser className="text-xl text-orange-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-base text-gray-900">{booking.driverName}</p>
                      {booking.driverRating && (
                        <div className="flex items-center text-yellow-500 mt-0.5">
                          <span className="mr-1 text-sm">⭐</span>
                          <span className="text-gray-700 text-sm font-medium">{booking.driverRating.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {booking.car && (
                    <div className="mb-3 text-sm">
                      <p className="text-gray-500">Vehicle</p>
                      <p className="font-semibold text-gray-800">{booking.car.name}</p>
                      {booking.vehicleNumber && <p className="text-gray-500">{booking.vehicleNumber}</p>}
                    </div>
                  )}

                  {booking.driverPhone && (
                    <a
                      href={`tel:${booking.driverPhone}`}
                      className="flex items-center justify-center w-full py-2.5 rounded-xl text-white font-semibold text-sm transition"
                      style={{background:'linear-gradient(135deg, #16a34a, #22c55e)', boxShadow:'0 3px 10px rgba(22,163,74,0.3)'}}
                    >
                      <FaPhone className="mr-2" />
                      Call Driver
                    </a>
                  )}
                </div>
              )}

              {/* Trip Details Card */}
              <div className="bg-white rounded-xl shadow-md p-5 border border-orange-100">
                <h3 className="text-base font-bold mb-4 text-gray-800">Trip Details</h3>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-xs text-gray-500">Pickup</p>
                      <p className="font-semibold text-sm text-gray-800">{booking.pickupCity}</p>
                    </div>
                  </div>
                  <div className="ml-1.5 border-l-2 border-orange-200 h-6"></div>
                  <div className="flex items-start">
                    <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3 flex-shrink-0"></div>
                    <div>
                      <p className="text-xs text-gray-500">Destination</p>
                      <p className="font-semibold text-sm text-gray-800">{booking.destinationCity}</p>
                    </div>
                  </div>

                  <div className="border-t border-orange-100 pt-3 mt-2">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Distance</p>
                        <p className="font-semibold">{booking.distance} km</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Duration</p>
                        <p className="font-semibold">{booking.days} Day{booking.days > 1 ? 's' : ''}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Passengers</p>
                        <p className="font-semibold">{booking.passengerCount}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Fare</p>
                        <p className="font-semibold text-orange-600">₹{resolvedTotal}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Timeline */}
              {booking.status && (
                <div className="bg-white rounded-xl shadow-md p-5 border border-orange-100">
                  <h3 className="text-base font-bold mb-4 text-gray-800">Trip Status</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Booking Confirmed',  active: ['searching_driver','driver_assigned','driver_on_way','driver_arrived','in_progress','completed'].includes(booking.status) },
                      { label: 'Driver Assigned',    active: ['driver_assigned','driver_on_way','driver_arrived','in_progress','completed'].includes(booking.status) },
                      { label: 'Driver On the Way',  active: ['driver_on_way','driver_arrived','in_progress','completed'].includes(booking.status) },
                      { label: 'Driver Arrived',     active: ['driver_arrived','in_progress','completed'].includes(booking.status) },
                      { label: 'Trip Started',       active: ['in_progress','completed'].includes(booking.status) },
                      { label: 'Trip Completed',     active: booking.status === 'completed' },
                    ].map(({ label, active }) => (
                      <div key={label} className={`flex items-center gap-3 text-sm ${active ? 'text-orange-600' : 'text-gray-300'}`}>
                        <FaCheckCircle className="flex-shrink-0" />
                        <span className={active ? 'font-medium' : ''}>{label}</span>
                      </div>
                    ))}
                    {booking.status === 'cancelled' && (
                      <div className="flex items-center gap-3 text-sm text-red-500">
                        <FaTimesCircle className="flex-shrink-0" />
                        <span className="font-medium">Ride Cancelled</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}