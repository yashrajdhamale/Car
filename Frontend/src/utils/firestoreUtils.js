import { db } from '../config/firebase';
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';

// Cache for active listeners
const activeListeners = new Map();

/**
 * Safely listen to a Firestore document with error handling
 * @param {string} collection - Collection name
 * @param {string} docId - Document ID
 * @param {Function} callback - Callback function with document data
 * @param {Object} options - Additional options
 * @returns {Function} Unsubscribe function
 */
export const listenToDoc = (collection, docId, callback, options = {}) => {
  const docRef = doc(db, collection, docId);
  const docKey = `${collection}/${docId}`;
  
  // Unsubscribe from any existing listener for this document
  if (activeListeners.has(docKey)) {
    activeListeners.get(docKey)();
  }

  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() });
      } else if (options.createIfMissing) {
        // Create document if it doesn't exist
        setDoc(docRef, options.defaultData || {}).then(() => {
          console.log(`Created missing document: ${docKey}`);
        });
      } else {
        console.warn(`Document not found: ${docKey}`);
        callback(null);
      }
    },
    (error) => {
      console.error(`Error listening to ${docKey}:`, error);
      // Attempt to reconnect after a delay
      setTimeout(() => {
        listenToDoc(collection, docId, callback, options);
      }, 5000);
    }
  );

  // Store the unsubscribe function
  activeListeners.set(docKey, unsubscribe);
  
  // Return cleanup function
  return () => {
    unsubscribe();
    activeListeners.delete(docKey);
  };
};

/**
 * Clean up all active listeners
 */
export const cleanupAllListeners = () => {
  activeListeners.forEach((unsubscribe) => unsubscribe());
  activeListeners.clear();
};

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    // Clean up listeners when page is hidden
    cleanupAllListeners();
  }
});

// Handle beforeunload
window.addEventListener('beforeunload', cleanupAllListeners);
