import React, { useState, useEffect } from "react";
import { useNotification } from "../../context/NotificationContext";
import { useUser } from "../../context/UserContext";
import { doc, getDoc, collection, query, where, onSnapshot, orderBy, updateDoc, serverTimestamp, writeBatch, arrayUnion } from "firebase/firestore";
import { db } from "../../config/firebase";
import Sidebar from "../../components/driver/Sidebar";

// Components
import HeaderHome from "../../components/HeaderHome";
import RideRequestCard from "./components/RideRequestCard";
import NextTripCard from "./components/NextTripCard";
import BookedTripsSection from "./components/BookedTripsSection";
import InterestedRoutesSection from "./components/InterestedRoutesSection";
import ProfileSettingsSection from "./components/ProfileSettingsSection";

// Background image path (must be in /public)
const backgroundImage = "/force-traveller-3350.jpg";

// Static data (can be moved to /data if you prefer)
const cities = [
  "Mumbai", "Pune", "Nagpur", "Nashik", "Sambhaji Nagar",
  "Thane", "Solapur", "Kolhapur", "Amravati", "Delhi",
  "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
  "Kolkata", "Surat", "Jaipur", "Lucknow",
];

const initialRoutes = [
  { id: 1, from: "Pune", to: "Mumbai", interested: "yes", rate: 3500 },
  { id: 2, from: "Pune", to: "Nashik", interested: "yes", rate: 4000 },
  { id: 3, from: "Pune", to: "Sambhaji Nagar", interested: "no", rate: 4500 },
];

const bookings = [
  { id: "PN-NSK-1023", date: "2025-09-17", trip: "Pune to Nashik" },
  { id: "PN-MUM-5811", date: "2025-09-22", trip: "Pune to Mumbai" },
  { id: "MUM-PN-0231", date: "2025-10-05", trip: "Mumbai to Pune" },
];

const bookedDates = ["2025-09-17", "2025-09-22", "2025-10-05"];

