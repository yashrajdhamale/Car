import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

// Your Firebase Cloud Function endpoint
const SEARCH_API = "https://us-central1-carzi-holidays-f4be3.cloudfunctions.net/searchPlaces";

/* ---------------------- Main Component ---------------------- */
const LocalTransferPage = () => {
  const initialLocationState = {
    category: 'Airport',
    placeId: '',
    name: '',
    address: '',
    lat: null,
    lng: null
  };

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    destination: { placeId: '', name: '', address: '', lat: null, lng: null },
    pickup: { ...initialLocationState },
    dropoff: { ...initialLocationState },
    travelDate: '',
    hour: '12',
    minute: '00',
    adults: 1,
    children: 0,
    nationality: 'Indian',
    markup: { type: 'Flat', value: '' }
  });

  const [suggestions, setSuggestions] = useState({
    destination: [],
    pickup: [],
    dropoff: []
  });

  const [showMarkup, setShowMarkup] = useState(false);
  const [loading, setLoading] = useState({
    destination: false,
    pickup: false,
    dropoff: false
  });

  const destinationInputRef = useRef(null);
  const pickupInputRef = useRef(null);
  const dropoffInputRef = useRef(null);

  const locationCategories = useMemo(() => 
    ['Airport', 'Railway Station', 'Bus Station', 'Accommodation', 'Landmark', 'Custom Address'], 
  []);

  const hours = useMemo(() => 
    Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0')), 
  []);

  const minutes = useMemo(() => 
    ['00', '15', '30', '45'], 
  []);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  /* ---------------------- Search Places Function ---------------------- */
  const searchPlace = useCallback(async (query, field) => {
    if (query.length < 3) {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
      return;
    }

    setLoading(prev => ({ ...prev, [field]: true }));

    try {
      const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(query)}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      
      // Handle both response formats
      const suggestionsList = data.suggestions || data.suggestedLocations || [];
      
      setSuggestions(prev => ({
        ...prev,
        [field]: suggestionsList
      }));
    } catch (error) {
      console.error(`Error searching ${field}:`, error);
      setSuggestions(prev => ({ ...prev, [field]: [] }));
    } finally {
      setLoading(prev => ({ ...prev, [field]: false }));
    }
  }, []);

  /* ---------------------- Select Place ---------------------- */
  const selectPlace = useCallback((field, place) => {
    if (!place) return;

    const transformedPlace = {
      placeId: place.eLoc || '',
      name: place.placeName || '',
      address: place.placeAddress || '',
      lat: place.latitude || null,
      lng: place.longitude || null,
      types: place.types || []
    };

    if (field === 'destination') {
      setFormData(prev => ({
        ...prev,
        destination: {
          ...transformedPlace,
          bounds: place.bounds || null
        },
        pickup: { ...initialLocationState, category: prev.pickup.category },
        dropoff: { ...initialLocationState, category: prev.dropoff.category }
      }));

      if (destinationInputRef.current) {
        destinationInputRef.current.value = transformedPlace.name;
      }
      if (pickupInputRef.current) pickupInputRef.current.value = '';
      if (dropoffInputRef.current) dropoffInputRef.current.value = '';
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: {
          ...prev[field],
          ...transformedPlace
        }
      }));

      const inputRef = field === 'pickup' ? pickupInputRef : dropoffInputRef;
      if (inputRef.current) {
        inputRef.current.value = transformedPlace.name;
      }
    }

    setSuggestions(prev => ({ ...prev, [field]: [] }));
  }, [initialLocationState]);

  /* ---------------------- Generic handlers ---------------------- */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({ 
        ...prev, 
        [parent]: { ...prev[parent], [child]: value } 
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);

  const handleCategoryChange = useCallback((field, category) => {
    const inputRef = field === 'pickup' ? pickupInputRef : dropoffInputRef;
    if (inputRef.current) inputRef.current.value = '';
    
    setFormData(prev => ({ 
      ...prev, 
      [field]: { 
        ...initialLocationState, 
        category,
        name: '',
        address: '',
        placeId: '',
        lat: null,
        lng: null
      } 
    }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
  }, [initialLocationState]);

  const handlePassengerChange = useCallback((field, increment) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: Math.max(field === 'adults' ? 1 : 0, prev[field] + (increment ? 1 : -1)) 
    }));
  }, []);

  const handleSubmit = useCallback(() => {
    // Validate required fields
    if (!formData.destination.name) {
      alert("Please select a destination city");
      return;
    }

    if (!formData.pickup.name) {
      alert("Please select a pickup location");
      return;
    }

    if (!formData.dropoff.name) {
      alert("Please select a drop-off location");
      return;
    }

    if (!formData.travelDate) {
      alert("Please select travel date");
      return;
    }

    console.log('Form submitted:', formData);
    
    navigate('/vehicles', { 
      state: { 
        transferDetails: {
          ...formData,
          // Ensure all location objects have required properties
          destination: {
            ...formData.destination,
            placeId: formData.destination.placeId || '',
            name: formData.destination.name || '',
            lat: formData.destination.lat || null,
            lng: formData.destination.lng || null
          },
          pickup: {
            ...formData.pickup,
            placeId: formData.pickup.placeId || '',
            name: formData.pickup.name || '',
            address: formData.pickup.address || '',
            lat: formData.pickup.lat || null,
            lng: formData.pickup.lng || null,
            types: formData.pickup.types || [],
            category: formData.pickup.category || 'Airport'
          },
          dropoff: {
            ...formData.dropoff,
            placeId: formData.dropoff.placeId || '',
            name: formData.dropoff.name || '',
            address: formData.dropoff.address || '',
            lat: formData.dropoff.lat || null,
            lng: formData.dropoff.lng || null,
            types: formData.dropoff.types || [],
            category: formData.dropoff.category || 'Airport'
          }
        }
      } 
    });
  }, [formData, navigate]);

  /* ---------------------- Handle Input Change ---------------------- */
  const handleInputChange = useCallback((e, field) => {
    const value = e.target.value;
    
    // Clear the field if input is cleared
    if (value === '') {
      if (field === 'destination') {
        setFormData(prev => ({
          ...prev,
          destination: { placeId: '', name: '', address: '', lat: null, lng: null },
          pickup: { ...initialLocationState, category: prev.pickup.category },
          dropoff: { ...initialLocationState, category: prev.dropoff.category }
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          [field]: {
            ...prev[field],
            name: '',
            address: '',
            placeId: '',
            lat: null,
            lng: null
          }
        }));
      }
      setSuggestions(prev => ({ ...prev, [field]: [] }));
    } else {
      searchPlace(value, field);
    }
  }, [searchPlace, initialLocationState]);

  /* ---------------------- Suggestion Box Component ---------------------- */
  const SuggestionBox = useCallback(({ list, field, loading: isLoading }) => {
    if (!list || list.length === 0) return null;

    return (
      <div className="absolute z-50 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-56 overflow-y-auto mt-1">
        {isLoading ? (
          <div className="px-3 py-2 text-center text-gray-500">Loading...</div>
        ) : (
          list.map((place, index) => (
            <div
              key={`${field}-${index}`}
              onClick={() => selectPlace(field, place)}
              className="px-3 py-2 cursor-pointer hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
            >
              <div className="font-medium text-sm text-gray-800">
                {place.placeName || place.name}
              </div>
              <div className="text-xs text-gray-500 truncate">
                {place.placeAddress || place.address}
              </div>
            </div>
          ))
        )}
      </div>
    );
  }, [selectPlace]);

  /* ---------------------- Effect for URL params ---------------------- */
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    setShowMarkup(urlParams.get('agent') === '1');
  }, []);

  return (
    <div className="relative min-h-screen">
      {/* Fullscreen Background Image */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url('https://png.pngtree.com/thumb_back/fw800/background/20230815/pngtree-an-airliner-with-the-tarmac-at-the-airport-image_13066583.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      />

      {/* Dark overlay on top of image */}
      <div className="fixed inset-0 bg-black bg-opacity-50 pointer-events-none z-0" />


      {/* Page content as popup/card */}
      <div className="relative z-10 min-h-screen flex items-start sm:items-center justify-center px-4 sm:px-6 lg:px-8 pt-24 pb-12">

        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold text-white text-center mb-8">
            Local Pickup
          </h1>

          {/* Main card */}
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden">
            <div className="p-6 space-y-6">
              {/* Destination Section - Full Width */}
              <div className="relative">
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="destination" className="block text-sm font-medium text-gray-700">
                    Enter Destination (City)
                  </label>
                  <div className="text-xs text-orange-600 flex items-center">
                    {/* Intentionally left blank as per original design */}
                  </div>
                </div>
                <input
                  ref={destinationInputRef}
                  type="text"
                  id="destination"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="Type your city..."
                  onChange={(e) => handleInputChange(e, 'destination')}
                />
                {loading.destination && (
                  <div className="absolute right-3 top-8">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                  </div>
                )}
                {suggestions.destination.length > 0 && (
                  <SuggestionBox 
                    list={suggestions.destination} 
                    field="destination"
                    loading={loading.destination}
                  />
                )}
                {formData.destination.name && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                    <strong>Selected:</strong> {formData.destination.name}
                  </div>
                )}
              </div>

              {/* Other Fields Section */}
              <div className="pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column */}
                  <div className="space-y-6">
                    <div className="relative">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Pick-up</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={formData.pickup.category}
                          onChange={(e) => handleCategoryChange('pickup', e.target.value)}
                          className="col-span-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          {locationCategories.map(cat => (
                            <option key={`pickup-${cat}`} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="col-span-2 relative">
                          <input
                            ref={pickupInputRef}
                            type="text"
                            placeholder="Select pickup location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onChange={(e) => handleInputChange(e, 'pickup')}
                          />
                          {loading.pickup && (
                            <div className="absolute right-3 top-2.5">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                            </div>
                          )}
                          {suggestions.pickup.length > 0 && (
                            <SuggestionBox 
                              list={suggestions.pickup} 
                              field="pickup"
                              loading={loading.pickup}
                            />
                          )}
                        </div>
                      </div>
                      {formData.pickup.name && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          <strong>Selected:</strong> {formData.pickup.name}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <h3 className="text-sm font-medium text-gray-700 mb-1">Drop-off</h3>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={formData.dropoff.category}
                          onChange={(e) => handleCategoryChange('dropoff', e.target.value)}
                          className="col-span-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                        >
                          {locationCategories.map(cat => (
                            <option key={`dropoff-${cat}`} value={cat}>{cat}</option>
                          ))}
                        </select>
                        <div className="col-span-2 relative">
                          <input
                            ref={dropoffInputRef}
                            type="text"
                            placeholder="Select drop-off location"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            onChange={(e) => handleInputChange(e, 'dropoff')}
                          />
                          {loading.dropoff && (
                            <div className="absolute right-3 top-2.5">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                            </div>
                          )}
                          {suggestions.dropoff.length > 0 && (
                            <SuggestionBox 
                              list={suggestions.dropoff} 
                              field="dropoff"
                              loading={loading.dropoff}
                            />
                          )}
                        </div>
                      </div>
                      {formData.dropoff.name && (
                        <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-2 rounded-md">
                          <strong>Selected:</strong> {formData.dropoff.name}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-6">
                    <div>
                      <label
                        htmlFor="travelDate"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Travel Date
                      </label>
                      <input
                        type="date"
                        id="travelDate"
                        name="travelDate"
                        value={formData.travelDate}
                        onChange={handleChange}
                        min={today}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Time
                      </label>
                      <div className="grid grid-cols-2 gap-4">
                        <select
                          name="hour"
                          value={formData.hour}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {hours.map(h => (
                            <option key={`hour-${h}`} value={h}>{h}</option>
                          ))}
                        </select>
                        <select
                          name="minute"
                          value={formData.minute}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          {minutes.map(m => (
                            <option key={`minute-${m}`} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Passengers, Nationality, Markup and Submit button */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Passengers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Adults</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePassengerChange('adults', false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{formData.adults}</span>
                      <button
                        type="button"
                        onClick={() => handlePassengerChange('adults', true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Children</label>
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => handlePassengerChange('children', false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{formData.children}</span>
                      <button
                        type="button"
                        onClick={() => handlePassengerChange('children', true)}
                        className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 text-gray-600 hover:bg-gray-300"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200">
                <div>
                  <label
                    htmlFor="nationality"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Nationality
                  </label>
                  <select
                    id="nationality"
                    name="nationality"
                    value={formData.nationality}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Indian">Indian</option>
                    <option value="Foreigner">Foreigner</option>
                  </select>
                </div>

                {showMarkup && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Markup
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        name="markup.type"
                        value={formData.markup.type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      >
                        <option value="Flat">Flat</option>
                        <option value="Percent">Percent</option>
                      </select>
                      <input
                        type="number"
                        name="markup.value"
                        value={formData.markup.value}
                        onChange={handleChange}
                        placeholder="Value"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full bg-orange-500 text-white py-3 px-4 rounded-md font-medium hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                >
                  Let's Find
                </button>
              </div>
            </div>
          </div>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Form State</h2>
            <pre className="text-xs text-gray-700 overflow-x-auto p-2 bg-gray-50 rounded max-h-96 overflow-y-auto">
              {JSON.stringify(formData, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocalTransferPage;