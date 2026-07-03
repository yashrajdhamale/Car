import React, { useState, useRef, useEffect } from 'react';
import { TextField, Paper, List, ListItem, ListItemText, ListItemIcon, Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { useMapbox } from '../contexts/MapboxContext';

const LocationSearch = ({
  label = 'Search location',
  value = '',
  onChange,
  onSelect,
  placeholder = 'Enter a location',
  fullWidth = true,
  error,
  helperText,
  disabled = false,
  showMap = true,
  ...props
}) => {
  const [inputValue, setInputValue] = useState(value || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const { searchResults, isSearching, searchPlaces, clearSearch, selectLocation } = useMapbox();
  
  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (inputValue.trim() && inputValue !== value) {
        searchPlaces(inputValue);
      } else {
        clearSearch();
      }
    }, 300);
    
    return () => clearTimeout(timer);
  }, [inputValue, searchPlaces, clearSearch, value]);

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e);
    }
  };

  const handleSelect = (location) => {
    setInputValue(location.text);
    selectLocation(location);
    if (onSelect) {
      onSelect(location);
    }
    clearSearch();
  };

  const handleFocus = (e) => {
    setIsFocused(true);
    if (props.onFocus) props.onFocus(e);
  };

  const handleBlur = (e) => {
    // Use setTimeout to allow click events on the dropdown to fire first
    setTimeout(() => {
      setIsFocused(false);
      if (props.onBlur) props.onBlur(e);
    }, 200);
  };

  return (
    <Box sx={{ position: 'relative', width: fullWidth ? '100%' : 'auto' }}>
      <TextField
        inputRef={inputRef}
        label={label}
        value={inputValue}
        onChange={handleInputChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        fullWidth={fullWidth}
        error={error}
        helperText={helperText}
        disabled={disabled}
        autoComplete="off"
        InputProps={{
          startAdornment: <LocationOnIcon sx={{ color: 'action.active', mr: 1 }} />,
          ...(isSearching && { endAdornment: <span>Searching...</span> }),
          ...props.InputProps,
        }}
        {...props}
      />
      
      {isFocused && searchResults.length > 0 && (
        <Paper 
          elevation={3} 
          sx={{
            position: 'absolute',
            width: '100%',
            maxHeight: 300,
            overflow: 'auto',
            zIndex: 1300,
            mt: 0.5,
            boxShadow: 3,
            borderRadius: 1
          }}
        >
          <List dense>
            {searchResults.map((result, index) => (
              <ListItem 
                button 
                key={`${result.id}-${index}`}
                onClick={() => handleSelect(result)}
                sx={{
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>
                  <LocationOnIcon color="action" />
                </ListItemIcon>
                <ListItemText
                  primary={result.text}
                  secondary={result.context?.join(', ')}
                  primaryTypographyProps={{
                    noWrap: true,
                    fontWeight: 'medium',
                  }}
                  secondaryTypographyProps={{
                    noWrap: true,
                    variant: 'caption',
                    color: 'text.secondary',
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
};

export default LocationSearch;
