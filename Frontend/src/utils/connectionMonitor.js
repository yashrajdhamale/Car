import { onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

class ConnectionMonitor {
  constructor() {
    this.connectionState = 'unknown';
    this.listeners = new Set();
    this.initialize();
  }

  initialize() {
    // Listen to the special .info/connected document
    const docRef = db.collection('.info').doc('connected');
    
    this.unsubscribe = onSnapshot(docRef, (doc) => {
      const isConnected = doc.data()?.state === 'connected';
      this.connectionState = isConnected ? 'connected' : 'disconnected';
      this.notifyListeners();
      
      if (isConnected) {
        console.log('Firestore connection: Connected');
      } else {
        console.warn('Firestore connection: Disconnected');
      }
    }, (error) => {
      console.error('Connection monitor error:', error);
      this.connectionState = 'error';
      this.notifyListeners();
      
      // Attempt to reconnect
      setTimeout(() => this.initialize(), 5000);
    });
  }

  addListener(callback) {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => this.listeners.delete(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners() {
    this.listeners.forEach(callback => callback(this.connectionState));
  }

  getConnectionState() {
    return this.connectionState;
  }

  cleanup() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    this.listeners.clear();
  }
}

// Create a singleton instance
export const connectionMonitor = new ConnectionMonitor();

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    connectionMonitor.cleanup();
  });
}

export default connectionMonitor;
