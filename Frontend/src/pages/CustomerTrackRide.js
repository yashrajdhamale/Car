import { useState, useEffect } from 'react';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

const CustomerTrackRide = ({ bookingId }) => {
  const [location, setLocation] = useState(null);
  const [isSharing, setIsSharing] = useState(false);

  const shareLocation = () => {
    if (!navigator.geolocation) return;
    
    setIsSharing(true);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          timestamp: Date.now(),
          accuracy: position.coords.accuracy
        };
        
        setLocation(newLocation);
        
        // Update location in Firestore
        const bookingRef = doc(db, 'airportTransfers', bookingId);
        updateDoc(bookingRef, {
          userLocation: newLocation,
          userLocationUpdatedAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          _locationStatus: 'live_tracking'
        });
      },
      (error) => console.error('Location error:', error),
      { enableHighAccuracy: true, maximumAge: 5000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  };

  return (
    <div>
      <button onClick={shareLocation} disabled={isSharing}>
        {isSharing ? 'Sharing Location...' : 'Share Live Location'}
      </button>
      {location && (
        <p>
          Location: {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
};