import React, { useEffect, useRef, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  IconButton,
  CircularProgress,
  Typography,
  useTheme,
} from '@mui/material';
import { Close as CloseIcon, MyLocation as MyLocationIcon } from '@mui/icons-material';
import { useHereMaps } from '../contexts/HereMapsContext';

const HereMapPicker = ({ open, onClose, onSelect, initialLocation }) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [marker, setMarker] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [center, setCenter] = useState(
    initialLocation || { lat: 18.5204, lng: 73.8567 } // Default to Pune
  );
  const [selectedPosition, setSelectedPosition] = useState(initialLocation);
  const [address, setAddress] = useState('');
  const theme = useTheme();
  const { hereMaps, getAddressFromCoordinates } = useHereMaps();

  // Initialize map when component mounts and HERE Maps is loaded
  useEffect(() => {
    if (!open || !hereMaps) return;

    let hereMap = null;
    let behavior = null;
    let ui = null;

    const initMap = async () => {
      try {
        // Create map instance
        hereMap = new hereMaps.Map(mapRef.current, {
          center: { ...center },
          zoom: 14,
          pixelRatio: window.devicePixelRatio || 1,
        });

        // Add behavior to the map
        behavior = new hereMaps.mapevents.Behavior(
          new hereMaps.mapevents.MapEvents(hereMap)
        );

        // Add default UI
        ui = hereMaps.ui.UI.createDefault(hereMap, hereMaps.service.Platform.createDefaultLayers());
        
        // Add marker for selected location
        if (initialLocation) {
          const newMarker = new hereMaps.map.Marker({
            lat: initialLocation.lat,
            lng: initialLocation.lng,
          });
          hereMap.addObject(newMarker);
          setMarker(newMarker);
          updateAddress(initialLocation.lat, initialLocation.lng);
        }

        // Handle map click
        hereMap.addEventListener('tap', (evt) => {
          const coord = hereMap.screenToGeo(
            evt.currentPointer.viewportX,
            evt.currentPointer.viewportY
          );
          
          setSelectedPosition(coord);
          updateMarker(coord);
          updateAddress(coord.lat, coord.lng);
        });

        setMap(hereMap);
        setIsLoading(false);
      } catch (err) {
        console.error('Error initializing map:', err);
        setError('Failed to initialize map. Please try again.');
        setIsLoading(false);
      }
    };

    const updateMarker = (coord) => {
      if (!hereMap) return;
      
      // Remove existing marker
      if (marker) {
        hereMap.removeObject(marker);
      }
      
      // Add new marker
      const newMarker = new hereMaps.map.Marker({
        lat: coord.lat,
        lng: coord.lng,
      });
      
      hereMap.addObject(newMarker);
      setMarker(newMarker);
      
      // Center map on marker
      hereMap.setCenter(coord);
    };

    const updateAddress = async (lat, lng) => {
      try {
        const address = await getAddressFromCoordinates(lat, lng);
        if (address) {
          setAddress(address.label);
        }
      } catch (err) {
        console.error('Error getting address:', err);
        setAddress('Address not available');
      }
    };

    initMap();

    // Cleanup
    return () => {
      if (hereMap) {
        hereMap.dispose();
      }
    };
  }, [open, hereMaps]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPosition = { lat: latitude, lng: longitude };
        
        setCenter(newPosition);
        setSelectedPosition(newPosition);
        
        if (map && marker) {
          map.removeObject(marker);
          const newMarker = new hereMaps.map.Marker({
            lat: latitude,
            lng: longitude,
          });
          map.addObject(newMarker);
          map.setCenter(newPosition);
          setMarker(newMarker);
          
          await updateAddress(latitude, longitude);
        }
        
        setIsLoading(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        setError('Unable to retrieve your location');
        setIsLoading(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleConfirm = () => {
    if (selectedPosition) {
      onSelect(selectedPosition);
    }
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          height: '80vh',
          maxHeight: '800px',
          width: '90%',
          maxWidth: '1200px',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Select Location</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers style={{ padding: 0, position: 'relative' }}>
        {isLoading && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            display="flex"
            alignItems="center"
            justifyContent="center"
            bgcolor="rgba(255, 255, 255, 0.7)"
            zIndex={1}
          >
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            p={2}
            bgcolor="error.light"
            color="error.contrastText"
            zIndex={1}
          >
            <Typography>{error}</Typography>
          </Box>
        )}
        
        <Box
          ref={mapRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '400px',
          }}
        />
        
        <Box
          position="absolute"
          bottom={16}
          left={16}
          right={16}
          p={2}
          bgcolor="background.paper"
          borderRadius={1}
          boxShadow={3}
          zIndex={1}
        >
          <Typography variant="subtitle2" color="textSecondary">
            Selected Location:
          </Typography>
          <Typography variant="body1">
            {address || 'Tap on the map to select a location'}
          </Typography>
        </Box>
        
        <IconButton
          onClick={handleCurrentLocation}
          color="primary"
          style={{
            position: 'absolute',
            bottom: 100,
            right: 16,
            backgroundColor: theme.palette.background.paper,
            boxShadow: theme.shadows[3],
            zIndex: 1,
          }}
          disabled={isLoading}
        >
          <MyLocationIcon />
        </IconButton>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="primary"
          variant="contained"
          disabled={!selectedPosition || isLoading}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default HereMapPicker;
