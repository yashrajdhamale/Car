// NavigationContext.jsx
import React, { createContext, useContext, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const NavigationContext = createContext();

export const NavigationProvider = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationHistory, setNavigationHistory] = useState([]);

  const customNavigate = (path, state) => {
    setNavigationHistory(prev => [...prev, location.pathname]);
    navigate(path, state);
  };

  return (
    <NavigationContext.Provider value={{ navigationHistory, customNavigate }}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  const context = useContext(NavigationContext);
  if (!context) throw new Error('useNavigation must be used within a NavigationProvider');
  return context;
};
