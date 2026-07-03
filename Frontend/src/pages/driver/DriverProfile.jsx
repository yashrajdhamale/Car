import React, { useState, useEffect, useContext } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { UserContext } from '@/context/UserContext';
import DriverLayout from '@/components/driver/DriverLayout';
import { toast } from 'react-toastify';

const DriverProfile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [user] = useAuthState(auth);
  const { userData } = useContext(UserContext);
  
  const [driverData, setDriverData] = useState({
    name: '',
    email: '',
    phone: '',
    licenseNumber: '',
    vehicle: {
      make: '',
      model: '',
      year: '',
      color: '',
      licensePlate: ''
    },
    address: '',
    joinedDate: ''
  });

  const [formData, setFormData] = useState({ ...driverData });

  useEffect(() => {
    const fetchDriverData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const driverDoc = await getDoc(doc(db, 'drivers', user.uid));
        
        if (driverDoc.exists()) {
          const data = driverDoc.data();
          const newDriverData = {
            name: data.fullName || data.displayName || `${data.firstName || ''} ${data.lastName || ''}`.trim() || 'Driver',
            email: data.email || user.email || '',
            phone: data.phoneNumber || data.phone || '',
            licenseNumber: data.licenseNumber || '',
            vehicle: {
              make: data.vehicle?.make || '',
              model: data.vehicle?.model || '',
              year: data.vehicle?.year || '',
              color: data.vehicle?.color || '',
              licensePlate: data.vehicle?.licensePlate || ''
            },
            address: data.address || '',
            joinedDate: data.createdAt?.toDate?.().toLocaleDateString() || 'N/A'
          };
          
          setDriverData(newDriverData);
          setFormData(newDriverData);
        }
      } catch (error) {
        console.error('Error fetching driver data:', error);
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchDriverData();
  }, [user]);

  if (loading) {
    return (
      <DriverLayout>
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </DriverLayout>
    );
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('vehicle.')) {
      const vehicleField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        vehicle: {
          ...prev.vehicle,
          [vehicleField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setDriverData(formData);
    setIsEditing(false);
    // In a real app, you would save to an API here
  };

  const InputField = ({ label, name, value, type = 'text', required = true, ...props }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={handleInputChange}
        disabled={!isEditing}
        className={`w-full px-3 py-2 border ${isEditing ? 'border-gray-300' : 'border-transparent bg-gray-100'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
        {...props}
      />
    </div>
  );

  return (
    <DriverLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">My Profile</h1>
          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Edit Profile
            </button>
          ) : (
            <div className="space-x-2">
              <button
                onClick={() => {
                  setFormData(driverData);
                  setIsEditing(false);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Driver Information</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Personal details and contact information</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b">Personal Information</h4>
                <InputField label="Full Name" name="name" value={formData.name} />
                <InputField label="Email Address" name="email" type="email" value={formData.email} />
                <InputField label="Phone Number" name="phone" type="tel" value={formData.phone} />
                <InputField label="Driver's License" name="licenseNumber" value={formData.licenseNumber} />
                <InputField label="Address" name="address" value={formData.address} />
              </div>
              
              <div>
                <h4 className="text-md font-medium text-gray-900 mb-4 pb-2 border-b">Vehicle Information</h4>
                <InputField label="Make" name="vehicle.make" value={formData.vehicle.make} />
                <InputField label="Model" name="vehicle.model" value={formData.vehicle.model} />
                <InputField label="Year" name="vehicle.year" value={formData.vehicle.year} />
                <InputField label="Color" name="vehicle.color" value={formData.vehicle.color} />
                <InputField label="License Plate" name="vehicle.licensePlate" value={formData.vehicle.licensePlate} />
              </div>
            </div>
            
            {isEditing && (
              <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setFormData(driverData);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </DriverLayout>
  );
};

export default DriverProfile;
