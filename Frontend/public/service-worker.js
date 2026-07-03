// Service Worker for background location updates
const CACHE_NAME = 'ride-tracker-v1';
const LOCATION_UPDATE_INTERVAL = 30000; // 30 seconds

self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'START_LOCATION_TRACKING') {
    console.log('Starting background location tracking');
    
    let trackingInterval = null;
    
    const updateLocation = () => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
              timestamp: Date.now(),
              accuracy: position.coords.accuracy,
              speed: position.coords.speed || 0,
              heading: position.coords.heading || null
            };
            
            // Send to all clients
            self.clients.matchAll().then((clients) => {
              clients.forEach((client) => {
                client.postMessage({
                  type: 'BACKGROUND_LOCATION_UPDATE',
                  location
                });
              });
            });
            
            console.log('Background location updated:', location);
          },
          (error) => {
            console.error('Background location error:', error);
          },
          {
            enableHighAccuracy: false,
            timeout: 10000,
            maximumAge: 0
          }
        );
      }
    };
    
    // Start tracking
    updateLocation();
    trackingInterval = setInterval(updateLocation, LOCATION_UPDATE_INTERVAL);
    
    // Store interval for cleanup
    event.ports[0].postMessage({
      type: 'TRACKING_STARTED',
      interval: LOCATION_UPDATE_INTERVAL
    });
    
    // Handle stop tracking
    event.ports[0].onmessage = (msg) => {
      if (msg.data.type === 'STOP_TRACKING') {
        clearInterval(trackingInterval);
        console.log('Background location tracking stopped');
      }
    };
  }
});

// Handle push notifications for new rides
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const data = event.data.json();
  
  const options = {
    body: data.body || 'New ride request available',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      url: data.url || '/driver'
    },
    actions: [
      {
        action: 'accept',
        title: 'Accept Ride',
        icon: '/accept-icon.png'
      },
      {
        action: 'view',
        title: 'View',
        icon: '/view-icon.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'New Ride', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  if (event.action === 'accept') {
    // Open app and accept ride
    event.waitUntil(
      self.clients.openWindow('/driver/accept-ride')
    );
  } else {
    // Open driver dashboard
    event.waitUntil(
      self.clients.openWindow('/driver')
    );
  }
});

// Cache important assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/') || event.request.url.includes('/firestore/')) {
    // Don't cache API requests
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});