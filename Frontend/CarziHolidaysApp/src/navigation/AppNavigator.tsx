import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';

// Screens
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DriverDashboard from '../screens/driver/DriverDashboard';

// Types
type RootStackParamList = {
  Home: undefined;
  Login: undefined;
  Signup: undefined;
  DriverDashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Carzi Holidays' }} 
        />
        <Stack.Screen 
          name="Login" 
          component={LoginScreen} 
          options={{ title: 'Login' }} 
        />
        <Stack.Screen 
          name="Signup" 
          component={SignupScreen} 
          options={{ title: 'Sign Up' }} 
        />
        <Stack.Screen 
          name="DriverDashboard" 
          component={DriverDashboard} 
          options={{ title: 'Driver Dashboard', headerShown: false }} 
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
