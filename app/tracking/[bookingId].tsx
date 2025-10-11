import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { Car, Navigation, Clock, MapPin } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { mockBookings } from '@/mocks/services';
import type { ProviderLocation } from '@/types';

export default function TrackingScreen() {
  const { bookingId } = useLocalSearchParams();
  const { colors } = useTheme();
  const [providerLocation, setProviderLocation] = useState<ProviderLocation | null>(null);
  const [userLocation, setUserLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [distance, setDistance] = useState<number>(0);
  const [eta, setEta] = useState<string>('Calculating...');

  const booking = mockBookings.find(b => b.id === bookingId);

  useEffect(() => {
    requestLocationPermission();
    simulateProviderTracking();
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Location permission is required to track your provider.');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      setUserLocation(location);
      setIsLoading(false);
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get your location');
      setIsLoading(false);
    }
  };

  const simulateProviderTracking = () => {
    const mockProviderLocation: ProviderLocation = {
      latitude: 25.0343 + (Math.random() - 0.5) * 0.01,
      longitude: -77.3963 + (Math.random() - 0.5) * 0.01,
      heading: Math.random() * 360,
      speed: 20 + Math.random() * 20,
      timestamp: new Date().toISOString(),
    };
    setProviderLocation(mockProviderLocation);

    const interval = setInterval(() => {
      setProviderLocation(prev => {
        if (!prev) return mockProviderLocation;
        return {
          ...prev,
          latitude: prev.latitude + (Math.random() - 0.5) * 0.001,
          longitude: prev.longitude + (Math.random() - 0.5) * 0.001,
          heading: (prev.heading || 0) + (Math.random() - 0.5) * 20,
          timestamp: new Date().toISOString(),
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  };

  useEffect(() => {
    if (userLocation && providerLocation) {
      const dist = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        providerLocation.latitude,
        providerLocation.longitude
      );
      setDistance(dist);
      
      const speed = providerLocation.speed || 30;
      const timeInHours = dist / speed;
      const timeInMinutes = Math.ceil(timeInHours * 60);
      setEta(`${timeInMinutes} min`);
    }
  }, [userLocation, providerLocation]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Tracking' }} />
        <Text style={[styles.errorText, { color: colors.text }]}>Booking not found</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Tracking' }} />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading map...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Track Provider',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {userLocation && providerLocation && (
        <View style={[styles.mapFallback, { backgroundColor: colors.background }]}>
          <View style={[styles.mapContent, { backgroundColor: colors.card }]}>
            <MapPin size={48} color={colors.primary} />
            <Text style={[styles.mapTitle, { color: colors.text }]}>Live Tracking</Text>
            <Text style={[styles.mapSubtitle, { color: colors.textSecondary }]}>
              Provider location updates in real-time
            </Text>
            <View style={styles.coordinates}>
              <View style={styles.coordItem}>
                <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>Your Location</Text>
                <Text style={[styles.coordValue, { color: colors.text }]}>
                  {userLocation.coords.latitude.toFixed(4)}, {userLocation.coords.longitude.toFixed(4)}
                </Text>
              </View>
              <View style={styles.coordItem}>
                <Text style={[styles.coordLabel, { color: colors.textSecondary }]}>Provider Location</Text>
                <Text style={[styles.coordValue, { color: colors.text }]}>
                  {providerLocation.latitude.toFixed(4)}, {providerLocation.longitude.toFixed(4)}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
        <View style={styles.providerInfo}>
          <Text style={[styles.providerName, { color: colors.text }]}>{booking.providerName}</Text>
          <Text style={[styles.service, { color: colors.textSecondary }]}>{booking.service}</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Navigation size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{distance.toFixed(1)} km</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Distance</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statItem}>
            <Clock size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.text }]}>{eta}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>ETA</Text>
          </View>
        </View>

        {booking.vehicleInfo && (
          <View style={[styles.vehicleCard, { backgroundColor: colors.background }]}>
            <View style={styles.vehicleHeader}>
              <Car size={20} color={colors.primary} />
              <Text style={[styles.vehicleTitle, { color: colors.text }]}>Vehicle Details</Text>
            </View>
            <View style={styles.vehicleDetails}>
              <Text style={[styles.vehicleText, { color: colors.text }]}>
                {booking.vehicleInfo.year} {booking.vehicleInfo.make} {booking.vehicleInfo.model}
              </Text>
              <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                {booking.vehicleInfo.color} • {booking.vehicleInfo.licensePlate}
              </Text>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoCard: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  providerInfo: {
    marginBottom: 20,
  },
  providerName: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  service: {
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
  },
  divider: {
    width: 1,
    height: 40,
  },
  vehicleCard: {
    borderRadius: 12,
    padding: 16,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  vehicleDetails: {
    gap: 4,
  },
  vehicleText: {
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  errorText: {
    fontSize: 16,
  },
  mapFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mapContent: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 400,
    width: '100%',
  },
  mapTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  mapSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  coordinates: {
    width: '100%',
    gap: 16,
  },
  coordItem: {
    gap: 4,
  },
  coordLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
  },
  coordValue: {
    fontSize: 14,
  },
});
