

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { getAuth } from 'firebase/auth';
// import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
// import { db } from '../config/firebase';
// import { toast } from 'react-toastify';

// const UserDashboard = () => {
//   const navigate = useNavigate();
//   const auth = getAuth();
//   const user = auth.currentUser;

//   const [bookings, setBookings] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [activeTab, setActiveTab] = useState('active');
//   const [unsubscribe, setUnsubscribe] = useState(null);

//   useEffect(() => {
//     if (!user) {
//       navigate('/login');
//       return;
//     }
    
//     console.log('👤 User ID:', user.uid);
//     console.log('📧 User Email:', user.email);
//     console.log('🔍 Setting up real-time listener...');
    
//     setupRealTimeListener();
    
//     return () => {
//       if (unsubscribe) {
//         console.log('🧹 Cleaning up listener');
//         unsubscribe();
//       }
//     };
//   }, [user]);

//   const setupRealTimeListener = () => {
//     if (!user?.uid) return;
    
//     try {
//       console.log('🔍 Checking airportTransfers collection for user rides...');
      
//       // IMPORTANT: Check airportTransfers collection (where rides are actually saved)
//       const airportTransfersRef = collection(db, 'airportTransfers');
      
//       // Try to find rides by userId OR userEmail
//       const q = query(
//         airportTransfersRef,
//         where('userId', '==', user.uid),
//         orderBy('createdAt', 'desc')
//       );
      
//       const unsubscribeListener = onSnapshot(q, (snapshot) => {
//         const updatedBookings = [];
        
//         console.log('📥 Firestore snapshot size:', snapshot.size);
        
//         snapshot.forEach(doc => {
//           const data = doc.data();
//           console.log('📄 Document found:', {
//             id: doc.id,
//             userId: data.userId,
//             userEmail: data.userEmail,
//             customerEmail: data.customerEmail,
//             status: data.status,
//             pickup: data.pickupLocation || data.pickup,
//             dropoff: data.dropoffLocation || data.dropoff,
//             fare: data.fareAmount || data.totalFare || data.fare
//           });
          
//           // Map the data to match your component's expected format
//           const mappedBooking = {
//             id: doc.id,
//             ...data,
//             // Map fields to match your component
//             pickup: data.pickupLocation || data.pickup,
//             dropoff: data.dropoffLocation || data.dropoff,
//             fare: data.fareAmount || data.totalFare || data.fare || 0,
//             fareAmount: data.fareAmount || data.totalFare || data.fare || 0,
//             vehicleDetails: {
//               name: data.vehicleType || data.vehicleModel || 'Car'
//             },
//             vehicleModel: data.vehicleModel || data.vehicleType || 'Car',
//             driverName: data.driverName,
//             driverPhone: data.driverPhone,
//             status: data.status || 'unknown',
//             paymentStatus: data.paymentStatus || 'pending',
//             createdAt: data.createdAt || data.bookedAt || new Date(),
//             updatedAt: data.updatedAt || new Date(),
//             isActive: data.status && !['cancelled', 'completed'].includes(data.status.toLowerCase())
//           };
          
//           updatedBookings.push(mappedBooking);
//         });
        
//         console.log('✅ Total bookings found:', updatedBookings.length);
        
//         // If no bookings found by userId, try by email
//         if (updatedBookings.length === 0) {
//           console.log('🔍 No bookings by userId, trying by email...');
//           setupEmailBasedListener();
//           return;
//         }
        
//         // Sort bookings: active first, then by date
//         const sortedBookings = [...updatedBookings].sort((a, b) => {
//           const aIsActive = !['cancelled', 'completed'].includes(a.status?.toLowerCase());
//           const bIsActive = !['cancelled', 'completed'].includes(b.status?.toLowerCase());
          
//           if (aIsActive && !bIsActive) return -1;
//           if (!aIsActive && bIsActive) return 1;
          
//           const aDate = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
//           const bDate = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
//           return bDate - aDate;
//         });
        
//         setBookings(sortedBookings);
//         setLoading(false);
        
