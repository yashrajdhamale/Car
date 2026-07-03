import { db } from '../config/firebase';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';

// Routes Collection
const getRoutesCollection = () => collection(db, 'routes');

// Subscribe to routes changes for a specific driver
const subscribeToRoutes = (driverId, callback) => {
  if (typeof callback !== 'function') {
    console.error('Callback must be a function');
    throw new Error('Invalid callback function');
  }
  
  try {
    const q = query(
      getRoutesCollection(),
      where('driverId', '==', driverId)
    );
    
    return onSnapshot(q, (snapshot) => {
      try {
        const routes = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(routes);
      } catch (err) {
        console.error('Error processing routes:', err);
        callback([]);
      }
    }, (error) => {
      console.error('Error in routes subscription:', error);
      callback([]);
    });
  } catch (err) {
    console.error('Error setting up routes subscription:', err);
    return () => {};
  }
};

// Add a new route
const addRoute = async (driverId, routeData) => {
  const docRef = await addDoc(getRoutesCollection(), {
    driverId,
    from: routeData.from,
    to: routeData.to,
    rate: Number(routeData.rate),
    radiusKm: Number(routeData.radiusKm) || 30,
    active: routeData.active !== false, // Default to true if not specified
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  return docRef.id;
};

// Update an existing route
const updateRoute = async (driverId, routeId, updates) => {
  const routeRef = doc(getRoutesCollection(), routeId);
  await updateDoc(routeRef, {
    ...updates,
    // Ensure rate and radiusKm are numbers
    ...(updates.rate && { rate: Number(updates.rate) }),
    ...(updates.radiusKm && { radiusKm: Number(updates.radiusKm) }),
    updatedAt: new Date().toISOString()
  });
};

// Delete a route
const deleteRoute = async (routeId) => {
  const routeRef = doc(getRoutesCollection(), routeId);
  await deleteDoc(routeRef);
};

// Get cities for autocomplete
const subscribeToCities = (callback) => {
  const q = query(collection(db, 'cities'));
  return onSnapshot(q, (snapshot) => {
    const cities = snapshot.docs.map(doc => doc.data().name);
    callback(cities);
  });
};

export {
  subscribeToRoutes,
  addRoute,
  updateRoute,
  deleteRoute,
  subscribeToCities
};
