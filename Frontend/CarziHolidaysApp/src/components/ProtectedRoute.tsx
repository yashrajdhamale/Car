// src/components/ProtectedRoute.tsx
import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireDriver?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireDriver = false }) => {
  const { user, isDriver, isLoading } = useAuth();
  const navigation = useNavigation();

  React.useEffect(() => {
    if (!isLoading && !user) {
      navigation.navigate('Login');
    } else if (!isLoading && requireDriver && !isDriver) {
      navigation.navigate('Home');
    }
  }, [user, isDriver, isLoading, navigation, requireDriver]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!user || (requireDriver && !isDriver)) {
    return null;
  }

  return <>{children}</>;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});