//         // Show notification
//         if (updatedBookings.length > 0) {
//           const activeRides = updatedBookings.filter(b => 
//             b.status && !['cancelled', 'completed'].includes(b.status.toLowerCase())
//           );
//           if (activeRides.length > 0) {
//             toast.info(`🚗 You have ${activeRides.length} active ride${activeRides.length > 1 ? 's' : ''}`, {
//               autoClose: 3000
//             });
//           } else {
//             toast.success(`✅ Loaded ${updatedBookings.length} ride${updatedBookings.length > 1 ? 's' : ''}`, {
//               autoClose: 2000
//             });
//           }
//         }
        
//       }, (error) => {
//         console.error('❌ Airport transfers listener error:', error);
        
//         // Try alternative listener
//         setupEmailBasedListener();
//       });
      
//       setUnsubscribe(() => unsubscribeListener);
      
//     } catch (error) {
//       console.error('❌ Error setting up airport transfers listener:', error);
//       setupEmailBasedListener();
//     }
//   };

//   const setupEmailBasedListener = () => {
//     if (!user?.email) {
//       console.error('❌ No user email available');
//       toast.error('Failed to load rides');
//       setLoading(false);
//       return;
//     }
    
//     console.log('📧 Setting up listener by email:', user.email);
    
//     try {
//       const airportTransfersRef = collection(db, 'airportTransfers');
//       const q = query(
//         airportTransfersRef,
//         where('userEmail', '==', user.email),
//         orderBy('createdAt', 'desc')
//       );
      
//       const unsubscribeListener = onSnapshot(q, (snapshot) => {
//         const updatedBookings = [];
        
//         console.log('📥 Email-based snapshot size:', snapshot.size);
        
//         snapshot.forEach(doc => {
//           const data = doc.data();
//           console.log('📄 Email-based document:', {
//             id: doc.id,
//             userEmail: data.userEmail,
//             customerEmail: data.customerEmail,
//             status: data.status
//           });
          
//           const mappedBooking = {
//             id: doc.id,
//             ...data,
//             pickup: data.pickupLocation || data.pickup,
//             dropoff: data.dropoffLocation || data.dropoff,
//             fare: data.fareAmount || data.totalFare || data.fare || 0,
//             fareAmount: data.fareAmount || data.totalFare || data.fare || 0,
//             vehicleDetails: {
//               name: data.vehicleType || data.vehicleModel || 'Car'
//             },
//             status: data.status || 'unknown',
//             paymentStatus: data.paymentStatus || 'pending',
//             createdAt: data.createdAt || data.bookedAt || new Date(),
//             updatedAt: data.updatedAt || new Date(),
//             isActive: data.status && !['cancelled', 'completed'].includes(data.status.toLowerCase())
//           };
          
//           updatedBookings.push(mappedBooking);
//         });
        
//         console.log('✅ Email-based bookings found:', updatedBookings.length);
        
//         if (updatedBookings.length === 0) {
//           // Try one more time with customerEmail
//           setupCustomerEmailListener();
//           return;
//         }
        
//         setBookings(updatedBookings);
//         setLoading(false);
        
//         if (updatedBookings.length > 0) {
//           toast.success(`✅ Found ${updatedBookings.length} ride${updatedBookings.length > 1 ? 's' : ''} by email`, {
//             autoClose: 2000
//           });
//         }
        
//       }, (error) => {
//         console.error('❌ Email-based listener error:', error);
//         setupCustomerEmailListener();
//       });
      
//       setUnsubscribe(() => unsubscribeListener);
      
//     } catch (error) {
//       console.error('❌ Error setting up email listener:', error);
//       setupCustomerEmailListener();
//     }
//   };

//   const setupCustomerEmailListener = () => {
//     if (!user?.email) {
//       console.error('❌ No user email for customerEmail check');
//       toast.info('No rides found. Book your first ride!');
//       setLoading(false);
//       return;
//     }
    
//     console.log('👤 Setting up listener by customerEmail:', user.email);
    
//     try {
//       const airportTransfersRef = collection(db, 'airportTransfers');
//       const q = query(
//         airportTransfersRef,
//         where('customerEmail', '==', user.email),
//         orderBy('createdAt', 'desc')
//       );
      
//       const unsubscribeListener = onSnapshot(q, (snapshot) => {
//         const updatedBookings = [];
        