/* ---------- Utilities ---------- */
// Debounce utility (declared before useEffect)
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export default function DriverDashboard() {
  const { addNotification } = useNotification();
  const { user, loading } = useUser();

  // Sidebar open = mobile overlay; sidebarCollapsed = desktop narrow width
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [rideRequests, setRideRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // SSR-safe mobile state - init false, set in effect
  const [isMobile, setIsMobile] = useState(false);

  // Update mobile flag on resize (debounced)
  useEffect(() => {
    const handleResize = () => {
      const isMobileView = typeof window !== "undefined" ? window.innerWidth < 768 : false;
      setIsMobile(isMobileView);

      // Auto-close sidebar overlay when entering mobile
      if (isMobileView && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    const debounced = debounce(handleResize, 200);
    handleResize();
    window.addEventListener("resize", debounced);
    return () => window.removeEventListener("resize", debounced);
  }, [isSidebarOpen]);

  const toggleSidebar = () => setIsSidebarOpen((s) => !s);

  // Get current user data safely (from context or localStorage fallback)
  const storedUser = typeof window !== "undefined" ? localStorage.getItem(`user_${user?.uid}`) : null;
  const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
  const driverId = currentUser?.uid;
  
  // State for driver data
  const [driverData, setDriverData] = useState(null);
  
  // Fetch driver data from Firestore
  useEffect(() => {
    const fetchDriverData = async () => {
      if (!driverId) return;
      
      try {
        const userDoc = await getDoc(doc(db, "drivers", driverId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDriverData({
            name: data.name || data.displayName || currentUser?.displayName || 'Driver',
            email: data.email || currentUser?.email
          });
        } else {
          setDriverData({
            name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Driver',
            email: currentUser?.email
          });
        }
      } catch (error) {
        console.error("Error fetching driver data:", error);
        setDriverData({
          name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Driver',
          email: currentUser?.email
        });
      }
    };
    
    fetchDriverData();
  }, [driverId, currentUser]);
  
  const driverName = driverData?.name || 'Driver';

  // Debug logging when a user exists
  useEffect(() => {
    if (driverId) {
      console.log("Current user data:", currentUser);
      console.log("Available name fields:", {
        displayName: currentUser?.displayName,
        email: currentUser?.email
      });
    }
  }, [currentUser, driverId]);

  // Subscribe to incoming ride requests (both regular and holiday)
  useEffect(() => {
    if (!driverId) return;

    setIsLoading(true);
    const rideRequestsQuery = query(
      collection(db, "drivers", driverId, "incomingRequests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const holidayRequestsQuery = query(
      collection(db, "drivers", driverId, "holidayRequests"),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribeRideRequests = onSnapshot(rideRequestsQuery, 
      (querySnapshot) => {
        const requests = [];
        querySnapshot.forEach((doc) => {
          requests.push({ 
            id: doc.id, 
            ...doc.data(),
            type: 'ride',
            requestId: doc.id
          });
        });
    
    try {
      // Update the request status in the driver's incomingRequests first
      const requestRef = doc(db, "drivers", driverId, "incomingRequests", request.id);
      const bookingRef = doc(db, "bookings", request.bookingId);
      
      // First, update the incoming request to accepted
      await updateDoc(requestRef, { 
        status: "accepted",
        updatedAt: serverTimestamp()
      });
      
      // Then update the booking with driver info
      await updateDoc(bookingRef, {
        status: "accepted",
        driverId: driverId,
        driverName: driverName,
        updatedAt: serverTimestamp()
      });
      
      // Remove the request from local state
      setRideRequests(prev => prev.filter(req => req.id !== request.id));
      
      addNotification("Ride accepted successfully!", "success");
    } catch (error) {
      console.error("Error accepting ride:", error);
      
      // If the error is due to permissions, show a more specific message
      if (error.code === 'permission-denied') {
        addNotification("You don't have permission to accept this ride.", "error");
      } else {
        addNotification("Failed to accept ride. Please try again.", "error");
      }
    }
  };

  // Handle rejecting a ride request
  const handleRejectRide = async (request) => {
    if (!driverId || !request.bookingId) return;
    
    try {
      // First, update the request status in the driver's incomingRequests
      const requestRef = doc(db, "drivers", driverId, "incomingRequests", request.id);
      const bookingRef = doc(db, "bookings", request.bookingId);
      
      // Update the incoming request to rejected
      await updateDoc(requestRef, { 
        status: "rejected",
        updatedAt: serverTimestamp()
      });
      
      // Update the booking to track the rejection
      await updateDoc(bookingRef, {
        status: "driver_rejected",
        updatedAt: serverTimestamp(),
        rejectedBy: arrayUnion(driverId) // Track which drivers have rejected
      });
      
      // Remove the request from local state
      setRideRequests(prev => prev.filter(req => req.id !== request.id));
      
      addNotification("Ride request rejected.", "info");
    } catch (error) {
      console.error("Error rejecting ride:", error);
      
      // If the error is due to permissions, show a more specific message
      if (error.code === 'permission-denied') {
        addNotification("You don't have permission to reject this ride.", "error");
      } else {
        addNotification("Failed to reject ride. Please try again.", "error");
      }
    }
  };

  // Layout adjustments responsive to sidebar state:
  // - Desktop expanded: left margin = 16rem (w-64)
  // - Desktop collapsed: left margin = 5rem (w-20)
  // - Mobile: no left margin, overlay handled in Sidebar
  const containerClassNames = `flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out
    ${isMobile ? "ml-0" : isSidebarCollapsed ? "md:ml-20" : "md:ml-64"}`;

  // content padding (tweak to taste)
  const contentPadding = isMobile
    ? "px-3 sm:px-4 md:px-6"
    : "px-6";

  // Card width: maximum width constrained for content center
  const cardWidth = isMobile ? "w-full" : "w-full max-w-5xl";

  return (
    <div
      className="min-h-screen flex overflow-x-hidden relative"
      style={{
        backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Semi-transparent overlay */}
      <div className="absolute inset-0 bg-black/30 -z-0"></div>
      {/* Sidebar (handles its own overlay on mobile) */}
      <Sidebar
        isOpen={isSidebarOpen}
        onToggle={toggleSidebar}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Main content area */}
      <div className={containerClassNames}>
        

        <main className={`flex-1 ${contentPadding} transition-all duration-300 w-full overflow-x-hidden`}>
          <div className={`space-y-6 mt-4 mx-auto ${cardWidth} transition-all duration-300`}>
        
            {/* Ride Requests Section */}
            <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 transform hover:scale-[1.005]">
              <h2 className="text-xl font-semibold mb-4">Incoming Ride Requests</h2>
              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : rideRequests.length > 0 ? (
                <div className="space-y-4">
                  {rideRequests.map((request) => (
                    <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-gray-900">{request.from} → {request.to}</h3>
                          <p className="text-sm text-gray-500">Fare: ₹{request.fare}</p>
                          <p className="text-xs text-gray-400">
                            {request.createdAt?.toDate ? 
                              new Date(request.createdAt.toDate()).toLocaleString() : 
                              'Just now'}
                          </p>
                        </div>
                        <div className="flex space-x-2">
<button
                            onClick={() => handleAcceptRide(request)}
                            disabled={request.status !== 'pending'}
                            className={`px-3 py-1 text-sm rounded-md ${
                              request.status === 'pending' 
                                ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {request.status === 'accepted' ? 'Accepted' : 'Accept'}
                          </button>
                          <button
                            onClick={() => handleRejectRide(request)}
                            disabled={request.status !== 'pending'}
                            className={`px-3 py-1 text-sm rounded-md ${
                              request.status === 'pending' 
                                ? 'bg-red-100 text-red-800 hover:bg-red-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            {request.status === 'rejected' ? 'Rejected' : 'Reject'}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No pending ride requests at the moment.</p>
              )}
            </div>

            {/* Booked Trips Section */}
            <div className="transition-all duration-300 transform hover:scale-[1.005]">
              <BookedTripsSection bookings={bookings} bookedDates={bookedDates} />
            </div>

            {/* Interested Routes Section */}
            <div className="transition-all duration-300 transform hover:scale-[1.005]">
              {driverId ? (
                <InterestedRoutesSection
                  driverId={driverId}
                  initialRoutes={initialRoutes}
                  cities={cities}
                />
              ) : (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
                  <p>Please sign in to manage your routes.</p>
                </div>
              )}
            </div>

            {/* Profile Settings Section */}
            <div className="transition-all duration-300 transform hover:scale-[1.005]">
              <ProfileSettingsSection />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}



// import React, { useState, useEffect } from "react";
// import { useNotification } from "../../context/NotificationContext";
// import { useUser } from "../../context/UserContext";
// import {
//   doc,
//   getDoc,
//   collection,
//   query,
//   where,
//   onSnapshot,
//   orderBy,
//   updateDoc,
//   serverTimestamp,
//   arrayUnion,
// } from "firebase/firestore";
// import { db } from "../../config/firebase";
// import Sidebar from "../../components/driver/Sidebar";
// import HeaderHome from "../../components/HeaderHome";
// import BookedTripsSection from "./components/BookedTripsSection";
// import InterestedRoutesSection from "./components/InterestedRoutesSection";
// import ProfileSettingsSection from "./components/ProfileSettingsSection";

// const backgroundImage = "/force-traveller-3350.jpg";

// const cities = [
//   "Mumbai", "Pune", "Nagpur", "Nashik", "Sambhaji Nagar",
//   "Thane", "Solapur", "Kolhapur", "Amravati", "Delhi",
//   "Bengaluru", "Hyderabad", "Ahmedabad", "Chennai",
//   "Kolkata", "Surat", "Jaipur", "Lucknow",
// ];

// const initialRoutes = [
//   { id: 1, from: "Pune", to: "Mumbai", interested: "yes", rate: 3500 },
//   { id: 2, from: "Pune", to: "Nashik", interested: "yes", rate: 4000 },
//   { id: 3, from: "Pune", to: "Sambhaji Nagar", interested: "no", rate: 4500 },
// ];

// const bookings = [
//   { id: "PN-NSK-1023", date: "2025-09-17", trip: "Pune to Nashik" },
//   { id: "PN-MUM-5811", date: "2025-09-22", trip: "Pune to Mumbai" },
//   { id: "MUM-PN-0231", date: "2025-10-05", trip: "Mumbai to Pune" },
// ];

// const bookedDates = ["2025-09-17", "2025-09-22", "2025-10-05"];

// const debounce = (func, wait) => {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// };

// export default function DriverDashboard() {
//   const { addNotification } = useNotification();
//   const { user } = useUser();

//   const [isSidebarOpen, setIsSidebarOpen] = useState(false);
//   const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
//   const [rideRequests, setRideRequests] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [isMobile, setIsMobile] = useState(false);

//   const storedUser = typeof window !== "undefined" ? localStorage.getItem(`user_${user?.uid}`) : null;
//   const currentUser = user || (storedUser ? JSON.parse(storedUser) : null);
//   const driverId = currentUser?.uid;

//   const [driverData, setDriverData] = useState(null);
//   const [driverRoutes, setDriverRoutes] = useState([]);

//   useEffect(() => {
//     const handleResize = () => {
//       const isMobileView = typeof window !== "undefined" ? window.innerWidth < 768 : false;
//       setIsMobile(isMobileView);
//       if (isMobileView && isSidebarOpen) {
//         setIsSidebarOpen(false);
//       }
//     };
//     const debounced = debounce(handleResize, 200);
//     handleResize();
//     window.addEventListener("resize", debounced);
//     return () => window.removeEventListener("resize", debounced);
//   }, [isSidebarOpen]);

//   const toggleSidebar = () => setIsSidebarOpen((s) => !s);

//   useEffect(() => {
//     if (!driverId) return;
//     const fetchDriverData = async () => {
//       try {
//         const userDoc = await getDoc(doc(db, "drivers", driverId));
//         if (userDoc.exists()) {
//           const data = userDoc.data();
//           setDriverData({
//             name: data.name || data.displayName || currentUser?.displayName || "Driver",
//             email: data.email || currentUser?.email,
//           });
//         } else {
//           setDriverData({
//             name: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Driver",
//             email: currentUser?.email,
//           });
//         }
//       } catch (error) {
//         console.error("Error fetching driver data:", error);
//         setDriverData({
//           name: currentUser?.displayName || currentUser?.email?.split("@")[0] || "Driver",
//           email: currentUser?.email,
//         });
//       }
//     };
//     fetchDriverData();
//   }, [driverId, currentUser]);

//   const driverName = driverData?.name || "Driver";

//   useEffect(() => {
//     if (!driverId) return;

//     const fetchRoutes = async () => {
//       try {
//         const routesSnapshot = await getDoc(doc(db, "driverRoutes", driverId));
//         if (routesSnapshot.exists()) {
//           setDriverRoutes(routesSnapshot.data().routes);
//         } else {
//           setDriverRoutes(initialRoutes);
//         }
//       } catch (err) {
//         console.error("Error fetching driver routes:", err);
//         setDriverRoutes(initialRoutes);
//       }
//     };

//     fetchRoutes();
//   }, [driverId]);

//   useEffect(() => {
//     setIsLoading(true);
//     const q = query(
//       collection(db, "bookings"),
//       where("status", "==", "pending"),
//       orderBy("createdAt", "desc")
//     );

//     const unsubscribe = onSnapshot(
//       q,
//       (querySnapshot) => {
//         const requests = querySnapshot.docs.map((doc) => ({
//           id: doc.id,
//           ...doc.data(),
//         }));
//         setRideRequests(requests);
//         setIsLoading(false);
//       },
//       (error) => {
//         console.error("Error fetching bookings:", error);
//         addNotification("Failed to load ride requests", "error");
//         setIsLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [addNotification]);

//   const handleAcceptRide = async (request) => {
//     if (!driverId) return;
//     try {
//       const bookingRef = doc(db, "bookings", request.id);

//       await updateDoc(bookingRef, {
//         status: "accepted",
//         driverId: driverId,
//         driverName: driverName,
//         updatedAt: serverTimestamp(),
//       });

//       setRideRequests((prev) => prev.filter((req) => req.id !== request.id));
//       addNotification("Ride accepted successfully!", "success");
//     } catch (error) {
//       console.error("Error accepting ride:", error);
//       addNotification("Failed to accept ride. Please try again.", "error");
//     }
//   };

//   const handleRejectRide = async (request) => {
//     if (!driverId) return;
//     try {
//       const bookingRef = doc(db, "bookings", request.id);

//       await updateDoc(bookingRef, {
//         status: "driver_rejected",
//         updatedAt: serverTimestamp(),
//         rejectedBy: arrayUnion(driverId),
//       });

//       setRideRequests((prev) => prev.filter((req) => req.id !== request.id));
//       addNotification("Ride request rejected.", "info");
//     } catch (error) {
//       console.error("Error rejecting ride:", error);
//       addNotification("Failed to reject ride. Please try again.", "error");
//     }
//   };

//   const containerClassNames = `flex-1 min-w-0 flex flex-col transition-all duration-300 ease-in-out ${
//     isMobile ? "ml-0" : isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
//   }`;

//   const contentPadding = isMobile ? "px-3 sm:px-4 md:px-6" : "px-6";
//   const cardWidth = isMobile ? "w-full" : "w-full max-w-5xl";

//   return (
//     <div
//       className="min-h-screen bg-gray-50 flex overflow-x-hidden"
//       style={{
//         backgroundImage: `url(${backgroundImage})`,
//         backgroundSize: "cover",
//         backgroundPosition: "center",
//       }}
//     >
//       <Sidebar
//         isOpen={isSidebarOpen}
//         onToggle={toggleSidebar}
//         onCollapseChange={setIsSidebarCollapsed}
//       />

//       <div className={containerClassNames}>
//         <HeaderHome index_Current={0} onMenuClick={toggleSidebar} driverName={driverName} />

//         <main
//           className={`flex-1 ${contentPadding} transition-all duration-300 w-full overflow-x-hidden`}
//         >
//           <div className={`space-y-6 mt-4 mx-auto ${cardWidth} transition-all duration-300`}>
//             <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 transform hover:scale-[1.01]">
//               <div className="flex justify-between items-center">
//                 <div>
//                   <h1 className="text-2xl font-bold text-gray-800">Welcome back, {driverName}</h1>
//                   <p className="text-gray-600">Here's what's happening with your trips today</p>
//                 </div>
//               </div>
//             </div>

//             {/* Incoming Ride Requests - FIXED VERSION */}
//             <div className="bg-white rounded-lg shadow p-6 transition-all duration-300 transform hover:scale-[1.005]">
//               <h2 className="text-xl font-semibold mb-4">Incoming Ride Requests</h2>
//               {isLoading ? (
//                 <div className="flex justify-center items-center h-32">
//                   <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//                 </div>
//               ) : rideRequests.filter(request =>
//                 driverRoutes.some(
//                   route =>
//                     route.from === request.from &&
//                     route.to === request.to
//                 )
//               ).length > 0 ? (
//                 <div className="space-y-4">
//                   {rideRequests.filter(request =>
//                     driverRoutes.some(
//                       route =>
//                         route.from === request.from &&
//                         route.to === request.to
//                     )
//                   ).map((request) => {
//                     const matchesDriverSublocality = driverRoutes.some(
//                       route =>
//                         route.from === request.from &&
//                         route.to === request.to &&
//                         (!route.fromSublocality || route.fromSublocality === request.fromSublocality) &&
//                         (!route.toSublocality || route.toSublocality === request.toSublocality)
//                     );

//                     return (
//                       <div 
//                         key={request.id} 
//                         className={`border rounded-lg p-4 transition-all ${
//                           matchesDriverSublocality 
//                             ? 'bg-green-50 border-green-300 hover:bg-green-100' 
//                             : 'hover:bg-gray-50'
//                         }`}
//                       >
//                         <div className="flex justify-between items-start">
//                           <div className="flex-1">
//                             {matchesDriverSublocality && (
//                               <div className="inline-block bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-full mb-2">
//                                 ⭐ RECOMMENDED FOR YOU
//                               </div>
//                             )}

//                             <h3 className="font-medium text-gray-900 text-lg">
//                               {request.from} → {request.to}
//                             </h3>

//                             {request.fromSublocality && (
//                               <div className="mt-2 bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
//                                 <p className="text-sm font-semibold text-blue-800">
//                                   📍 Pickup Area: {request.fromSublocality}
//                                 </p>
//                                 {request.pickupSublocalityAddress && (
//                                   <p className="text-xs text-blue-600 mt-1">
//                                     {request.pickupSublocalityAddress}
//                                   </p>
//                                 )}
//                               </div>
//                             )}

//                             {request.toSublocality && (
//                               <div className="mt-2 bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
//                                 <p className="text-sm font-semibold text-orange-800">
//                                   🏁 Drop Area: {request.toSublocality}
//                                 </p>
//                                 {request.destinationSublocalityAddress && (
//                                   <p className="text-xs text-orange-600 mt-1">
//                                     {request.destinationSublocalityAddress}
//                                   </p>
//                                 )}
//                               </div>
//                             )}

//                             <div className="mt-3 space-y-1">
//                               <p className="text-sm text-gray-600">
//                                 <strong>Vehicle:</strong> {request.carName || 'Standard'}
//                               </p>
//                               <p className="text-sm text-gray-600">
//                                 <strong>Passengers:</strong> {request.passengerCount || 1}
//                               </p>
//                               {request.distance && (
//                                 <p className="text-sm text-gray-600">
//                                   <strong>Distance:</strong> {request.distance} km
//                                 </p>
//                               )}
//                               {request.days && request.days > 1 && (
//                                 <p className="text-sm text-gray-600">
//                                   <strong>Days:</strong> {request.days}
//                                 </p>
//                               )}
//                               <p className="text-sm font-bold text-green-600">
//                                 💰 Fare: ₹{request.fare || request.price}
//                               </p>
//                               <p className="text-xs text-gray-400">
//                                 {request.createdAt?.toDate
//                                   ? new Date(request.createdAt.toDate()).toLocaleString()
//                                   : "Just now"}
//                               </p>
//                             </div>
//                           </div>

//                           <div className="flex flex-col space-y-2 ml-4">
//                             <button
//                               onClick={() => handleAcceptRide(request)}
//                               disabled={request.status !== "pending"}
//                               className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
//                                 request.status === "pending"
//                                   ? "bg-green-600 text-white hover:bg-green-700 shadow-md hover:shadow-lg"
//                                   : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                               }`}
//                             >
//                               {request.status === "accepted" ? "✓ Accepted" : "Accept"}
//                             </button>
//                             <button
//                               onClick={() => handleRejectRide(request)}
//                               disabled={request.status !== "pending"}
//                               className={`px-4 py-2 text-sm font-semibold rounded-md transition-all ${
//                                 request.status === "pending"
//                                   ? "bg-red-600 text-white hover:bg-red-700 shadow-md hover:shadow-lg"
//                                   : "bg-gray-100 text-gray-400 cursor-not-allowed"
//                               }`}
//                             >
//                               {request.status === "rejected" ? "✗ Rejected" : "Reject"}
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     );
//                   })}
//                 </div>
//               ) : (
//                 <p className="text-gray-500 text-center py-4">No pending ride requests at the moment.</p>
//               )}
//             </div>

//             <div className="transition-all duration-300 transform hover:scale-[1.005]">
//               <BookedTripsSection bookings={bookings} bookedDates={bookedDates} />
//             </div>

//             <div className="transition-all duration-300 transform hover:scale-[1.005]">
//               {driverId ? (
//                 <InterestedRoutesSection
//                   driverId={driverId}
//                   initialRoutes={initialRoutes}
//                   cities={cities}
//                 />
//               ) : (
//                 <div className="text-gray-500">Driver routes not available</div>
//               )}
//             </div>

//             <div className="transition-all duration-300 transform hover:scale-[1.005]">
//               <ProfileSettingsSection driverData={driverData} />
//             </div>
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }