import React, { useState } from 'react';
import DriverLayout from '../../components/driver/DriverLayout';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notifications, setNotifications] = useState({
    email: true,
    sms: true,
    push: true,
    rideUpdates: true,
    promotions: false,
  });
  const [availability, setAvailability] = useState({
    monday: { enabled: true, start: '09:00', end: '17:00' },
    tuesday: { enabled: true, start: '09:00', end: '17:00' },
    wednesday: { enabled: true, start: '09:00', end: '17:00' },
    thursday: { enabled: true, start: '09:00', end: '17:00' },
    friday: { enabled: true, start: '09:00', end: '17:00' },
    saturday: { enabled: false, start: '10:00', end: '15:00' },
    sunday: { enabled: false, start: '10:00', end: '15:00' },
  });
  const [language, setLanguage] = useState('en');
  const [theme, setTheme] = useState('light');

  const handleNotificationChange = (e) => {
    const { name, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleAvailabilityChange = (day, field, value) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: field === 'enabled' ? !prev[day].enabled : value
      }
    }));
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    // Add password change logic here
    console.log('Password change submitted');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'account':
        return (
          <div className="space-y-6">
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Change Password</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">Update your account password</p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <form onSubmit={handlePasswordSubmit} className="space-y-6 max-w-lg">
                  <div>
                    <label htmlFor="current-password" className="block text-sm font-medium text-gray-700">
                      Current Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="current-password"
                        name="current-password"
                        type="password"
                        autoComplete="current-password"
                        required
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
                      New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="new-password"
                        name="new-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Must be at least 8 characters long
                    </p>
                  </div>

                  <div>
                    <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">
                      Confirm New Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="confirm-password"
                        name="confirm-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Update Password
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Account</h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Permanently delete your account and all of your data
                </p>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <p className="text-sm text-gray-600 mb-4">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
                <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Notification Preferences</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Manage how you receive notifications
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-5">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="email-notifications"
                      name="email"
                      type="checkbox"
                      checked={notifications.email}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="email-notifications" className="font-medium text-gray-700">
                      Email Notifications
                    </label>
                    <p className="text-gray-500">Receive notifications via email</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="sms-notifications"
                      name="sms"
                      type="checkbox"
                      checked={notifications.sms}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="sms-notifications" className="font-medium text-gray-700">
                      SMS Notifications
                    </label>
                    <p className="text-gray-500">Receive text message notifications</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="push-notifications"
                      name="push"
                      type="checkbox"
                      checked={notifications.push}
                      onChange={handleNotificationChange}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="push-notifications" className="font-medium text-gray-700">
                      Push Notifications
                    </label>
                    <p className="text-gray-500">Receive push notifications on your device</p>
                  </div>
                </div>

                <div className="border-t border-gray-200 pt-5">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Notification Types</h4>
                  
                  <div className="flex items-start mb-3">
                    <div className="flex items-center h-5">
                      <input
                        id="ride-updates"
                        name="rideUpdates"
                        type="checkbox"
                        checked={notifications.rideUpdates}
                        onChange={handleNotificationChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="ride-updates" className="font-medium text-gray-700">
                        Ride Updates
                      </label>
                      <p className="text-gray-500">Get notified about ride requests and updates</p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="promotions"
                        name="promotions"
                        type="checkbox"
                        checked={notifications.promotions}
                        onChange={handleNotificationChange}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="promotions" className="font-medium text-gray-700">
                        Promotions & Offers
                      </label>
                      <p className="text-gray-500">Get notified about special promotions and offers</p>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'availability':
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Working Hours</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Set your weekly availability for ride requests
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-5">
                {Object.entries(availability).map(([day, { enabled, start, end }]) => (
                  <div key={day} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <input
                        id={`${day}-enabled`}
                        type="checkbox"
                        checked={enabled}
                        onChange={() => handleAvailabilityChange(day, 'enabled')}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor={`${day}-enabled`} className="ml-2 block text-sm font-medium text-gray-700 w-24">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="time"
                        value={start}
                        onChange={(e) => handleAvailabilityChange(day, 'start', e.target.value)}
                        disabled={!enabled}
                        className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!enabled ? 'bg-gray-100' : ''}`}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={end}
                        onChange={(e) => handleAvailabilityChange(day, 'end', e.target.value)}
                        disabled={!enabled}
                        className={`border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${!enabled ? 'bg-gray-100' : ''}`}
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Availability
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Preferences</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Customize your application preferences
              </p>
            </div>
            <div className="px-4 py-5 sm:p-6">
              <div className="space-y-8">
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700">
                    Language
                  </label>
                  <select
                    id="language"
                    name="language"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Theme</label>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center">
                      <input
                        id="light-theme"
                        name="theme"
                        type="radio"
                        checked={theme === 'light'}
                        onChange={() => setTheme('light')}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="light-theme" className="ml-3 block text-sm font-medium text-gray-700">
                        Light
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="dark-theme"
                        name="theme"
                        type="radio"
                        checked={theme === 'dark'}
                        onChange={() => setTheme('dark')}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="dark-theme" className="ml-3 block text-sm font-medium text-gray-700">
                        Dark
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        id="system-theme"
                        name="theme"
                        type="radio"
                        checked={theme === 'system'}
                        onChange={() => setTheme('system')}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                      />
                      <label htmlFor="system-theme" className="ml-3 block text-sm font-medium text-gray-700">
                        System Default
                      </label>
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-gray-200">
                  <button
                    type="button"
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Save Preferences
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DriverLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Settings</h1>
        
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-5">
          <aside className="py-6 px-2 sm:px-6 lg:py-0 lg:px-0 lg:col-span-3">
            <nav className="space-y-1">
              {[
                { name: 'Account', tab: 'account', icon: 'user' },
                { name: 'Notifications', tab: 'notifications', icon: 'bell' },
                { name: 'Availability', tab: 'availability', icon: 'clock' },
                { name: 'Preferences', tab: 'preferences', icon: 'cog' },
              ].map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.tab)}
                  className={`${
                    activeTab === item.tab
                      ? 'bg-blue-50 border-blue-500 text-blue-700 hover:bg-blue-50 hover:text-blue-700'
                      : 'border-transparent text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group border-l-4 px-3 py-2 flex items-center text-sm font-medium w-full text-left`}
                >
                  <span className="truncate">{item.name}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="space-y-6 sm:px-6 lg:px-0 lg:col-span-9">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </DriverLayout>
  );
};

export default Settings;
