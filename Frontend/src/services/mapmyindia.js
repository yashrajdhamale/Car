// Singleton map instance
let mapInstance = null;
let isLoading = false;
let waiters = [];

const loadMapScript = (apiKey) => {
  return new Promise((resolve, reject) => {
    // If already loaded
    if (window.MapmyIndia && window.MapmyIndia.Map) {
      resolve();
      return;
    }

    // Prevent duplicate script
    if (document.getElementById("mapmyindia-sdk")) {
      const check = setInterval(() => {
        if (window.MapmyIndia && window.MapmyIndia.Map) {
          clearInterval(check);
          resolve();
        }
      }, 100);
      return;
    }

    const script = document.createElement("script");
    script.id = "mapmyindia-sdk";
    script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_API_KEY}/map_load?v=1.5`;
    script.async = true;

    script.onload = () => {
      if (window.MapmyIndia && window.MapmyIndia.Map) {
        resolve();
      } else {
        reject(new Error("MapmyIndia SDK loaded but Map not available"));
      }
    };

    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
};

export const initMapmyIndia = async () => {
  // Return existing instance
  if (mapInstance) return mapInstance;

  // If already loading, wait
  if (isLoading) {
    return new Promise((resolve) => waiters.push(resolve));
  }

  isLoading = true;

  try {
    await loadMapScript(import.meta.env.VITE_MAPMYINDIA_API_KEY);

    const container = document.getElementById("mapmyindia-root");
    if (!container) {
      throw new Error("Static map container #mapmyindia-root not found");
    }

    mapInstance = new window.MapmyIndia.Map(container, {
      center: [18.5204, 73.8567], // Pune
      zoom: 13,
      zoomControl: true
    });

    // Resolve all waiters
    waiters.forEach((r) => r(mapInstance));
    waiters = [];
    isLoading = false;

    return mapInstance;
  } catch (err) {
    isLoading = false;
    waiters = [];
    console.error("Error initializing MapmyIndia:", err);
    throw err;
  }
};

export const getMapInstance = () => mapInstance;
