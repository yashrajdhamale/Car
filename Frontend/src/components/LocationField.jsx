import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  TextField, 
  InputAdornment, 
  IconButton, 
  Box, 
  Popper, 
  Paper, 
  List, 
  ListItemButton,
  ListItemText, 
  ListItemIcon,
  Typography,
  CircularProgress,
  ClickAwayListener,
  Skeleton
} from '@mui/material';
import { 
  LocationOn as LocationIcon, 
  Map as MapIcon,
  MyLocation as MyLocationIcon,
  Close as CloseIcon,
  LocalAirport as AirportIcon,
  Train as TrainIcon,
  DirectionsCar as CarIcon,
  Hotel as HotelIcon,
  DirectionsBus as DirectionsBusIcon
} from '@mui/icons-material';
import { useHereMaps } from '../contexts/HereMapsContext';
import HereMapPicker from './HereMapPicker';

const LocationField = ({
  label = 'Location',
  name,
  value = '',
  onChange,
  onLocationSelect,
  fullWidth = true,
  required = false,
  disabled = false,
  error = false,
  helperText = '',
  placeholder = 'Search for a location...',
  showMapButton = true,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  
  const inputRef = useRef(null);
  const popperRef = useRef(null);
  
  const { 
    isHereMapsLoaded,
    getPlaceSuggestions,
    getAddressFromCoordinates
  } = useHereMaps();

  // Fetch location suggestions with debounce
  const fetchSuggestions = useCallback(async (query) => {
    if (!isHereMapsLoaded || !query) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      const results = await getPlaceSuggestions(query);
      setSuggestions(results || []);
    } catch (err) {
      console.error('Error fetching suggestions:', err);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [isHereMapsLoaded, getPlaceSuggestions]);

  // Handle input change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue && inputValue.length > 2) {
        fetchSuggestions(inputValue);
      } else {
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, fetchSuggestions]);

  // Update input value when value prop changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        popperRef.current && 
        !popperRef.current.contains(event.target) && 
        inputRef.current && 
        !inputRef.current.contains(event.target)
      ) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    onChange && onChange(e);
    
    if (!value) {
      setSuggestions([]);
    }
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (suggestion) => {
    setInputValue(suggestion.title);
    setSelectedLocation(suggestion);
    setIsFocused(false);
    
    if (onLocationSelect) {
      onLocationSelect({
        text: suggestion.title,
        position: {
          lat: suggestion.position.lat,
          lng: suggestion.position.lng
        },
        address: suggestion.address,
        type: suggestion.type
      });
    }
  };

  // Handle map selection
  const handleMapSelect = (location) => {
    if (location) {
      setInputValue(location.address || 'Selected Location');
      setSelectedLocation(location);
      
      if (onLocationSelect) {
        onLocationSelect({
          text: location.address || 'Selected Location',
          position: {
            lat: location.lat,
            lng: location.lng
          },
          address: location.address,
          type: 'selected'
        });
      }
    }
    setIsMapOpen(false);
  };

  // Handle current location
  const handleCurrentLocation = async () => {
    if (!navigator.geolocation) {
      console.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    try {
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          (error) => {
            // Suppress timeout errors
            if (error.code === 3) {
              console.log('Location request timed out in LocationField');
            } else {
              console.error('Location error in LocationField:', error);
            }
            reject(error);
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 30000 }
        );
      });

      const { latitude, longitude } = position.coords;
      const address = await getAddressFromCoordinates(latitude, longitude);
      
      if (address) {
        setInputValue(address.label);
        setSelectedLocation({
          position: { lat: latitude, lng: longitude },
          address: address.label
        });
        
        if (onLocationSelect) {
          onLocationSelect({
            text: address.label,
            position: { lat: latitude, lng: longitude },
            address: address.label,
            type: 'current_location'
          });
        }
      }
    } catch (err) {
      console.error('Error getting current location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get icon for suggestion type
  const getSuggestionIcon = (type) => {
    if (!type) return <LocationIcon color="action" fontSize="small" />;
    
    switch (type.toLowerCase()) {
      case 'airport':
        return <AirportIcon color="action" fontSize="small" />;
      case 'train':
      case 'train-station':
      case 'railway':
      case 'railway-station':
        return <TrainIcon color="action" fontSize="small" />;
      case 'car':
      case 'car-rental':
      case 'car-dealer':
        return <CarIcon color="action" fontSize="small" />;
      case 'hotel':
      case 'lodging':
        return <HotelIcon color="action" fontSize="small" />;
      case 'bus':
      case 'bus-stop':
      case 'bus-station':
        return <DirectionsBusIcon color="action" fontSize="small" />;
      default:
        return <LocationIcon color="action" fontSize="small" />;
    }
  };

  // Handle input focus
  const handleFocus = (e) => {
    setIsFocused(true);
    setAnchorEl(e.currentTarget);
    
    if (inputValue && inputValue.length > 2) {
      fetchSuggestions(inputValue);
    }
  };

  return (
    <Box sx={{ position: 'relative' }} ref={popperRef}>
      <TextField
        fullWidth={fullWidth}
        label={label}
        name={name}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        placeholder={placeholder}
        required={required}
        disabled={disabled || !isHereMapsLoaded}
        error={error}
        helperText={helperText}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              {isLoading ? (
                <CircularProgress size={20} />
              ) : (
                <LocationIcon color={error ? 'error' : 'action'} />
              )}
            </InputAdornment>
          ),
          endAdornment: (
            <>
              {inputValue && (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => {
                      setInputValue('');
                      setSelectedLocation(null);
                      onChange && onChange({ target: { name, value: '' } });
                    }}
                    edge="end"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              )}
              {showMapButton && (
                <InputAdornment position="end">
                  <IconButton 
                    edge="end" 
                    onClick={() => setIsMapOpen(true)}
                    disabled={disabled || !isHereMapsLoaded}
                    size="small"
                  >
                    <MapIcon color={error ? 'error' : 'action'} />
                  </IconButton>
                </InputAdornment>
              )}
            </>
          ),
          ref: inputRef,
        }}
        {...props}
      />
      
      {/* Suggestions Dropdown */}
      <Popper
        open={isFocused && (suggestions.length > 0 || isLoading)}
        anchorEl={anchorEl}
        placement="bottom-start"
        style={{ 
          zIndex: 1400, 
          width: anchorEl ? anchorEl.clientWidth : 'auto',
          marginTop: '4px'
        }}
        modifiers={[
          {
            name: 'flip',
            enabled: true,
            options: {
              altBoundary: true,
              rootBoundary: 'document',
              padding: 8,
            },
          },
          {
            name: 'preventOverflow',
            enabled: true,
            options: {
              altAxis: true,
              altBoundary: true,
              tether: true,
              rootBoundary: 'document',
              padding: 8,
            },
          },
        ]}
        disablePortal
      >
        <Paper 
          elevation={4} 
          sx={{ 
            width: '100%',
            maxHeight: '300px',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(0, 0, 0, 0.2)',
              borderRadius: '3px',
            },
          }}
        >
          {isLoading ? (
            <Box p={2}>
              {[...Array(3)].map((_, i) => (
                <Box key={i} display="flex" alignItems="center" p={1}>
                  <Skeleton variant="circular" width={24} height={24} sx={{ mr: 1.5 }} />
                  <Box flexGrow={1}>
                    <Skeleton width="70%" height={20} />
                    <Skeleton width="90%" height={16} />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : suggestions.length > 0 ? (
            <List dense disablePadding>
              <ListItemButton onClick={handleCurrentLocation}>
                <ListItemIcon>
                  <MyLocationIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Use current location"
                  primaryTypographyProps={{
                    variant: 'subtitle2',
                    color: 'primary',
                    fontWeight: 500,
                  }}
                />
              </ListItemButton>
              
              {suggestions.map((suggestion, index) => (
                <ListItemButton 
                  key={`${suggestion.id || index}-${suggestion.type}`}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  divider={index < suggestions.length - 1}
                >
                  <ListItemIcon>
                    {getSuggestionIcon(suggestion.type)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={suggestion.title}
                    secondary={suggestion.address || suggestion.vicinity}
                    primaryTypographyProps={{
                      variant: 'subtitle2',
                      noWrap: true,
                    }}
                    secondaryTypographyProps={{
                      variant: 'caption',
                      noWrap: true,
                    }}
                  />
                  {suggestion.distance && (
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 1, whiteSpace: 'nowrap' }}>
                      {suggestion.distance.toFixed(1)} km
                    </Typography>
                  )}
                </ListItemButton>
              ))}
            </List>
          ) : (
            <Box p={2} textAlign="center">
              <Typography variant="body2" color="text.secondary">
                No results found
              </Typography>
            </Box>
          )}
        </Paper>
      </Popper>
      
      {/* Map Picker */}
      <HereMapPicker
        open={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        onSelect={handleMapSelect}
        initialLocation={selectedLocation?.position}
      />
    </Box>
  );
};

export default LocationField;