//         console.log('📥 CustomerEmail snapshot size:', snapshot.size);
        
//         snapshot.forEach(doc => {
//           const data = doc.data();
//           console.log('📄 CustomerEmail document:', {
//             id: doc.id,
//             customerEmail: data.customerEmail,
//             status: data.status
//           });
          
//           const mappedBooking = {
//             id: doc.id,
//             ...data,
//             pickup: data.pickupLocation || data.pickup,
//             dropoff: data.dropoffLocation || data.dropoff,
//             fare: data.fareAmount || data.totalFare || data.fare || 0,
//             fareAmount: data.fareAmount || data.totalFare || data.fare || 0,
//             vehicleDetails: {
//               name: data.vehicleType || data.vehicleModel || 'Car'
//             },
//             status: data.status || 'unknown',
//             paymentStatus: data.paymentStatus || 'pending',
//             createdAt: data.createdAt || data.bookedAt || new Date(),
//             updatedAt: data.updatedAt || new Date(),
//             isActive: data.status && !['cancelled', 'completed'].includes(data.status.toLowerCase())
//           };
          
//           updatedBookings.push(mappedBooking);
//         });
        
//         console.log('✅ CustomerEmail bookings found:', updatedBookings.length);
        
//         setBookings(updatedBookings);
//         setLoading(false);
        
//         if (updatedBookings.length > 0) {
//           toast.success(`✅ Found ${updatedBookings.length} ride${updatedBookings.length > 1 ? 's' : ''}`, {
//             autoClose: 2000
//           });
//         } else {
//           toast.info('🚗 No rides found. Book your first ride!', {
//             autoClose: 3000
//           });
//         }
        
//       }, (error) => {
//         console.error('❌ CustomerEmail listener error:', error);
//         toast.info('No rides found. Book your first ride!');
//         setLoading(false);
//       });
      
//       setUnsubscribe(() => unsubscribeListener);
      
//     } catch (error) {
//       console.error('❌ Error setting up customerEmail listener:', error);
//       toast.info('No rides found. Book your first ride!');
//       setLoading(false);
//     }
//   };

//   // Rest of your functions remain the same...
//   const formatDate = (timestamp) => {
//     if (!timestamp) return 'N/A';
//     try {
//       const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
//       return date.toLocaleDateString([], {
//         day: 'numeric',
//         month: 'short',
//         year: 'numeric',
//         hour: '2-digit',
//         minute: '2-digit'
//       });
//     } catch {
//       return 'N/A';
//     }
//   };

//   const formatAddress = (location) => {
//     if (!location) return 'N/A';
//     if (typeof location === 'string') return location;
//     if (location.name) return location.name;
//     if (location.address) return location.address;
//     if (location.lat && location.lng) return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
//     return 'Location specified';
//   };

//   const getStatusColor = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'completed': return 'bg-green-100 text-green-800';
//       case 'cancelled': return 'bg-red-100 text-red-800';
//       case 'accepted': return 'bg-blue-100 text-blue-800';
//       case 'in_progress': return 'bg-purple-100 text-purple-800';
//       case 'driver_arrived': return 'bg-yellow-100 text-yellow-800';
//       case 'pending': return 'bg-gray-100 text-gray-800';
//       case 'searching_driver': return 'bg-orange-100 text-orange-800';
//       default: return 'bg-gray-100 text-gray-800';
//     }
//   };

//   const getStatusText = (status) => {
//     switch (status?.toLowerCase()) {
//       case 'completed': return '✅ Completed';
//       case 'cancelled': return '❌ Cancelled';
//       case 'accepted': return '✅ Driver Assigned';
//       case 'in_progress': return '🏁 Ride in Progress';
//       case 'driver_arrived': return '🚗 Driver Arrived';
//       case 'pending': return '⏳ Pending';
//       case 'searching_driver': return '🔍 Searching Driver';
//       default: return status?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown';
//     }
//   };

//   const filteredBookings = bookings.filter(booking => {
//     const status = booking.status?.toLowerCase();
    
//     if (activeTab === 'active') {
//       return !['cancelled', 'completed'].includes(status);
//     } else if (activeTab === 'completed') {
//       return status === 'completed';
//     } else if (activeTab === 'cancelled') {
//       return status === 'cancelled';
//     } else if (activeTab === 'history') {
//       return true;
//     }
//     return true;
//   });

