// NotificationContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';

const NotificationContext = createContext();

const MAX_NOTIFICATIONS = 3;

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (message, type = 'info') => {
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification = { id: uniqueId, message, type, timestamp: Date.now() };

    setNotifications(prev => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const filtered = prevArray.filter(n => n.message !== message || n.type !== type);
      const updated = [...filtered, newNotification];
      if (updated.length > MAX_NOTIFICATIONS) {
        updated.sort((a, b) => a.timestamp - b.timestamp);
        updated.shift();
      }
      return updated;
    });
  };

  const removeNotification = id => {
    setNotifications(prev => {
      const prevArray = Array.isArray(prev) ? prev : [];
      return prevArray.filter(n => n.id !== id);
    });
  };

  return (
    <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within a NotificationProvider');
  return context;
};

export const NotificationDisplay = () => {
  const { notifications, removeNotification } = useNotification();

  useEffect(() => {
    const notificationsArray = Array.isArray(notifications) ? notifications : [];
    const timeoutIds = notificationsArray.map(n => setTimeout(() => removeNotification(n.id), 5000));
    return () => timeoutIds.forEach(clearTimeout);
  }, [notifications, removeNotification]);

  const getBackgroundColor = type => {
    switch (type) {
      case 'error': return 'border-red-500';
      case 'warning': return 'border-yellow-600';
      case 'success': return 'border-green-500';
      case 'developer': return 'border-purple-500';
      case 'normal': return 'border-black';
      default: return 'border-gray-500';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {Array.isArray(notifications) && notifications.map(n => (
        <div key={n.id} className="backdrop-blur-md bg-white bg-opacity-85 rounded-lg shadow-lg w-96 border-4">
          <div className={`flex justify-between items-center px-4 py-2 ${getBackgroundColor(n.type)}`}>
            <span className="font-semibold capitalize">{n.type}</span>
            <button onClick={() => removeNotification(n.id)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="px-4 py-2">{typeof n.message === 'object' ? JSON.stringify(n.message) : n.message}</p>
        </div>
      ))}
    </div>
  );
};
