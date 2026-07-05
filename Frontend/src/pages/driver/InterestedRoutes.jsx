// intetested routes 

// export default InterestedRoutes;
import React, { useState, useEffect } from 'react';
import { useAuthState } from '../../router';
import { auth } from '../../config/firebase';
import DriverLayout from '../../components/driver/DriverLayout';
import {
  addRoute,
  deleteRoute,
  subscribeToCities,
  subscribeToRoutes,
  updateRoute,
} from '../../services/firestoreService';

// Sample cities for autocomplete
const sampleCities = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Ahmedabad',
  'Chennai', 'Kolkata', 'Surat', 'Pune', 'Jaipur',
  'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Shimla', 'Manali', 'Udaipur'
];

const InterestedRoutes = () => {
  const { userData } = useAuthState();
  const currentUser = auth.currentUser;
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    from: '',
    to: '',
    rate: '',
    isActive: true
  });

  // Fetch routes for the current driver
  useEffect(() => {
    if (!currentUser?.uid) {
      setLoading(false); // FIX: don't hang if no user
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRoutes(currentUser.uid, (routesList) => {
      setRoutes(routesList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.from.trim() || !formData.to.trim()) {
      setError('Please fill in both From City and To City.');
      return;
    }

    if (formData.from.trim().toLowerCase() === formData.to.trim().toLowerCase()) {
      setError('From City and To City cannot be the same.');
      return;
    }

    // FIX: validate rate — parseFloat('') = NaN which Firestore rejects
    const parsedRate = formData.rate !== '' ? parseFloat(formData.rate) : null;
    if (formData.rate !== '' && (isNaN(parsedRate) || parsedRate < 0)) {
      setError('Please enter a valid positive number for Rate.');
      return;
    }

    try {
      const routeData = {
        from: formData.from.trim(),
        to: formData.to.trim(),
        rate: parsedRate,
        driverName: userData?.fullName || currentUser.email?.split('@')[0] || 'Driver',
        active: true,
        vehicle: {
          type: 'Sedan',
          capacity: 4
        },
        radiusKm: 30,
      };

      console.log('Adding route with data:', routeData);
      const routeId = await addRoute(currentUser.uid, routeData);
      console.log('Route added with ID:', routeId);

      // Reset form
      setFormData({ from: '', to: '', rate: '', isActive: true });
      setSuccess('Route added successfully!');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error adding route:', err.code, err.message);
      // FIX: show specific error so developer can diagnose
      if (err.code === 'permission-denied') {
        setError('Permission denied. Check your Firestore security rules for the "routes" collection.');
      } else if (err.code === 'invalid-argument') {
        setError('Invalid data submitted. Please check your inputs (e.g., rate must be a valid number).');
      } else {
        setError(`Failed to add route: ${err.message}`);
      }
    }
  };

  const toggleRouteStatus = async (routeId, currentStatus) => {
    setError('');
    try {
      await updateRoute(currentUser.uid, routeId, {
        active: !currentStatus,
      });
    } catch (err) {
      console.error('Error updating route status:', err.code, err.message);
      setError('Failed to update route status. Please try again.');
    }
  };

  const handleDelete = async (routeId) => {
    if (!window.confirm('Are you sure you want to delete this route?')) return;
    setError('');
    try {
      await deleteRoute(routeId);
      setSuccess('Route deleted successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error deleting route:', err.code, err.message);
      setError('Failed to delete route. Please try again.');
    }
  };

  // Format date safely (createdAt may be null if just written with serverTimestamp)
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Just now';
    try {
      return timestamp.toDate().toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric'
      });
    } catch {
      return 'Unknown date';
    }
  };

  return (
    <DriverLayout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">My Interested Routes</h1>

        {/* Error Banner */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded flex justify-between items-start">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-4 text-red-500 hover:text-red-700 font-bold">✕</button>
          </div>
        )}

        {/* Success Banner */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded flex justify-between items-center">
            <span>{success}</span>
            <button onClick={() => setSuccess('')} className="ml-4 text-green-500 hover:text-green-700 font-bold">✕</button>
          </div>
        )}

        {/* Add New Route Form */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Add New Route</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="from"
                  value={formData.from}
                  onChange={handleInputChange}
                  list="cities"
                  placeholder="e.g., Mumbai"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="to"
                  value={formData.to}
                  onChange={handleInputChange}
                  list="cities"
                  placeholder="e.g., Pune"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate (Optional)
                </label>
                <input
                  type="number"
                  name="rate"
                  value={formData.rate}
                  onChange={handleInputChange}
                  placeholder="e.g., 1500"
                  min="0"
                  step="any"
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                Add Route
              </button>
            </div>
          </form>

          <datalist id="cities">
            {sampleCities.map((city, index) => (
              <option key={index} value={city} />
            ))}
          </datalist>
        </div>

        {/* Routes List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold">My Routes</h2>
            {!loading && routes.length > 0 && (
              <span className="text-sm text-gray-500">{routes.length} route{routes.length !== 1 ? 's' : ''}</span>
            )}
          </div>

          {loading ? (
            <div className="p-10 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-3 text-gray-500">Loading routes...</p>
            </div>
          ) : routes.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <p className="font-medium">No routes added yet</p>
              <p className="text-sm mt-1">Add your first route using the form above.</p>
            </div>
          ) : (
            <div className="divide-y">
              {routes.map((route) => (
                <div
                  key={route.id}
                  className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors"
                >
                  <div>
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="font-semibold text-gray-800">{route.from}</span>
                      <span className="text-gray-400 font-bold">→</span>
                      <span className="font-semibold text-gray-800">{route.to}</span>
                      {route.rate != null && (
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                          ₹{route.rate.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Added: {formatDate(route.createdAt)}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => toggleRouteStatus(route.id, route.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        route.isActive
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {route.isActive ? '● Active' : '○ Inactive'}
                    </button>

                    <button
                      onClick={() => handleDelete(route.id)}
                      className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors focus:outline-none"
                      title="Delete route"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DriverLayout>
  );
};

export default InterestedRoutes;
