import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase';
import { toast } from 'react-toastify';

const BankDetailsForm = ({ onComplete, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    bankName: '',
    accountName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    bankBranch: '',
    ifscCode: '',
    mobileNumber: '',
    upiQrCode: null,
    upiQrCodeUrl: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchBankDetails = async () => {
      if (!auth.currentUser) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'drivers', auth.currentUser.uid));
        if (userDoc.exists() && userDoc.data().bankDetails) {
          const { bankDetails } = userDoc.data();
          setFormData(prev => ({
            ...prev,
            ...bankDetails,
            confirmAccountNumber: bankDetails.accountNumber || ''
          }));
        }
      } catch (error) {
        console.error('Error fetching bank details:', error);
        toast.error('Failed to load bank details');
      }
    };

    if (isOpen) {
      fetchBankDetails();
    }
  }, [isOpen]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    
    if (name === 'upiQrCode') {
      if (files && files[0]) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({
            ...prev,
            upiQrCode: files[0],
            upiQrCodeUrl: reader.result
          }));
        };
        reader.readAsDataURL(files[0]);
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.bankName.trim()) newErrors.bankName = 'Bank name is required';
    if (!formData.accountName.trim()) newErrors.accountName = 'Account name is required';
    if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
    if (formData.accountNumber !== formData.confirmAccountNumber) {
      newErrors.confirmAccountNumber = 'Account numbers do not match';
    }
    if (!formData.bankBranch.trim()) newErrors.bankBranch = 'Bank branch is required';
    if (!formData.ifscCode.trim()) newErrors.ifscCode = 'IFSC code is required';
    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!/^[0-9]{10}$/.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Please enter a valid 10-digit mobile number';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (!auth.currentUser) {
      toast.error('You must be logged in to update bank details');
      return;
    }

    setIsSubmitting(true);

    try {
      const { confirmAccountNumber, upiQrCode, ...bankDetails } = formData;
      
      // In a real app, you would upload the UPI QR code to Firebase Storage here
      // and save the download URL in the bankDetails object
      
      await updateDoc(doc(db, 'drivers', auth.currentUser.uid), {
        bankDetails,
        profileComplete: true
      });

      toast.success('Bank details saved successfully!');
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving bank details:', error);
      toast.error('Failed to save bank details');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">Bank Details</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              disabled={isSubmitting}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Please provide your bank account details for receiving payments. All information is securely encrypted.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., State Bank of India"
                  disabled={isSubmitting}
                />
                {errors.bankName && <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder's Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountName"
                  value={formData.accountName}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.accountName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="As per bank records"
                  disabled={isSubmitting}
                />
                {errors.accountName && <p className="mt-1 text-sm text-red-600">{errors.accountName}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Enter account number"
                  disabled={isSubmitting}
                />
                {errors.accountNumber && <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="confirmAccountNumber"
                  value={formData.confirmAccountNumber}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.confirmAccountNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="Re-enter account number"
                  disabled={isSubmitting}
                />
                {errors.confirmAccountNumber && <p className="mt-1 text-sm text-red-600">{errors.confirmAccountNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Branch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="bankBranch"
                  value={formData.bankBranch}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.bankBranch ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., Mumbai Main Branch"
                  disabled={isSubmitting}
                />
                {errors.bankBranch && <p className="mt-1 text-sm text-red-600">{errors.bankBranch}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IFSC Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="ifscCode"
                  value={formData.ifscCode}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 border ${errors.ifscCode ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="e.g., SBIN0001234"
                  disabled={isSubmitting}
                />
                {errors.ifscCode && <p className="mt-1 text-sm text-red-600">{errors.ifscCode}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number (Linked to Bank) <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                    +91
                  </span>
                  <input
                    type="tel"
                    name="mobileNumber"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    className={`flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border ${errors.mobileNumber ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                    placeholder="9876543210"
                    maxLength="10"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.mobileNumber && <p className="mt-1 text-sm text-red-600">{errors.mobileNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  UPI QR Code
                </label>
                <div className="mt-1 flex items-center">
                  <span className="inline-block h-12 w-12 rounded-full overflow-hidden bg-gray-100">
                    {formData.upiQrCodeUrl ? (
                      <img src={formData.upiQrCodeUrl} alt="UPI QR Code" className="h-full w-full object-cover" />
                    ) : (
                      <svg className="h-full w-full text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    )}
                  </span>
                  <label className="ml-5 bg-white py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm leading-4 font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer">
                    <span>Upload</span>
                    <input
                      type="file"
                      name="upiQrCode"
                      accept="image/*"
                      onChange={handleChange}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                  </label>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Upload a clear image of your UPI QR code (optional)
                </p>
              </div>
            </div>
            
            <div className="mt-6 pt-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : 'Save Bank Details'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BankDetailsForm;
