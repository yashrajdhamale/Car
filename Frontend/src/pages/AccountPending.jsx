import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, Home } from 'lucide-react';

const AccountPending = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-yellow-100 mb-4">
          <Clock className="h-8 w-8 text-yellow-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Under Review</h2>
        <p className="text-gray-600 mb-6">
          Thank you for registering! Your account is currently under review by our team. 
          This process typically takes 24-48 hours. You'll receive an email once your account is approved.
        </p>
        
        <div className="space-y-4">
          <Link
            to="/"
            className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Home className="mr-2 h-4 w-4" />
            Return Home
          </Link>
          
          <div className="text-sm text-gray-500">
            Need help?{' '}
            <a href="mailto:support@carziholidays.com" className="font-medium text-blue-600 hover:text-blue-500">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPending;
