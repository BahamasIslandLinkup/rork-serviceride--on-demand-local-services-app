import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import * as Location from 'expo-location';
import { Platform } from 'react-native';

export type LocationCoords = {
  latitude: number;
  longitude: number;
};

export type LocationData = {
  coords: LocationCoords | null;
  address: string | null;
  city: string | null;
  error: string | null;
};

export const [LocationProvider, useLocation] = createContextHook(() => {
  const [location, setLocation] = useState<LocationData>({
    coords: null,
    address: null,
    city: null,
    error: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    requestLocationPermission();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestLocationPermission = async () => {
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              setHasPermission(true);
              await updateLocation(coords);
            },
            (error) => {
              let errorMessage = 'Failed to get location';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied. Please enable location in your browser settings.';
                  console.log('[Location] User denied location permission - using default location');
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location information unavailable. Please check your device settings.';
                  console.log('[Location] Position unavailable - using default location');
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out. Please try again.';
                  console.log('[Location] Location request timeout - using default location');
                  break;
                default:
                  errorMessage = 'An unknown error occurred while getting location.';
                  console.log('[Location] Unknown geolocation error:', error.message);
              }
              
              setLocation({
                coords: null,
                address: null,
                city: 'Nassau, Bahamas',
                error: errorMessage,
              });
              setIsLoading(false);
            }
          );
        } else {
          console.log('[Location] Geolocation not supported - using default location');
          setLocation({
            coords: null,
            address: null,
            city: 'Nassau, Bahamas',
            error: 'Geolocation not supported',
          });
          setIsLoading(false);
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        console.log('[Location] Permission status:', status);
        
        if (status !== 'granted') {
          console.log('[Location] Permission denied - using default location');
          setLocation({
            coords: null,
            address: null,
            city: 'Nassau, Bahamas',
            error: 'Location permission denied',
          });
          setIsLoading(false);
          return;
        }

        setHasPermission(true);
        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        await updateLocation(coords);
      }
    } catch (error) {
      console.log('[Location] Permission error - using default location:', error);
      setLocation({
        coords: null,
        address: null,
        city: 'Nassau, Bahamas',
        error: 'Failed to get location',
      });
      setIsLoading(false);
    }
  };

  const updateLocation = async (coords: LocationCoords) => {
    try {
      if (Platform.OS !== 'web') {
        const [geocode] = await Location.reverseGeocodeAsync(coords);
        setLocation({
          coords,
          address: geocode
            ? `${geocode.street || ''} ${geocode.name || ''}`.trim()
            : null,
          city: geocode
            ? `${geocode.city || ''}, ${geocode.region || ''}`.trim()
            : null,
          error: null,
        });
      } else {
        setLocation({
          coords,
          address: null,
          city: 'Current Location',
          error: null,
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocation({
        coords,
        address: null,
        city: 'Current Location',
        error: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshLocation = useCallback(async () => {
    if (!hasPermission) {
      await requestLocationPermission();
      return;
    }

    setIsLoading(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const coords = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              };
              await updateLocation(coords);
            },
            (error) => {
              let errorMessage = 'Failed to refresh location';
              
              switch (error.code) {
                case error.PERMISSION_DENIED:
                  errorMessage = 'Location permission denied';
                  console.log('[Location] Permission denied on refresh');
                  break;
                case error.POSITION_UNAVAILABLE:
                  errorMessage = 'Location unavailable';
                  console.log('[Location] Position unavailable on refresh');
                  break;
                case error.TIMEOUT:
                  errorMessage = 'Location request timed out';
                  console.log('[Location] Timeout on refresh');
                  break;
                default:
                  console.log('[Location] Unknown error on refresh:', error.message);
              }
              
              setLocation((prev) => ({
                ...prev,
                error: errorMessage,
              }));
              setIsLoading(false);
            }
          );
        }
      } else {
        const currentLocation = await Location.getCurrentPositionAsync({});
        const coords = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        };
        await updateLocation(coords);
      }
    } catch (error) {
      console.error('Refresh location error:', error);
      setIsLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPermission]);

  const calculateDistance = useCallback(
    (
      lat1: number,
      lon1: number,
      lat2: number,
      lon2: number
    ): number => {
      const R = 3959;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLon = ((lon2 - lon1) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    []
  );

  return useMemo(
    () => ({
      location,
      isLoading,
      hasPermission,
      refreshLocation,
      calculateDistance,
    }),
    [location, isLoading, hasPermission, refreshLocation, calculateDistance]
  );
});
