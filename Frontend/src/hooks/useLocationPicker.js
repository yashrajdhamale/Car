import { useState, useCallback } from 'react';

export const useLocationPicker = (initialLocation = null) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [fieldName, setFieldName] = useState('');
  const [onSelectCallback, setOnSelectCallback] = useState(null);

  const openPicker = useCallback((name, callback) => {
    setFieldName(name);
    if (callback && typeof callback === 'function') {
      setOnSelectCallback(() => callback);
    }
    setIsPickerOpen(true);
  }, []);

  const closePicker = useCallback(() => {
    setIsPickerOpen(false);
    setFieldName('');
    setOnSelectCallback(null);
  }, []);

  const handleLocationSelect = useCallback((location) => {
    setSelectedLocation(location);
    
    if (onSelectCallback) {
      onSelectCallback(fieldName, location);
    }
    
    closePicker();
  }, [fieldName, onSelectCallback, closePicker]);

  return {
    isPickerOpen,
    selectedLocation,
    fieldName,
    openPicker,
    closePicker,
    handleLocationSelect,
    setSelectedLocation
  };
};
