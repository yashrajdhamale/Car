import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader, MapPin, Navigation, X, Clock, User, Car, ArrowRight } from 'lucide-react';

const LocalPickup = () => {
  const navigate = useNavigate();
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState({
    pickup: null,
    drop: null
  });
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState({
    pickup: '',
    drop: ''
  });
  const [activeInput, setActiveInput] = useState('pickup');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Initialize MapmyIndia map
  useEffect(() => {
    const initMap = () => {
      if (!window.MapmyIndia) {
        console.error('MapmyIndia SDK not loaded');
        setLoading(false);
        return;
      }

      try {
        const map = new window.MapmyIndia.Map('map', {
          center: [28.6139, 77.2090], // Default to Delhi
          zoom: 10,
        });

        // Add controls
        map.addControl(new window.MapmyIndia.SearchControl({
          search: true,
          placeholder: 'Search for a location',
        }));

        // Add click event to set pickup/drop locations
        map.on('click', (e) => {
          const { lat, lng } = e.latlng;
          updateMarker(activeInput, [lat, lng]);
          reverseGeocode([lat, lng]);
        });

        setMap(map);
        setLoading(false);
      } catch (error) {
        console.error('Error initializing map:', error);
        setLoading(false);
      }
    };

    // Load MapmyIndia SDK
    if (!window.MapmyIndia) {
      const script = document.createElement('script');
      script.src = `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_KEY}/map_load?v=1.3`;
      script.async = true;
      script.onload = initMap;
      script.onerror = () => {
        console.error('Error loading MapmyIndia SDK');
        setLoading(false);
      };
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Cleanup
      if (map) {
        map.remove();
      }
    };
  }, []);

  const updateMarker = (type, position) => {
    if (!map) return;

    // Remove existing marker if any
    if (markers[type]) {
      map.removeLayer(markers[type]);
    }

    // Create new marker
    const newMarker = window.L.marker(position, {
      icon: window.L.icon({
        iconUrl: type === 'pickup' 
          ? 'https://maps.mapmyindia.com/images/marker_green.png' 
          : 'https://maps.mapmyindia.com/images/marker_red.png',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      }),
      draggable: true
    }).addTo(map);

    // Update marker position on drag
    newMarker.on('dragend', (e) => {
      const newPos = e.target.getLatLng();
      reverseGeocode([newPos.lat, newPos.lng]);
    });

    setMarkers(prev => ({
      ...prev,
      [type]: newMarker
    }));

    // Center map on the new marker
    map.setView(position, 15);
  };

  const reverseGeocode = async (position) => {
    try {
      const response = await fetch(
        `https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_KEY}/rev_geocode?lat=${position[0]}&lng=${position[1]}`
      );
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        setAddress(prev => ({
          ...prev,
          [activeInput]: data.results[0].formatted_address
        }));
      }
    } catch (error) {
      console.error('Error in reverse geocoding:', error);
    }
  };

  const handleInputFocus = (type) => {
    setActiveInput(type);
    if (markers[type]) {
      const position = markers[type].getLatLng();
      map.setView([position.lat, position.lng], 15);
    }
  };

  const handleSearch = async (query) => {
    if (!query) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const response = await fetch(
        `https://atlas.mapmyindia.com/api/places/search_json?query=${encodeURIComponent(query)}`,
        {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_MAPMYINDIA_KEY}`
          }
        }
      );
      const data = await response.json();
      setSuggestions(data.suggestedLocations || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching locations:', error);
    }
  };

  const selectSuggestion = (suggestion) => {
    const position = [suggestion.latitude, suggestion.longitude];
    updateMarker(activeInput, position);
    setAddress(prev => ({
      ...prev,
      [activeInput]: suggestion.placeName
    }));
    setShowSuggestions(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!markers.pickup || !markers.drop) {
      alert('Please select both pickup and drop locations');
      return;
    }
    // Navigate to booking page or show ride options
    console.log('Ride details:', { pickup: markers.pickup.getLatLng(), drop: markers.drop.getLatLng() });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold text-gray-900">Local Pickup</h1>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Map Container */}
        <div className="flex-1 relative">
          <div id="map" className="absolute inset-0"></div>
          
          {/* Current Location Button */}
          <button
            onClick={() => {
              if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                  (position) => {
                    const { latitude, longitude } = position.coords;
                    updateMarker(activeInput, [latitude, longitude]);
                    map.setView([latitude, longitude], 15);
                  },
                  (error) => console.error('Error getting location:', error)
                );
              }
            }}
            className="absolute bottom-6 right-4 bg-white p-3 rounded-full shadow-lg z-10"
            aria-label="Use current location"
          >
            <Navigation className="h-6 w-6 text-gray-700" />
          </button>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-96 bg-white shadow-lg flex flex-col">
          <div className="p-4 border-b">
            <h2 className="text-lg font-medium text-gray-900">Where to?</h2>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="p-4 space-y-4 flex-1">
              {/* Pickup Location */}
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-green-500">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Enter pickup location"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={address.pickup}
                  onChange={(e) => {
                    setAddress(prev => ({ ...prev, pickup: e.target.value }));
                    handleSearch(e.target.value);
                  }}
                  onFocus={() => handleInputFocus('pickup')}
                />
                {address.pickup && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress(prev => ({ ...prev, pickup: '' }));
                      if (markers.pickup) {
                        map.removeLayer(markers.pickup);
                        setMarkers(prev => ({ ...prev, pickup: null }));
                      }
                    }}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Drop Location */}
              <div className="relative">
                <div className="absolute left-3 top-3.5 text-red-500">
                  <MapPin size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Where to?"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={address.drop}
                  onChange={(e) => {
                    setAddress(prev => ({ ...prev, drop: e.target.value }));
                    handleSearch(e.target.value);
                  }}
                  onFocus={() => handleInputFocus('drop')}
                />
                {address.drop && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddress(prev => ({ ...prev, drop: '' }));
                      if (markers.drop) {
                        map.removeLayer(markers.drop);
                        setMarkers(prev => ({ ...prev, drop: null }));
                      }
                    }}
                    className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              {/* Suggestions */}
              {showSuggestions && suggestions.length > 0 && (
                <div className="mt-2 border border-gray-200 rounded-lg shadow-lg bg-white max-h-60 overflow-y-auto">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0"
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      <div className="flex items-center">
                        <MapPin size={16} className="text-gray-400 mr-2 flex-shrink-0" />
                        <div className="truncate">
                          <p className="text-sm font-medium text-gray-900 truncate">{suggestion.placeName}</p>
                          <p className="text-xs text-gray-500 truncate">{suggestion.placeAddress}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Ride Options */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Ride Options</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'economy', name: 'Economy', price: '₹150-200', time: '5 min', icon: <Car className="h-5 w-5" /> },
                    { id: 'premium', name: 'Premium', price: '₹250-300', time: '5 min', icon: <Car className="h-5 w-5" /> },
                    { id: 'suv', name: 'SUV', price: '₹350-400', time: '7 min', icon: <Car className="h-5 w-5" /> },
                    { id: 'luxury', name: 'Luxury', price: '₹500+', time: '10 min', icon: <Car className="h-5 w-5" /> },
                  ].map((option) => (
                    <div
                      key={option.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-500 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-gray-900">{option.name}</span>
                        {option.icon}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock size={12} className="mr-1" />
                        <span className="mr-3">{option.time}</span>
                        <span>{option.price}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50">
              <button
                type="submit"
                disabled={!markers.pickup || !markers.drop}
                className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
                  markers.pickup && markers.drop
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Confirm Ride
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Add MapmyIndia SDK */}
      <script
        src={`https://apis.mapmyindia.com/advancedmaps/v1/${import.meta.env.VITE_MAPMYINDIA_KEY}/map_load?v=1.3`}
        type="text/javascript"
      ></script>
      <link
        rel="stylesheet"
        href="https://apis.mapmyindia.com/advancedmaps/v1/indiamap_load?v=1.3"
        type="text/css"
      />
    </div>
  );
};

export default LocalPickup;
