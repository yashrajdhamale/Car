import React, { useState, useEffect, useRef } from 'react';
import { TextField, InputAdornment, IconButton, MenuItem, Select, FormControl, InputLabel } from '@mui/material';
import { LocationOn, Close, LocalAirport, Train, DirectionsBus, Hotel, Place } from '@mui/icons-material';

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
  const autocompleteRef = useRef(null);
  const [inputValue, setInputValue] = useState('');
  const [isCustomAddress, setIsCustomAddress] = useState(false);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    const initializeAutocomplete = () => {
      if (!inputRef.current) return;
      
      // Clear previous autocomplete instance if exists
      if (autocompleteRef.current) {
        window.google.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }

      // Determine types based on category
      let types = [];
      switch(category) {
        case 'Airport':
        case 'Railway Station':
        case 'Bus Station':
          types = ['establishment'];
          break;
        case 'Accommodation':
          types = ['lodging'];
          break;
        case 'Landmark':
          types = ['tourist_attraction', 'point_of_interest'];
          break;
        default:
          types = [];
      }

      // Create new autocomplete instance
      const autocomplete = new window.google.maps.places.Autocomplete(
        inputRef.current,
        {
          types: types.length > 0 ? types : ['geocode', 'establishment'],
          componentRestrictions: { country: 'in' },
          fields: ['place_id', 'name', 'formatted_address', 'geometry', 'types'],
          strictBounds: false
        }
      );

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          const placeData = {
            placeId: place.place_id,
            name: place.name,
            address: place.formatted_address,
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
            types: place.types || []
          };
          onPlaceSelect(placeData);
          setInputValue(place.name || place.formatted_address);
        }
      });

      autocompleteRef.current = autocomplete;
    };

    if (category === 'Custom Address') {
      setIsCustomAddress(true);
      if (autocompleteRef.current) {
        window.google.maps?.event?.clearInstanceListeners(autocompleteRef.current);
        autocompleteRef.current = null;
      }
      return;
    }

    setIsCustomAddress(false);
    
    // Check if Google Maps API is loaded
    const checkGoogleMaps = () => {
      if (!window.google?.maps?.places) {
        console.log('Google Maps API not loaded yet, retrying...');
        setTimeout(checkGoogleMaps, 100);
        return;
      }
      initializeAutocomplete();
    };

    checkGoogleMaps();

    // Cleanup function
    return () => {
      if (autocompleteRef.current) {
        window.google.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [category, onPlaceSelect]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (isCustomAddress) {
      onChange(value);
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
                <div className="flex items-center">
                  {cat.icon}
                  <span className="ml-2">{cat.label}</span>
                </div>
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          inputRef={inputRef}
          label={label}
          value={isCustomAddress ? value : inputValue}
          onChange={handleInputChange}
          variant="outlined"
          fullWidth
          required={required}
          disabled={disabled}
          error={error}
          helperText={helperText}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <LocationOn color={error ? 'error' : 'action'} />
              </InputAdornment>
            ),
            endAdornment: inputValue && (
              <InputAdornment position="end">
                <IconButton
                  edge="end"
                  onClick={() => {
                    setInputValue('');
                    onChange('');
                  }}
                  size="small"
                >
                  <Close fontSize="small" />
                </IconButton>
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
