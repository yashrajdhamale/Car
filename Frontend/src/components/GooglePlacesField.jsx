import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TextField, InputAdornment, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { LocationOn, Close, LocalAirport, Train, DirectionsBus, Hotel, Place } from '@mui/icons-material';
import { useGooglePlaces } from '../hooks/useGooglePlaces';

const CATEGORIES = [
  { value: 'Airport', label: 'Airport', icon: <LocalAirport /> },
  { value: 'Railway Station', label: 'Railway Station', icon: <Train /> },
  { value: 'Bus Station', label: 'Bus Station', icon: <DirectionsBus /> },
  { value: 'Accommodation', label: 'Accommodation', icon: <Hotel /> },
  { value: 'Landmark', label: 'Landmark', icon: <Place /> },
  { value: 'Custom Address', label: 'Custom Address', icon: <LocationOn /> }
];

const GooglePlacesField = ({
  label,
  value,
  onChange,
  onPlaceSelect,
  category,
  onCategoryChange,
  error,
  helperText,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const inputRef = useRef(null);
  const [inputValue, setInputValue] = useState(value || '');
  const [isCustomAddress, setIsCustomAddress] = useState(category === 'Custom Address');
  const [placeTypes, setPlaceTypes] = useState([]);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Determine place types based on category
  useEffect(() => {
    if (category === 'Custom Address') {
      setIsCustomAddress(true);
      setPlaceTypes([]);
      return;
    }

    setIsCustomAddress(false);
    
    const types = [];
    switch (category) {
      case 'Airport':
      case 'Railway Station':
      case 'Bus Station':
        types.push('establishment');
        break;
      case 'Accommodation':
        types.push('lodging');
        break;
      case 'Landmark':
        types.push('tourist_attraction', 'point_of_interest');
        break;
      default:
        types.push('geocode', 'establishment');
    }
    setPlaceTypes(types);
  }, [category]);

  // Handle place selection
  const handlePlaceSelect = useCallback((place) => {
    if (place && place.geometry) {
      const placeData = {
        placeId: place.placeId,
        name: place.name || '',
        address: place.address || place.name || '',
        lat: place.location?.lat || 0,
        lng: place.location?.lng || 0,
        types: place.types || []
      };
      onPlaceSelect(placeData);
      setInputValue(place.name || place.address || '');
    }
  }, [onPlaceSelect]);

  // Initialize Google Places Autocomplete
  const { autocomplete, isLoading, error: googleError } = useGooglePlaces(inputRef, {
    componentRestrictions: { country: 'in' },
    types: placeTypes,
    fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types']
  });

  // Set up event listeners when autocomplete is ready
  useEffect(() => {
    if (!autocomplete) return;

    const handlePlaceChanged = async () => {
      try {
        const place = await autocomplete.getPlace();
        handlePlaceSelect({
          ...place,
          location: place.geometry?.location?.toJSON()
        });
      } catch (err) {
        console.error('Error getting place details:', err);
      }
    };

    autocomplete.addEventListener('place_changed', handlePlaceChanged);

    return () => {
      autocomplete.removeEventListener('place_changed', handlePlaceChanged);
    };
  }, [autocomplete, handlePlaceSelect]);

  // Handle errors
  useEffect(() => {
    if (googleError) {
      console.error('Google Places Error:', googleError);
    }
  }, [googleError]);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    if (isCustomAddress) {
      // For custom addresses, call onChange with the raw value
      onChange(newValue);
      
      // Also call onPlaceSelect with custom address data
      if (onPlaceSelect) {
        onPlaceSelect({
          name: newValue,
          formatted_address: newValue,
          placeId: 'custom',
          types: ['custom_address']
        });
      }
    }
  };

  const handleCategoryChange = (e) => {
    onCategoryChange(e.target.value);
    setInputValue('');
    onChange('');
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex space-x-2">
        <FormControl variant="outlined" size="small" className="w-1/3">
          <InputLabel id={`${label}-category-label`}>Type</InputLabel>
          <Select
            labelId={`${label}-category-label`}
            value={category}
            onChange={handleCategoryChange}
            label="Type"
            disabled={disabled}
          >
            {CATEGORIES.map((cat) => (
              <MenuItem key={cat.value} value={cat.value}>
                <span>{cat.label}</span>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          fullWidth
          variant="outlined"
          label={label}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (onChange) onChange(e);
          }}
          inputRef={inputRef}
          error={googleError}
          helperText={googleError ? 'Error loading Google Maps. Please try again later.' : helperText}
          required={required}
          disabled={disabled || isLoading}
          className={className}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color="action" />
              </InputAdornment>
            ),
            endAdornment: (inputValue || isLoading) && (
              <InputAdornment position="end">
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <IconButton
                    edge="end"
                    onClick={() => {
                      setInputValue('');
                      if (onChange) onChange({ target: { value: '' } });
                      if (onPlaceSelect) onPlaceSelect(null);
                    }}
                    size="small"
                  >
                    <Close />
                  </IconButton>
                )}
              </InputAdornment>
            ),
          }}
          {...props}
        />
      </div>
    </div>
  );
};

export default GooglePlacesField;
