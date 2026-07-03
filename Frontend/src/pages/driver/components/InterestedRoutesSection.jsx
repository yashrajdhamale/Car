// import React, { useState, useEffect } from "react";
// import {
//   setDoc,
//   onSnapshot,
//   doc,
//   arrayUnion,
//   arrayRemove,
//   serverTimestamp,
//   deleteField
// } from "firebase/firestore";
// import { db } from "../../../config/firebase";
// import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';

// export default function InterestedRoutesSection({ driverId, cities }) {
//   const [routes, setRoutes] = useState([]);
//   const [newRoute, setNewRoute] = useState({ from: "", to: "" });
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const [successMessage, setSuccessMessage] = useState("");
  
//   // Listen for changes directly on the driver's document
//   useEffect(() => {
//     if (!driverId) {
//       setError("Driver ID is missing.");
//       setLoading(false);
//       return;
//     }

//     setLoading(true);
//     const driverRef = doc(db, "drivers", driverId);
    
//     const unsubscribe = onSnapshot(driverRef, 
//       (docSnap) => {
//         if (docSnap.exists()) {
//           // Get the assignedRoutes array, or an empty array if it doesn't exist
//           setRoutes(docSnap.data().assignedRoutes || []);
//         } else {
//           setError("Driver document not found.");
//         }
//         setLoading(false);
//       },
//       (err) => {
//         console.error("Error fetching driver document:", err);
//         setError(`Failed to load routes: ${err.message}`);
//         setLoading(false);
//       }
//     );

//     return () => unsubscribe();
//   }, [driverId]);

//   // Add a new route to the driver's assignedRoutes array
//   const handleAddRoute = async (e) => {
//     e.preventDefault();
//     if (!newRoute.from || !newRoute.to) {
//       setError("Please select both departure and arrival cities.");
//       return;
//     }
//     if (newRoute.from === newRoute.to) {
//       setError("Departure and arrival cities must be different.");
//       return;
//     }

//     // The route object to be added
//     const routeToAdd = {
//       from: newRoute.from,
//       to: newRoute.to,
//       // You can add more fields here if needed in the future
//     };

//     try {
//       const driverRef = doc(db, "drivers", driverId);
//       // Use setDoc with merge: true to create the document if it doesn't exist
//       await setDoc(driverRef, {
//         assignedRoutes: arrayUnion(routeToAdd),
//         updatedAt: serverTimestamp()
//       }, { merge: true });

//       setSuccessMessage("Route added successfully!");
//       setNewRoute({ from: "", to: "" }); // Reset form
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (err) {
//       console.error("Error adding route:", err);
//       setError(`Failed to add route: ${err.message}`);
//     }
//   };
  
//   // Delete a route from the driver's assignedRoutes array
//   const deleteRoute = async (routeToDelete) => {
//     if (!window.confirm("Are you sure you want to delete this route?")) return;
//     try {
//       const driverRef = doc(db, "drivers", driverId);
//       // Use arrayRemove to delete the route from the array
//       await updateDoc(driverRef, {
//         assignedRoutes: arrayRemove(routeToDelete)
//       });
//       setSuccessMessage("Route deleted successfully!");
//       setTimeout(() => setSuccessMessage(""), 3000);
//     } catch (err) {
//       console.error("Error deleting route:", err);
//       setError("Failed to delete route. Please try again.");
//     }
//   };

//   return (
//     <div className="bg-white p-6 rounded-lg shadow">
//       <h2 className="text-xl font-semibold mb-4">My Interested Routes</h2>

//       {/* Error and Success Messages */}
//       {error && (
//         <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
//           {error}
//           <button onClick={() => setError("")} className="absolute top-0 bottom-0 right-0 px-4 py-3">
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//       )}
//       {successMessage && (
//         <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
//           {successMessage}
//            <button onClick={() => setSuccessMessage("")} className="absolute top-0 bottom-0 right-0 px-4 py-3">
//             <X className="h-4 w-4" />
//           </button>
//         </div>
//       )}

//       {/* Add Route Form */}
//       <form onSubmit={handleAddRoute} className="mb-8 bg-gray-50 p-4 rounded-lg">
//         <h3 className="text-lg font-medium mb-4">Add New Route</h3>
//         <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
//             <select value={newRoute.from} onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
//               <option value="">Select city</option>
//               {cities.map(city => <option key={`from-${city}`} value={city}>{city}</option>)}
//             </select>
//           </div>

//           <div className="md:col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
//             <select value={newRoute.to} onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" required>
//               <option value="">Select city</option>
//               {cities.map(city => <option key={`to-${city}`} value={city}>{city}</option>)}
//             </select>
//           </div>

//           <div className="md:col-span-1 flex items-end">
//             <button type="submit" className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center w-full">
//               <Plus className="h-5 w-5 mr-1" /> Add Route
//             </button>
//           </div>
//         </div>
//       </form>

//       {/* Routes List */}
//       <div className="overflow-x-auto">
//         {loading ? (
//           <div className="text-center py-8">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
//             <p className="mt-2 text-gray-600">Loading your routes...</p>
//           </div>
//         ) : routes.length === 0 ? (
//           <div className="text-center py-8 bg-gray-50 rounded-lg">
//             <p className="text-gray-600">No routes found.</p>
//             <p className="text-sm text-gray-500 mt-1">Add your first route using the form above</p>
//           </div>
//         ) : (
//           <table className="min-w-full divide-y divide-gray-200">
//             <thead className="bg-gray-50">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
//                 <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
//               </tr>
//             </thead>
//             <tbody className="bg-white divide-y divide-gray-200">
//               {routes.map((route, index) => (
//                 <tr key={`${route.from}-${route.to}-${index}`}>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="text-sm font-medium text-gray-900">
//                       {route.from} → {route.to}
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
//                     <button
//                       onClick={() => deleteRoute(route)}
//                       className="text-red-600 hover:text-red-900"
//                     >
//                       <Trash2 className="h-5 w-5" />
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         )}
//       </div>
//     </div>
//   );
// }


