import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ProtectedRoute } from './src/components/ProtectedRoute';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import HomeScreen from './src/screens/HomeScreen';
import DriverDashboard from './src/screens/driver/DriverDashboard';
import LoadingScreen from './src/components/LoadingScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const { user, isDriver, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!user ? (
          // Auth screens
          <>
            <Stack.Screen 
              name="Login" 
              component={LoginScreen} 
              options={{ headerShown: false }} 
            />
            <Stack.Screen 
              name="Signup" 
              component={SignupScreen} 
              options={{ title: 'Create Account' }} 
            />
          </>
        ) : isDriver ? (
          // Driver screens
          <Stack.Screen 
            name="DriverDashboard" 
            component={DriverDashboard} 
            options={{ headerShown: false }} 
          />
        ) : (
          // User screens
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ headerShown: false }} 
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

export default App;