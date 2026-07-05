import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const updateStatus = async (token, status) => {
  const response = await fetch(`${BACKEND_BASE_URL}/api/driver-status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ status }),
    keepalive: status === 'offline',
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || data.error || 'Failed to update driver status');
  }
  return data;
};

export const useDriverStatus = () => {
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      try {
        const token = await user.getIdToken();
        await updateStatus(token, 'active');

        const handleBeforeUnload = () => {
          user.getIdToken().then((freshToken) => {
            updateStatus(freshToken, 'offline').catch(console.error);
          }).catch(console.error);
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
        };
      } catch (error) {
        console.error('Error updating driver status:', error);
      }
    });

    return () => {
      unsubscribeAuth();
      const currentUser = auth.currentUser;
      if (currentUser) {
        currentUser.getIdToken().then((token) => {
          updateStatus(token, 'offline').catch(console.error);
        }).catch(console.error);
      }
    };
  }, []);
};
