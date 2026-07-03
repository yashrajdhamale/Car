import React, { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  doc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../config/firebase";
import { Pencil, Trash2, Check, X, Plus } from 'lucide-react';

export default function HolidayRoutesSection({ driverId }) {
  const [routes, setRoutes] = useState([]);
  const [newRoute, setNewRoute] = useState({ 
    state: "",
    packageName: "",
    isActive: true 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [editingId, setEditingId] = useState(null);

  // Fetch holiday routes in realtime from 'holidayRoutes' collection
  useEffect(() => {
    if (!driverId) {
      setError("Driver ID is missing. Please sign in again.");
      setLoading(false);
      return;
    }

    setLoading(true);
    const routesQuery = query(
      collection(db, "holidayRoutes"),
      where("driverId", "==", driverId),
      orderBy("createdAt", "desc")
    );
    
    const unsubscribe = onSnapshot(routesQuery, 
      (snapshot) => {
        const driverRoutes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          isActive: doc.data().isActive !== false // Default to true if not set
        }));
        setRoutes(driverRoutes);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching holiday routes:", err);
        setError(`Failed to load holiday routes: ${err.message}`);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [driverId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRoute(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddOrUpdateRoute = async (e) => {
    e.preventDefault();
    
    if (!newRoute.state || !newRoute.packageName) {
      setError("Please fill in all fields.");
      return;
    }

    const routeData = {
      state: newRoute.state.trim(),
      packageName: newRoute.packageName.trim(),
      isActive: newRoute.isActive,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        // Update existing route
        const routeRef = doc(db, "holidayRoutes", editingId);
        await updateDoc(routeRef, routeData);
        setSuccessMessage("Holiday route updated successfully!");
      } else {
        // Add new route
        await addDoc(collection(db, "holidayRoutes"), {
          ...routeData,
          driverId,
          createdAt: serverTimestamp(),
        });
        setSuccessMessage("Holiday route added successfully!");
      }
      handleCancelEdit();
    } catch (err) {
      console.error("Error saving holiday route:", err);
      setError(`Failed to save holiday route: ${err.message}`);
    }
  };

  const handleEditRoute = (route) => {
    setNewRoute({
      state: route.state || "",
      packageName: route.packageName || "",
      isActive: route.isActive !== false
    });
    setEditingId(route.id);
  };

  const handleDeleteRoute = async (id) => {
    if (window.confirm("Are you sure you want to delete this holiday route?")) {
      try {
        await deleteDoc(doc(db, "holidayRoutes", id));
        setSuccessMessage("Holiday route deleted successfully!");
      } catch (err) {
        console.error("Error deleting holiday route:", err);
        setError(`Failed to delete holiday route: ${err.message}`);
      }
    }
  };

  const handleCancelEdit = () => {
    setNewRoute({ 
      state: "",
      packageName: "",
      isActive: true 
    });
    setEditingId(null);
    setError("");
  };

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Holiday Routes</h3>
        <button
          onClick={handleCancelEdit}
          className="flex items-center gap-1 text-sm bg-blue-500 text-white px-3 py-1 rounded"
        >
          <Plus size={16} /> Add New
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleAddOrUpdateRoute} className="space-y-4 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
            <input
              type="text"
              name="state"
              value={newRoute.state}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Goa"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Package Name</label>
            <input
              type="text"
              name="packageName"
              value={newRoute.packageName}
              onChange={handleInputChange}
              className="w-full p-2 border rounded"
              placeholder="e.g., Beach Package"
            />
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              name="isActive"
              checked={newRoute.isActive}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {editingId ? 'Update' : 'Add'} Route
            </button>
          </div>
        </div>
      </form>

      <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Package</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center">Loading...</td>
              </tr>
            ) : routes.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                  No holiday routes found. Add your first route to get started.
                </td>
              </tr>
            ) : (
              routes.map((route) => (
                <tr key={route.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {route.state || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {route.packageName || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      route.isActive !== false 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {route.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditRoute(route)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title="Edit"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteRoute(route.id)}
                      className="text-red-600 hover:text-red-900"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
