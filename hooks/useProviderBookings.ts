import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { Booking } from '@/types';
import {
  subscribeToUserBookings,
  startWork as startWorkService,
  completeWork as completeWorkService,
} from '@/services/firestore/bookings';

export function useProviderBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      setIsLoading(false);
      return;
    }

    console.log('[useProviderBookings] Setting up subscription for provider:', user.id);
    setIsLoading(true);

    const unsubscribe = subscribeToUserBookings(
      user.id,
      'provider',
      (updatedBookings) => {
        console.log('[useProviderBookings] Received', updatedBookings.length, 'bookings');
        setBookings(updatedBookings);
        setIsLoading(false);
        setError(null);
      }
    );

    return () => {
      console.log('[useProviderBookings] Cleaning up subscription');
      unsubscribe();
    };
  }, [user]);

  const pendingBookings = useMemo(
    () => bookings.filter((b) => b.status === 'pending'),
    [bookings]
  );

  const activeBookings = useMemo(
    () => bookings.filter((b) => ['accepted', 'confirmed', 'in-progress'].includes(b.status)),
    [bookings]
  );

  const completedBookings = useMemo(
    () => bookings.filter((b) => b.status === 'completed'),
    [bookings]
  );

  const startWork = useCallback(
    async (bookingId: string): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        console.log('[useProviderBookings] Starting work on booking:', bookingId);
        await startWorkService(bookingId, user.id);
        return { success: true };
      } catch (error: any) {
        console.error('[useProviderBookings] Failed to start work:', error);
        return { success: false, error: error.message || 'Failed to start work' };
      }
    },
    [user]
  );

  const completeWork = useCallback(
    async (
      bookingId: string,
      proofMedia?: any[]
    ): Promise<{ success: boolean; error?: string }> => {
      if (!user) {
        return { success: false, error: 'Not authenticated' };
      }

      try {
        console.log('[useProviderBookings] Completing work on booking:', bookingId);
        await completeWorkService(bookingId, user.id, proofMedia);
        return { success: true };
      } catch (error: any) {
        console.error('[useProviderBookings] Failed to complete work:', error);
        return { success: false, error: error.message || 'Failed to complete work' };
      }
    },
    [user]
  );

  return {
    bookings,
    pendingBookings,
    activeBookings,
    completedBookings,
    isLoading,
    error,
    startWork,
    completeWork,
  };
}
