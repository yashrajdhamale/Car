import React, { useEffect, useRef, useState } from 'react';
import { LocationOn, Close } from '@mui/icons-material';

const LocationAutocomplete = ({
  label,
  placeholder = 'Enter a location',
  onSelect,
  category = '',
  bounds = null,
  value = '',
  onChange,
  error = false,
  helperText = '',
  disabled = false
}) => {
  const inputRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize autocomplete
  useEffect(() => {
    if (!window.google?.maps?.places) {
      console.error('Google Maps Places API not loaded');
      return;
    }

    const types = getPlaceTypes(category);
    
    autocompleteRef.current = new window.google.maps.places.Autocomplete(
      inputRef.current,
      {
        types: types.length ? types : [],
        bounds: bounds || undefined,
        strictBounds: !!bounds,
        componentRestrictions: { country: 'in' },
        fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
      }
    );

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      
      if (place.geometry) {
        const locationData = {
          placeId: place.place_id,
          name: place.name,
          address: place.formatted_address,
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          types: place.types || []
        };
        
        onSelect?.(locationData);
        setInputValue(place.name || place.formatted_address);
      }
    });

    return () => {
      if (autocompleteRef.current) {
        window.google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [category, bounds]);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const getPlaceTypes = (category) => {
    switch (category) {
      case 'Airport':
        return ['airport'];
      case 'Railway Station':
        return ['train_station'];
      case 'Bus Station':
        return ['bus_station', 'transit_station'];
      case 'Accommodation':
        return ['lodging'];
      case 'Landmark':
        return ['tourist_attraction', 'point_of_interest'];
      case 'Custom Address':
        return ['geocode'];
      default:
        return [];
    }
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    onChange?.(e.target.value);
    
    // If category is Custom Address, update the location immediately
    if (category === 'Custom Address' && e.target.value) {
      onSelect?.({
        name: e.target.value,
        address: e.target.value,
        placeId: 'custom',
        types: ['custom_address']
      });
    }
  };

  const handleClear = () => {
    setInputValue('');
    onChange?.('');
    onSelect?.(null);
  };

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <LocationOn className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={inputValue || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          className={`block w-full pl-10 pr-10 py-2 border ${
            error ? 'border-red-300' : 'border-gray-300'
          } rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 sm:text-sm ${
            disabled ? 'bg-gray-100' : 'bg-white'
          }`}
        />
        {inputValue && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <Close className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>
      {helperText && (
        <p className={`mt-1 text-sm ${error ? 'text-red-600' : 'text-gray-500'}`}>
          {helperText}
        </p>
      )}
    </div>
  );
};

export default LocationAutocomplete;
