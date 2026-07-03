import { useState, useEffect } from 'react';
import { connectionMonitor } from '../utils/connectionMonitor';

export const useConnectionStatus = () => {
  const [status, setStatus] = useState(() => connectionMonitor.getConnectionState());

  useEffect(() => {
    // Set initial status
    setStatus(connectionMonitor.getConnectionState());
    
    // Subscribe to connection changes
    const unsubscribe = connectionMonitor.addListener((newStatus) => {
      setStatus(newStatus);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return {
    isConnected: status === 'connected',
    isDisconnected: status === 'disconnected',
    isError: status === 'error',
    status
  };
};

export default useConnectionStatus;