//   const stats = {
//     total: bookings.length,
//     active: bookings.filter(b => {
//       const status = b.status?.toLowerCase();
//       return status && !['cancelled', 'completed'].includes(status);
//     }).length,
//     completed: bookings.filter(b => b.status?.toLowerCase() === 'completed').length,
//     cancelled: bookings.filter(b => b.status?.toLowerCase() === 'cancelled').length
//   };

//   const handleTrackRide = (booking) => {
//     navigate('/track-ride', {
//       state: {
//         bookingId: booking.id,
//         bookingDetails: booking
//       }
//     });
//   };

//   const handleViewDetails = (booking) => {
//     navigate('/booking-details', { 
//       state: { bookingId: booking.id }
//     });
//   };

//   const handleBookAgain = (booking) => {
//     navigate('/local-pickup', {
//       state: {
//         pickup: booking.pickup,
//         dropoff: booking.dropoff,
//         vehicleDetails: booking.vehicleDetails,
//         travelDate: booking.travelDate,
//         hour: booking.hour,
//         minute: booking.minute
//       }
//     });
//   };

//   const handleCancelRide = async (booking) => {
//     if (window.confirm('Are you sure you want to cancel this ride?')) {
//       try {
//         toast.success('Ride cancellation requested successfully!');
//       } catch (error) {
//         toast.error('Failed to cancel ride');
//       }
//     }
//   };

//   const isTrackableStatus = (status) => {
//     return ['accepted', 'driver_arrived', 'in_progress', 'searching_driver'].includes(status?.toLowerCase());
//   };

//   const isCancellableStatus = (status) => {
//     return ['pending', 'searching_driver', 'accepted', 'driver_arrived'].includes(status?.toLowerCase());
//   };

//   const refreshRides = () => {
//     toast.info('Refreshing rides...');
//     setLoading(true);
//     setupRealTimeListener();
//   };

//   if (loading) {
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
//         <div className="text-center">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
//           <p className="text-gray-600 font-medium">Loading your rides...</p>
//           <p className="text-gray-500 text-sm">Checking airport transfers database</p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-gray-50 pt-16">
//       {/* Header */}
//       <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
//         <div className="max-w-6xl mx-auto">
//           <div className="flex items-center justify-between">
//             <button
//               onClick={() => navigate(-1)}
//               className="p-2 rounded-full hover:bg-gray-100"
//             >
//               <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
//               </svg>
//             </button>
//             <h1 className="text-lg font-bold text-gray-900">My Rides</h1>
//             <button
//               onClick={refreshRides}
//               className="p-2 rounded-full hover:bg-gray-100"
//             >
//               <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
//               </svg>
//             </button>
//           </div>
//           <div className="text-center mt-2">
//             <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
//               ✈️ Airport Transfers Database
//             </span>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-6xl mx-auto px-4 py-6">
//         {/* Welcome Section */}
//         <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6">
//           <div className="flex items-center justify-between">
//             <div>
//               <h2 className="text-xl font-bold mb-1">Welcome back!</h2>
//               <p className="opacity-90">{user?.email || 'User'}</p>
//             </div>
//             <div className="text-right">
//               <p className="text-2xl font-bold">{stats.total}</p>
//               <p className="text-sm opacity-90">Total Rides</p>
//             </div>
//           </div>
          
//           {stats.active > 0 ? (
//             <div className="mt-4 bg-white/20 p-3 rounded-lg">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
//                 <div className="flex-1">
//                   <p className="font-semibold">You have {stats.active} active ride{stats.active > 1 ? 's' : ''}!</p>
//                   <p className="text-sm opacity-90">Track your rides in real-time</p>
//                 </div>
//               </div>
//             </div>
//           ) : stats.total > 0 ? (
//             <div className="mt-4 bg-white/20 p-3 rounded-lg">
//               <div className="flex items-center">
//                 <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
//                 <div className="flex-1">
//                   <p className="font-semibold">You have {stats.total} ride{stats.total > 1 ? 's' : ''} in history</p>
//                   <p className="text-sm opacity-90">View your ride history below</p>
//                 </div>
//               </div>
//             </div>
//           ) : null}
//         </div>

