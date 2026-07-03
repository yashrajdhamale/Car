import { useEffect } from 'react';
import { doc, updateDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

export const useDriverStatus = () => {
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    // Check if user is a driver
    const userDocRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userDocRef, (doc) => {
      const userData = doc.data();
      if (userData?.type === 'driver') {
        // Set status to online when component mounts
        const driverRef = doc(db, 'drivers', user.uid);
        updateDoc(driverRef, {
          status: 'active',
          lastOnline: serverTimestamp()
        }).catch(console.error);

        // Set up window close handler
        const handleBeforeUnload = async () => {
          try {
            await updateDoc(driverRef, {
              status: 'offline',
              lastOnline: serverTimestamp()
            });
          } catch (error) {
            console.error('Error updating driver status on unload:', error);
          }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        
        // Set up auth state change handler
        const unsubscribeAuth = auth.onAuthStateChanged((user) => {
          if (!user) {
            // User signed out
            updateDoc(driverRef, {
              status: 'offline',
              lastOnline: serverTimestamp()
            }).catch(console.error);
          }
        });

        // Cleanup function
        return () => {
          window.removeEventListener('beforeunload', handleBeforeUnload);
          unsubscribeAuth();
          // Update status to offline when component unmounts
          updateDoc(driverRef, {
            status: 'offline',
            lastOnline: serverTimestamp()
          }).catch(console.error);
        };
      }
    });

    return () => unsubscribe();
  }, []);
};
