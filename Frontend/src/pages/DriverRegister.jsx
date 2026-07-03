import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../config/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { FaCar, FaUser, FaPhone, FaIdCard, FaMapMarkerAlt } from 'react-icons/fa';
import { addNotification } from '../utils/notifications';

const DriverRegister = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    watch
  } = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      vehicleModel: '',
      vehicleNumber: '',
      vehicleType: '',
      vehicleColor: '',
      address: '',
      city: '',
      state: '',
      pincode: ''
    }
  });

  const onSubmit = async (formData) => {
    try {
      setIsSubmitting(true);
      setError('');
      
      // Debug: Log the raw form data
      console.log('Raw form data:', JSON.stringify(formData, null, 2));
      
      // Validate required fields
      if (!formData.firstName || !formData.lastName || !formData.phone) {
        throw new Error('Required fields are missing');
      }

      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const user = userCredential.user;
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      // 2. Update user profile
      await updateProfile(user, {
        displayName: fullName,
      });

      // 3. Prepare driver data for Firestore
      const driverData = {
        uid: user.uid,
        email: formData.email,
        displayName: fullName,
        fullName: fullName,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        phoneNumber: formData.phone,
        role: 'driver',
        status: 'pending',
        isDriver: true,
        address: formData.address || '',
        city: formData.city || '',
        state: formData.state || '',
        pincode: formData.pincode || '',
        vehicle: {
          model: formData.vehicleModel || '',
          number: formData.vehicleNumber || '',
          type: formData.vehicleType || '',
          color: formData.vehicleColor || ''
        },
        licenseNumber: formData.licenseNumber || '',
        rating: 5, // Default rating for new drivers
        totalRides: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        emailVerified: false
      };

      // Debug: Log the driver data before saving
      console.log('Saving to Firestore:', JSON.stringify(driverData, null, 2));
      
      // Validate driverData before spreading
      if (!driverData || typeof driverData !== 'object') {
        throw new Error('Invalid driver data structure');
      }
      
      // Save to users collection
      await setDoc(doc(db, 'users', user.uid), driverData);
      
      // 4. Add to drivers collection for easy querying
      console.log('Preparing drivers collection data...');
      const driversCollectionData = {
        ...driverData,
        currentLocation: null,
        isAvailable: true,
        lastActive: serverTimestamp()
      };
      console.log('Drivers collection data:', JSON.stringify(driversCollectionData, null, 2));
      
      await setDoc(doc(db, 'drivers', user.uid), driversCollectionData);

      addNotification('Driver registration successful!', 'success');
      navigate('/driver/dashboard');
      
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed. Please try again.');
      addNotification(error.message || 'Registration failed', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-extrabold text-gray-900">Become a Driver</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join our team of professional drivers and start earning today!
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-md">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FaUser className="mr-2 text-orange-500" />
                Personal Information
              </h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="firstName"
                      {...register('firstName', { required: 'First name is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last name *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="lastName"
                      {...register('lastName', { required: 'Last name is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email address *
                  </label>
                  <div className="mt-1">
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      {...register('email', { required: 'Email is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                    Phone number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9]{10}$/,
                          message: 'Please enter a valid 10-digit phone number'
                        }
                      })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="9876543210"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-4">
                  <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
                    Driver's License Number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="licenseNumber"
                      {...register('licenseNumber', { required: 'License number is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.licenseNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.licenseNumber.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FaCar className="mr-2 text-orange-500" />
                Vehicle Information
              </h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="vehicleModel" className="block text-sm font-medium text-gray-700">
                    Vehicle Model *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="vehicleModel"
                      {...register('vehicleModel', { required: 'Vehicle model is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., Honda City"
                    />
                    {errors.vehicleModel && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleModel.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
                    Vehicle Number *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="vehicleNumber"
                      {...register('vehicleNumber', { required: 'Vehicle number is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., MH12AB1234"
                    />
                    {errors.vehicleNumber && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleNumber.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
                    Vehicle Type *
                  </label>
                  <div className="mt-1">
                    <select
                      id="vehicleType"
                      {...register('vehicleType', { required: 'Vehicle type is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    >
                      <option value="">Select vehicle type</option>
                      <option value="Hatchback">Hatchback</option>
                      <option value="Sedan">Sedan</option>
                      <option value="SUV">SUV</option>
                      <option value="MUV">MUV</option>
                      <option value="Luxury">Luxury</option>
                    </select>
                    {errors.vehicleType && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleType.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="vehicleColor" className="block text-sm font-medium text-gray-700">
                    Vehicle Color *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="vehicleColor"
                      {...register('vehicleColor', { required: 'Vehicle color is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="e.g., White"
                    />
                    {errors.vehicleColor && (
                      <p className="mt-1 text-sm text-red-600">{errors.vehicleColor.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <FaMapMarkerAlt className="mr-2 text-orange-500" />
                Address
              </h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-6">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Street address *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="address"
                      {...register('address', { required: 'Address is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.address && (
                      <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="city"
                      {...register('city', { required: 'City is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.city && (
                      <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State/Province *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="state"
                      {...register('state', { required: 'State is required' })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.state && (
                      <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="pincode" className="block text-sm font-medium text-gray-700">
                    ZIP / Postal code *
                  </label>
                  <div className="mt-1">
                    <input
                      type="text"
                      id="pincode"
                      {...register('pincode', { 
                        required: 'Postal code is required',
                        pattern: {
                          value: /^[0-9]{6}$/,
                          message: 'Please enter a valid 6-digit postal code'
                        }
                      })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.pincode && (
                      <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-medium text-gray-900">Create Password</h3>
              <div className="mt-6 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                <div className="sm:col-span-3">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password *
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="password"
                      {...register('password', { 
                        required: 'Password is required',
                        minLength: {
                          value: 6,
                          message: 'Password must be at least 6 characters'
                        }
                      })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                    )}
                  </div>
                </div>

                <div className="sm:col-span-3">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                    Confirm Password *
                  </label>
                  <div className="mt-1">
                    <input
                      type="password"
                      id="confirmPassword"
                      {...register('confirmPassword', {
                        validate: value => 
                          value === watch('password') || 'The passwords do not match'
                      })}
                      className="shadow-sm focus:ring-orange-500 focus:border-orange-500 block w-full sm:text-sm border-gray-300 rounded-md"
                    />
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                {...register('terms', { 
                  required: 'You must accept the terms and conditions'
                })}
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700">
                I agree to the <a href="/terms" className="text-orange-600 hover:text-orange-500">Terms and Conditions</a> and <a href="/privacy" className="text-orange-600 hover:text-orange-500">Privacy Policy</a> *
              </label>
              {errors.terms && (
                <p className="mt-1 text-sm text-red-600">{errors.terms.message}</p>
              )}
            </div>

            <div className="pt-5">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register as Driver'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DriverRegister;