//         {/* Quick Stats */}
//         <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
//           <div className="flex justify-between items-center mb-3">
//             <h3 className="font-bold text-gray-900">Ride Statistics</h3>
//             <div className="flex items-center text-sm">
//               <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
//               <span className="text-green-600 font-medium">Live Updates</span>
//             </div>
//           </div>
//           <div className="grid grid-cols-4 gap-3">
//             <div className="text-center">
//               <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
//               <p className="text-xs text-gray-500">Total</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-green-600">{stats.active}</p>
//               <p className="text-xs text-gray-500">Active</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
//               <p className="text-xs text-gray-500">Completed</p>
//             </div>
//             <div className="text-center">
//               <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
//               <p className="text-xs text-gray-500">Cancelled</p>
//             </div>
//           </div>
//         </div>

//         {/* Tabs */}
//         <div className="bg-white rounded-xl shadow-sm mb-6">
//           <div className="flex border-b overflow-x-auto">
//             {['active', 'completed', 'cancelled', 'history'].map((tab) => (
//               <button
//                 key={tab}
//                 onClick={() => setActiveTab(tab)}
//                 className={`flex-1 min-w-[80px] py-3 text-center font-medium text-sm ${
//                   activeTab === tab
//                     ? 'text-blue-600 border-b-2 border-blue-600'
//                     : 'text-gray-600 hover:text-gray-900'
//                 }`}
//               >
//                 {tab === 'active' && `Active (${stats.active})`}
//                 {tab === 'completed' && `Completed (${stats.completed})`}
//                 {tab === 'cancelled' && `Cancelled (${stats.cancelled})`}
//                 {tab === 'history' && `All History (${stats.total})`}
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Bookings List */}
//         <div className="space-y-4">
//           {filteredBookings.length === 0 ? (
//             <div className="bg-white rounded-xl shadow-sm p-8 text-center">
//               <div className="text-gray-400 mb-4">
//                 <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
//                 </svg>
//               </div>
//               <h3 className="text-lg font-semibold text-gray-700 mb-2">
//                 {activeTab === 'active' && 'No Active Rides'}
//                 {activeTab === 'completed' && 'No Completed Rides'}
//                 {activeTab === 'cancelled' && 'No Cancelled Rides'}
//                 {activeTab === 'history' && 'No Ride History'}
//               </h3>
//               <p className="text-gray-500 mb-4">
//                 {activeTab === 'active' && 'Book a new ride to get started!'}
//                 {activeTab !== 'active' && 'Your ride history will appear here'}
//               </p>
//               {activeTab === 'active' && (
//                 <button
//                   onClick={() => navigate('/local-pickup')}
//                   className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
//                 >
//                   Book New Ride
//                 </button>
//               )}
//             </div>
//           ) : (
//             filteredBookings.map((booking) => (
//               <div key={booking.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-blue-200 transition-colors">
//                 {/* Real-time indicator for active rides */}
//                 {booking.status && !['cancelled', 'completed'].includes(booking.status.toLowerCase()) && (
//                   <div className="flex items-center mb-2">
//                     <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
//                     <span className="text-xs text-green-600 font-medium">Live Updates</span>
//                   </div>
//                 )}
                
//                 {/* Booking Header */}
//                 <div className="flex justify-between items-start mb-3">
//                   <div>
//                     <div className="flex items-center gap-2 mb-1">
//                       <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(booking.status)}`}>
//                         {getStatusText(booking.status)}
//                       </span>
//                       {booking.paymentStatus === 'paid' && (
//                         <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
//                           PAID
//                         </span>
//                       )}
//                     </div>
//                     <p className="text-xs text-gray-500">
//                       {formatDate(booking.createdAt)}
//                       {booking.updatedAt && booking.updatedAt !== booking.createdAt && (
//                         <span className="ml-2 text-blue-500">
//                           Updated: {formatDate(booking.updatedAt)}
//                         </span>
//                       )}
//                     </p>
//                   </div>
//                   <p className="text-lg font-bold text-gray-900">
//                     ₹{booking.fare || booking.fareAmount || '0'}
//                   </p>
//                 </div>

