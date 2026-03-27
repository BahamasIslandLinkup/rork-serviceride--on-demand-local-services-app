import { useMemo } from 'react';
import { useLocation } from '@/contexts/LocationContext';
import type { ServiceProvider } from '@/types';

export function useProviderDistance(provider: ServiceProvider): number {
  const { location, calculateDistance } = useLocation();

  return useMemo(() => {
    if (!location.coords) {
      return provider.distance;
    }

    const distance = calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      provider.latitude,
      provider.longitude
    );

    return Math.round(distance * 10) / 10;
  }, [location.coords, provider, calculateDistance]);
}

export function useProvidersWithDistance(providers: ServiceProvider[]): ServiceProvider[] {
  const { location, calculateDistance } = useLocation();

  return useMemo(() => {
    if (!location.coords) {
      return providers;
    }

    return providers.map((provider) => ({
      ...provider,
      distance: Math.round(
        calculateDistance(
          location.coords!.latitude,
          location.coords!.longitude,
          provider.latitude,
          provider.longitude
        ) * 10
      ) / 10,
    })).sort((a, b) => a.distance - b.distance);
  }, [providers, location.coords, calculateDistance]);
}