import React, { useState, useEffect } from "react";
import {
  setDoc,
  onSnapshot,
  doc,
  arrayUnion,
  arrayRemove,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Trash2, X, Plus } from 'lucide-react';

export default function InterestedRoutesSection({ driverId, cities = [] }) {
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({ from: "", to: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  // Listen for changes directly on the driver's document
  useEffect(() => {
    if (!driverId) {
      setError("Driver ID is missing.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const driverRef = doc(db, "drivers", driverId);
    
    const unsubscribe = onSnapshot(driverRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          // Get the assignedRoutes array, or an empty array if it doesn't exist
          setRoutes(docSnap.data().assignedRoutes || []);
        } else {
          setError("Driver document not found.");
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching driver document:", err);
        setError(`Failed to load routes: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driverId]);

  // Add a new route to the driver's assignedRoutes array
  const handleAddRoute = async (e) => {
    e.preventDefault();
    if (!newRoute.from || !newRoute.to) {
      setError("Please select both departure and arrival cities.");
      return;
    }
    if (newRoute.from === newRoute.to) {
      setError("Departure and arrival cities must be different.");
      return;
    }

    // The route object to be added
    const routeToAdd = {
      from: newRoute.from,
      to: newRoute.to,
    };

    try {
      const driverRef = doc(db, "drivers", driverId);
      // Use setDoc with merge: true to create the document if it doesn't exist
      await setDoc(driverRef, {
        assignedRoutes: arrayUnion(routeToAdd),
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSuccessMessage("Route added successfully!");
      setNewRoute({ from: "", to: "" }); // Reset form
      setError(""); // Clear any existing errors
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error adding route:", err);
      setError(`Failed to add route: ${err.message}`);
    }
  };
  
  // Delete a route from the driver's assignedRoutes array
  const deleteRoute = async (routeToDelete) => {
    if (!window.confirm("Are you sure you want to delete this route?")) return;
    try {
      const driverRef = doc(db, "drivers", driverId);
      // Use arrayRemove to delete the route from the array
      await updateDoc(driverRef, {
        assignedRoutes: arrayRemove(routeToDelete)
      });
      setSuccessMessage("Route deleted successfully!");
      setError(""); // Clear any existing errors
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      console.error("Error deleting route:", err);
      setError("Failed to delete route. Please try again.");
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-4">My Interested Routes</h2>

      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
          {error}
          <button onClick={() => setError("")} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {successMessage && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4">
          {successMessage}
           <button onClick={() => setSuccessMessage("")} className="absolute top-0 bottom-0 right-0 px-4 py-3">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Add Route Form */}
      <form onSubmit={handleAddRoute} className="mb-8 bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-medium mb-4">Add New Route</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">From *</label>
            <select 
              value={newRoute.from} 
              onChange={(e) => setNewRoute({ ...newRoute, from: e.target.value })} 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              required
            >
              <option value="">Select city</option>
              {cities && cities.length > 0 ? (
                cities.map(city => <option key={`from-${city}`} value={city}>{city}</option>)
              ) : (
                <option disabled>No cities available</option>
              )}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">To *</label>
            <select 
              value={newRoute.to} 
              onChange={(e) => setNewRoute({ ...newRoute, to: e.target.value })} 
              className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
              required
            >
              <option value="">Select city</option>
              {cities && cities.length > 0 ? (
                cities.map(city => <option key={`to-${city}`} value={city}>{city}</option>)
              ) : (
                <option disabled>No cities available</option>
              )}
            </select>
          </div>

          <div className="md:col-span-1 flex items-end">
            <button 
              type="submit" 
              className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700 flex items-center justify-center w-full disabled:bg-gray-400 disabled:cursor-not-allowed"
              disabled={!cities || cities.length === 0}
            >
              <Plus className="h-5 w-5 mr-1" /> Add Route
            </button>
          </div>
        </div>
        {(!cities || cities.length === 0) && (
          <p className="text-sm text-amber-600 mt-2">⚠️ No cities available. Please contact admin to set up cities.</p>
        )}
      </form>

      {/* Routes List */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading your routes...</p>
          </div>
        ) : routes.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-600">No routes found.</p>
            <p className="text-sm text-gray-500 mt-1">Add your first route using the form above</p>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Route</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {routes.map((route, index) => (
                <tr key={`${route.from}-${route.to}-${index}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {route.from} → {route.to}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => deleteRoute(route)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete route"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}