//                 {/* Route Info */}
//                 <div className="space-y-2 mb-4">
//                   <div className="flex items-start">
//                     <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
//                     <div className="flex-1">
//                       <p className="text-xs text-gray-500">From</p>
//                       <p className="text-sm font-medium line-clamp-1">
//                         {formatAddress(booking.pickup)}
//                       </p>
//                     </div>
//                   </div>
//                   <div className="flex items-start">
//                     <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
//                     <div className="flex-1">
//                       <p className="text-xs text-gray-500">To</p>
//                       <p className="text-sm font-medium line-clamp-1">
//                         {formatAddress(booking.dropoff)}
//                       </p>
//                     </div>
//                   </div>
//                 </div>

//                 {/* Vehicle & Driver Info */}
//                 <div className="grid grid-cols-2 gap-3 mb-4">
//                   <div className="bg-gray-50 p-2 rounded-lg">
//                     <p className="text-xs text-gray-500">Vehicle</p>
//                     <p className="text-sm font-medium truncate">
//                       {booking.vehicleDetails?.name || booking.vehicleModel || booking.vehicleType || 'Car'}
//                     </p>
//                   </div>
//                   {booking.driverName && (
//                     <div className="bg-gray-50 p-2 rounded-lg">
//                       <p className="text-xs text-gray-500">Driver</p>
//                       <p className="text-sm font-medium truncate">{booking.driverName}</p>
//                       {booking.driverPhone && (
//                         <p className="text-xs text-gray-400 truncate">{booking.driverPhone}</p>
//                       )}
//                     </div>
//                   )}
//                 </div>

//                 {/* Actions */}
//                 <div className="flex gap-2">
//                   {/* TRACK RIDE BUTTON */}
//                   {isTrackableStatus(booking.status) && (
//                     <button
//                       onClick={() => handleTrackRide(booking)}
//                       className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//                       </svg>
//                       Track
//                     </button>
//                   )}
                  
//                   {/* CANCEL BUTTON */}
//                   {isCancellableStatus(booking.status) && (
//                     <button
//                       onClick={() => handleCancelRide(booking)}
//                       className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                       </svg>
//                       Cancel
//                     </button>
//                   )}
                  
//                   {/* BOOK AGAIN BUTTON */}
//                   {booking.status?.toLowerCase() === 'completed' && (
//                     <button
//                       onClick={() => handleBookAgain(booking)}
//                       className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
//                     >
//                       <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//                       </svg>
//                       Book Again
//                     </button>
//                   )}
                  
//                   {/* VIEW DETAILS BUTTON */}
//                   <button
//                     onClick={() => handleViewDetails(booking)}
//                     className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
//                   >
//                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
//                     </svg>
//                     Details
//                   </button>
//                 </div>
//               </div>
//             ))
//           )}
//         </div>

//         {/* Quick Actions */}
//         <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
//           <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
//           <div className="grid grid-cols-2 gap-3">
//             <button
//               onClick={() => navigate('/local-pickup')}
//               className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
//               </svg>
//               Book New Ride
//             </button>
//             <button
//               onClick={() => navigate('/support')}
//               className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center"
//             >
//               <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
//               </svg>
//               Help & Support
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default UserDashboard;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { toast } from 'react-toastify';
import RealTimeService from '../services/realTimeService';

const UserDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const user = auth.currentUser;

  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    console.log('👤 User:', user.email);
    console.log('📊 Setting up real-time ride listeners...');
    
    // Setup real-time listener for all rides
    const unsubscribe = RealTimeService.subscribeToAllRides((allRides) => {
      console.log('📥 Received rides:', allRides.length);
      setRides(allRides);
      setLoading(false);
      
      // Show notification
      const activeRides = allRides.filter(r => r.isActive);
      if (activeRides.length > 0) {
        toast.info(`🚗 You have ${activeRides.length} active ride${activeRides.length > 1 ? 's' : ''}`, {
          autoClose: 3000
        });
      } else if (allRides.length > 0) {
        toast.success(`✅ Loaded ${allRides.length} ride${allRides.length > 1 ? 's' : ''}`, {
          autoClose: 2000
        });
      }
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
      RealTimeService.cleanup();
    };
  }, [user]);

  // Helper functions (same as before, with small updates)
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString([], {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'N/A';
    }
  };

  const formatAddress = (location) => {
    if (!location) return 'N/A';
    if (typeof location === 'string') return location;
    if (location.name) return location.name;
    if (location.address) return location.address;
    if (location.lat && location.lng) return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    return 'Location specified';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'accepted': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-purple-100 text-purple-800';
      case 'driver_arrived': return 'bg-yellow-100 text-yellow-800';
      case 'pending': return 'bg-gray-100 text-gray-800';
      case 'searching_driver': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return '✅ Completed';
      case 'cancelled': return '❌ Cancelled';
      case 'accepted': return '✅ Driver Assigned';
      case 'in_progress': return '🏁 Ride in Progress';
      case 'driver_arrived': return '🚗 Driver Arrived';
      case 'pending': return '⏳ Pending';
      case 'searching_driver': return '🔍 Searching Driver';
      default: return status?.replace(/_/g, ' ')?.toUpperCase() || 'Unknown';
    }
  };

  const filteredRides = rides.filter(ride => {
    const status = ride.status?.toLowerCase();
    
    if (activeTab === 'active') {
      return !['cancelled', 'completed'].includes(status);
    } else if (activeTab === 'completed') {
      return status === 'completed';
    } else if (activeTab === 'cancelled') {
      return status === 'cancelled';
    } else if (activeTab === 'history') {
      return true;
    }
    return true;
  });

  const stats = {
    total: rides.length,
    active: rides.filter(r => r.isActive).length,
    completed: rides.filter(r => r.status?.toLowerCase() === 'completed').length,
    cancelled: rides.filter(r => r.status?.toLowerCase() === 'cancelled').length
  };

  // Get ride type badge
  const getRideTypeBadge = (ride) => {
    if (ride.collectionType === 'airportTransfers') {
      return (
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
          ✈️ Airport
        </span>
      );
    } else {
      return (
        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded ml-2">
          🚗 Local
        </span>
      );
    }
  };

  const handleTrackRide = (ride) => {
    navigate('/track-ride', {
      state: {
        bookingId: ride.id,
        bookingDetails: ride
      }
    });
  };

  const handleViewDetails = (ride) => {
    navigate('/booking-details', { 
      state: { 
        bookingId: ride.id,
        collectionType: ride.collectionType 
      }
    });
  };

  const refreshRides = () => {
    toast.info('Refreshing rides...');
    setLoading(true);
    RealTimeService.cleanup();
    
    // Re-establish connection
    const unsubscribe = RealTimeService.subscribeToAllRides((allRides) => {
      setRides(allRides);
      setLoading(false);
    });
    
    return () => unsubscribe();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 pt-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading your rides...</p>
          <p className="text-gray-500 text-sm">Checking both collections</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      {/* Header - Updated */}
      <div className="bg-white shadow-sm px-4 py-3 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-lg font-bold text-gray-900">My Rides</h1>
            <button
              onClick={refreshRides}
              className="p-2 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <div className="text-center mt-2">
            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
              ✈️ Airport Transfers
            </span>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
              🚗 Local Rides
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Welcome Section */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold mb-1">Welcome back!</h2>
              <p className="opacity-90">{user?.email || 'User'}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold">{stats.total}/20</p>
              <p className="text-sm opacity-90">Last 20 Rides</p>
            </div>
          </div>
          
          {stats.active > 0 ? (
            <div className="mt-4 bg-white/20 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-3"></div>
                <div className="flex-1">
                  <p className="font-semibold">You have {stats.active} active ride{stats.active > 1 ? 's' : ''}!</p>
                  <p className="text-sm opacity-90">Track your rides in real-time</p>
                </div>
              </div>
            </div>
          ) : stats.total > 0 ? (
            <div className="mt-4 bg-white/20 p-3 rounded-lg">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-400 rounded-full mr-3"></div>
                <div className="flex-1">
                  <p className="font-semibold">You have {stats.total} ride{stats.total > 1 ? 's' : ''} in history</p>
                  <p className="text-sm opacity-90">Last 20 rides shown automatically</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-bold text-gray-900">Ride Statistics</h3>
            <div className="flex items-center text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
              <span className="text-green-600 font-medium">Live Updates</span>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
              <p className="text-xs text-gray-500">Completed</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              <p className="text-xs text-gray-500">Cancelled</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b overflow-x-auto">
            {['active', 'completed', 'cancelled', 'history'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 min-w-[80px] py-3 text-center font-medium text-sm ${
                  activeTab === tab
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab === 'active' && `Active (${stats.active})`}
                {tab === 'completed' && `Completed (${stats.completed})`}
                {tab === 'cancelled' && `Cancelled (${stats.cancelled})`}
                {tab === 'history' && `All Rides (${stats.total})`}
              </button>
            ))}
          </div>
        </div>

        {/* Rides List */}
        <div className="space-y-4">
          {filteredRides.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-8 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.801 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.801 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {activeTab === 'active' && 'No Active Rides'}
                {activeTab === 'completed' && 'No Completed Rides'}
                {activeTab === 'cancelled' && 'No Cancelled Rides'}
                {activeTab === 'history' && 'No Ride History'}
              </h3>
              <p className="text-gray-500 mb-4">
                {activeTab === 'active' && 'Book a new ride to get started!'}
                {activeTab !== 'active' && 'Your ride history will appear here'}
              </p>
              <button
                onClick={() => navigate('/local-pickup')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Book New Ride
              </button>
            </div>
          ) : (
            filteredRides.map((ride) => (
              <div key={ride.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 hover:border-blue-200 transition-colors">
                {/* Ride type indicator */}
                <div className="flex items-center justify-between mb-2">
                  {ride.isActive && (
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                      <span className="text-xs text-green-600 font-medium">Live Updates</span>
                    </div>
                  )}
                  {getRideTypeBadge(ride)}
                </div>
                
                {/* Ride Header */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(ride.status)}`}>
                        {getStatusText(ride.status)}
                      </span>
                      {ride.isPaid ? (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          PAID: ₹{ride.fare || ride.fareAmount || ride.price || '0'}
                        </span>
                      ) : (
                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          PENDING
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">
                      {formatDate(ride.createdAt)}
                      {ride.updatedAt && ride.updatedAt !== ride.createdAt && (
                        <span className="ml-2 text-blue-500">
                          Updated: {formatDate(ride.updatedAt)}
                        </span>
                      )}
                    </p>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    ₹{ride.fare || ride.fareAmount || ride.price || '0'}
                  </p>
                </div>

                {/* Route Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">From</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {formatAddress(ride.pickup)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3"></div>
                    <div className="flex-1">
                      <p className="text-xs text-gray-500">To</p>
                      <p className="text-sm font-medium line-clamp-1">
                        {formatAddress(ride.dropoff)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Vehicle & Driver Info */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 p-2 rounded-lg">
                    <p className="text-xs text-gray-500">Vehicle</p>
                    <p className="text-sm font-medium truncate">
                      {ride.vehicleDetails?.name || ride.vehicleType || 'Car'}
                      {ride.vehicleDetails?.capacity && (
                        <span className="text-xs text-gray-500 ml-1">({ride.vehicleDetails.capacity} seats)</span>
                      )}
                    </p>
                  </div>
                  {ride.driverName && (
                    <div className="bg-gray-50 p-2 rounded-lg">
                      <p className="text-xs text-gray-500">Driver</p>
                      <p className="text-sm font-medium truncate">{ride.driverName}</p>
                      {ride.driverPhone && (
                        <p className="text-xs text-gray-400 truncate">{ride.driverPhone}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions - Same as before */}
                <div className="flex gap-2">
                  {ride.isActive && (
                    <button
                      onClick={() => handleTrackRide(ride)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Track
                    </button>
                  )}
                  
                  {ride.isActive && ['pending', 'searching_driver', 'accepted'].includes(ride.status?.toLowerCase()) && (
                    <button
                      onClick={() => handleCancelRide(ride)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Cancel
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleViewDetails(ride)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-medium text-sm flex items-center justify-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Details
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-4 mt-6">
          <h3 className="font-bold text-gray-900 mb-3">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/local-pickup')}
              className="bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Book New Ride
            </button>
            <button
              onClick={() => navigate('/support')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-medium flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Help & Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;