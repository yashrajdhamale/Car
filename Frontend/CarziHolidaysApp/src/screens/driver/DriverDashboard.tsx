import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Platform, 
  Alert, 
  ScrollView, 
  ActivityIndicator 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { RootNavigationProp } from '../../navigation/AppNavigator';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';

// Types
type RideRequest = {
  id: string;
  pickup: string;
  dropoff: string;
  status: 'pending' | 'accepted' | 'completed' | 'cancelled';
  type: 'outstation' | 'holiday';
  createdAt: Date;
};

type RideAction = 'accept' | 'complete' | 'cancel';

// Configure notifications handler
// Configure notifications handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Show in the notification shade
    shouldShowList: true,    // Show in the notification center
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const Tab = createMaterialTopTabNavigator();

// Tab Screens
interface AllRidesScreenProps {
  rideRequests: RideRequest[];
  onRideAction: (id: string, action: RideAction) => void;
  loading: boolean;
}

const AllRidesScreen: React.FC<AllRidesScreenProps> = ({ 
  rideRequests, 
  onRideAction, 
  loading 
}) => {
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading ride requests...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {rideRequests.length === 0 ? (
        <View style={styles.noRidesContainer}>
          <Text style={styles.noRidesText}>No ride requests available</Text>
        </View>
      ) : (
        rideRequests.map((ride) => (
          <RideRequestCard
            key={ride.id}
            ride={ride}
            onAction={onRideAction}
          />
        ))
      )}
    </ScrollView>
  );
};

interface RideRequestCardProps {
  ride: RideRequest;
  onAction: (id: string, action: RideAction) => void;
}

const RideRequestCard: React.FC<RideRequestCardProps> = ({ ride, onAction }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500'; // Orange
      case 'accepted': return '#4CAF50'; // Green
      case 'completed': return '#2196F3'; // Blue
      case 'cancelled': return '#F44336'; // Red
      default: return '#9E9E9E'; // Grey
    }
  };

  return (
    <View style={[styles.rideCard, { borderLeftColor: getStatusColor(ride.status) }]}>
      <View style={styles.rideHeader}>
        <Text style={styles.rideType}>
          {ride.type === 'outstation' ? 'Outstation' : 'Holiday Package'}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ride.status) }]}>
          <Text style={styles.statusText}>{ride.status.toUpperCase()}</Text>
        </View>
      </View>
      
      <View style={styles.rideDetails}>
        <View style={styles.locationRow}>
          <View style={styles.locationDot} />
          <Text style={styles.locationText}>{ride.pickup}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.locationRow}>
          <View style={[styles.locationDot, { backgroundColor: '#F44336' }]} />
          <Text style={styles.locationText}>{ride.dropoff}</Text>
        </View>
      </View>

      {ride.status === 'pending' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => onAction(ride.id, 'accept')}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#F44336' }]}
            onPress={() => onAction(ride.id, 'cancel')}
          >
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {ride.status === 'accepted' && (
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => onAction(ride.id, 'complete')}
          >
            <Text style={styles.buttonText}>Mark Complete</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const DriverDashboard: React.FC = () => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [rideRequests, setRideRequests] = useState<RideRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const navigation = useNavigation<RootNavigationProp>();

  // Mock data - replace with your actual data fetching logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setRideRequests([
        { 
          id: '1', 
          pickup: '123 Main St, City', 
          dropoff: '456 Park Ave, Destination', 
          status: 'pending',
          type: 'outstation',
          createdAt: new Date()
        },
        { 
          id: '2', 
          pickup: '789 Beach Rd', 
          dropoff: '321 Mountain View', 
          status: 'pending',
          type: 'holiday',
          createdAt: new Date()
        },
      ]);
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  // Request location permissions and track location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      const locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        (newLocation) => {
          setLocation(newLocation);
          console.log('Location updated:', newLocation.coords);
        }
      );

      return () => locationSubscription?.remove();
    })();
  }, []);

  // Request notification permissions
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Notifications are needed for ride updates');
      }
    })();
  }, []);

  const handleRideAction = (rideId: string, action: RideAction) => {
    setRideRequests(prevRides =>
      prevRides.map(ride =>
        ride.id === rideId
          ? { 
              ...ride, 
              status: action === 'accept' ? 'accepted' : 
                     action === 'complete' ? 'completed' : 'cancelled' 
            }
          : ride
      )
    );

    scheduleNotification(
      'Ride Update',
      `Ride ${action === 'accept' ? 'accepted' : action === 'complete' ? 'completed' : 'cancelled'} successfully!`
    );
  };

    const playNotification = async (message: string) => {
    try {
      // Play notification sound
      const { sound } = await Audio.Sound.createAsync(
        require('../../../assets/notification.mp3')
      );
      
      // Play the sound 3 times with speech in between
      for (let i = 0; i < 3; i++) {
        await sound.playAsync();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for sound to finish
        
        // Speak the message in Hindi
        await Speech.speak(message, {
          language: 'hi-IN',
          rate: 0.9,
        });
        
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay between iterations
      }
      
      // Unload the sound when done
      await sound.unloadAsync();
    } catch (error) {
      console.error('Error playing notification:', error);
    }
  };

  const scheduleNotification = async (title: string, body: string) => {
  try {
    // First play the notification sound and speech
    await playNotification(body);

    // Then schedule the notification
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { data: 'ride_update' },
        sound: 'notification.wav', // This should match the actual sound file name
      },
      trigger: { 
        seconds: 1,
        repeats: false,
      },
    });
  } catch (error) {
    console.error('Error in scheduleNotification:', error);
  }
};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Driver Dashboard</Text>
        {location && (
          <View style={styles.locationContainer}>
            <View style={[styles.locationDot, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.locationText}>
              {location.coords.latitude.toFixed(4)}, {location.coords.longitude.toFixed(4)}
            </Text>
          </View>
        )}
      </View>

      {errorMsg && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{errorMsg}</Text>
        </View>
      )}

      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: 'gray',
          tabBarIndicatorStyle: { backgroundColor: '#007AFF' },
          tabBarLabelStyle: { fontWeight: 'bold' },
        }}
      >
        <Tab.Screen name="All Rides">
          {() => (
            <AllRidesScreen 
              rideRequests={rideRequests} 
              onRideAction={handleRideAction} 
              loading={loading}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Outstation">
          {() => (
            <AllRidesScreen 
              rideRequests={rideRequests.filter(ride => ride.type === 'outstation')} 
              onRideAction={handleRideAction} 
              loading={loading}
            />
          )}
        </Tab.Screen>
        <Tab.Screen name="Holiday">
          {() => (
            <AllRidesScreen 
              rideRequests={rideRequests.filter(ride => ride.type === 'holiday')} 
              onRideAction={handleRideAction} 
              loading={loading}
            />
          )}
        </Tab.Screen>
      </Tab.Navigator>

      <TouchableOpacity 
        style={styles.logoutButton} 
        onPress={() => navigation.navigate('Home')}
      >
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    margin: 8,
    borderRadius: 6,
  },
  errorText: {
    color: '#D32F2F',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#666',
    fontSize: 16,
  },
  rideCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
  },
  rideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rideType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  rideDetails: {
    marginBottom: 16,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
    marginLeft: 6,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  noRidesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noRidesText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#f44336',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DriverDashboard;