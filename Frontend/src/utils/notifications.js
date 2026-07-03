import { useNotification } from '../context/NotificationContext';

let notificationContext = null;

/**
 * Displays a notification to the user
 * @param {string} message - The message to display
 * @param {string} type - The type of notification ('success', 'error', 'warning', 'info')
 */
export const addNotification = (message, type = 'info') => {
  if (notificationContext) {
    notificationContext.addNotification(message, type);
  } else {
    console.warn('Notification context not initialized. Message:', message);
  }
};

// This function should be called with the notification context when it's available
export const initNotificationContext = (context) => {
  notificationContext = context;
};
