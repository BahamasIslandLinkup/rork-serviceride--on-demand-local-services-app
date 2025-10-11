import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';
import { createBooking as createBookingFirestore, updateBookingStatus, getUserBookings } from '@/services/firestore/bookings';
import type { Booking } from '@/types';

const MOCK_AUTO_ACCEPT_KEY = '@app_mock_auto_accept';

export const [BookingProvider, useBooking] = createContextHook(() => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [mockAutoAccept, setMockAutoAccept] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMockAutoAcceptSetting();
  }, []);

  const loadMockAutoAcceptSetting = async () => {
    try {
      const value = await AsyncStorage.getItem(MOCK_AUTO_ACCEPT_KEY);
      setMockAutoAccept(value === 'true');
    } catch (error) {
      console.error('[Booking] Failed to load mock auto-accept setting:', error);
    }
  };

  const toggleMockAutoAccept = useCallback(async () => {
    try {
      const newValue = !mockAutoAccept;
      await AsyncStorage.setItem(MOCK_AUTO_ACCEPT_KEY, String(newValue));
      setMockAutoAccept(newValue);
      console.log('[Booking] Mock auto-accept:', newValue);
    } catch (error) {
      console.error('[Booking] Failed to toggle mock auto-accept:', error);
    }
  }, [mockAutoAccept]);

  const createBooking = useCallback(async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      console.log('[Booking] Creating booking:', bookingData);
      setIsLoading(true);

      const newBooking: Omit<Booking, 'id'> = {
        ...bookingData,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const bookingId = await createBookingFirestore(newBooking);
      console.log('[Booking] Booking created with ID:', bookingId);

      const createdBooking: Booking = {
        ...newBooking,
        id: bookingId,
      };

      setBookings(prev => [createdBooking, ...prev]);

      if (user) {
        addNotification({
          userId: user.id,
          title: 'Booking Created',
          body: `Your booking with ${bookingData.providerName} has been created`,
          type: 'booking',
          data: { bookingId },
          read: false,
        });
      }

      if (mockAutoAccept) {
        console.log('[Booking] Mock auto-accept enabled, auto-accepting in 2s...');
        setTimeout(async () => {
          try {
            await updateBookingStatus(bookingId, 'accepted');
            setBookings(prev => prev.map(b => 
              b.id === bookingId ? { ...b, status: 'accepted' as const, updatedAt: new Date().toISOString() } : b
            ));
            if (user) {
              addNotification({
                userId: user.id,
                title: 'Booking Accepted',
                body: `${bookingData.providerName} has accepted your booking`,
                type: 'booking',
                data: { bookingId },
                read: false,
              });
            }
            console.log('[Booking] Auto-accepted booking:', bookingId);
          } catch (error) {
            console.error('[Booking] Auto-accept failed:', error);
          }
        }, 2000);
      }

      return { success: true, bookingId };
    } catch (error) {
      console.error('[Booking] Failed to create booking:', error);
      return { success: false, error: 'Failed to create booking' };
    } finally {
      setIsLoading(false);
    }
  }, [mockAutoAccept, addNotification]);

  const acceptBooking = useCallback(async (bookingId: string) => {
    try {
      console.log('[Booking] Accepting booking:', bookingId);
      await updateBookingStatus(bookingId, 'accepted');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'accepted' as const, updatedAt: new Date().toISOString() } : b
      ));

      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user) {
        addNotification({
          userId: user.id,
          title: 'Booking Accepted',
          body: `${booking.providerName} has accepted your booking`,
          type: 'booking',
          data: { bookingId },
          read: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Booking] Failed to accept booking:', error);
      return { success: false, error: 'Failed to accept booking' };
    }
  }, [bookings, addNotification]);

  const declineBooking = useCallback(async (bookingId: string, reason: string) => {
    try {
      console.log('[Booking] Declining booking:', bookingId, 'Reason:', reason);
      await updateBookingStatus(bookingId, 'declined');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { 
          ...b, 
          status: 'declined' as const, 
          declineReason: reason,
          updatedAt: new Date().toISOString() 
        } : b
      ));

      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user) {
        addNotification({
          userId: user.id,
          title: 'Booking Declined',
          body: `${booking.providerName} has declined your booking`,
          type: 'booking',
          data: { bookingId, reason },
          read: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Booking] Failed to decline booking:', error);
      return { success: false, error: 'Failed to decline booking' };
    }
  }, [bookings, addNotification]);

  const startBooking = useCallback(async (bookingId: string) => {
    try {
      console.log('[Booking] Starting booking:', bookingId);
      await updateBookingStatus(bookingId, 'in-progress');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'in-progress' as const, updatedAt: new Date().toISOString() } : b
      ));

      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user) {
        addNotification({
          userId: user.id,
          title: 'Service Started',
          body: `${booking.providerName} has started your service`,
          type: 'booking',
          data: { bookingId },
          read: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Booking] Failed to start booking:', error);
      return { success: false, error: 'Failed to start booking' };
    }
  }, [bookings, addNotification]);

  const completeBooking = useCallback(async (bookingId: string) => {
    try {
      console.log('[Booking] Completing booking:', bookingId);
      await updateBookingStatus(bookingId, 'completed');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'completed' as const, updatedAt: new Date().toISOString() } : b
      ));

      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user) {
        addNotification({
          userId: user.id,
          title: 'Service Completed',
          body: `Your service with ${booking.providerName} is complete`,
          type: 'booking',
          data: { bookingId },
          read: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Booking] Failed to complete booking:', error);
      return { success: false, error: 'Failed to complete booking' };
    }
  }, [bookings, addNotification]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      console.log('[Booking] Cancelling booking:', bookingId);
      await updateBookingStatus(bookingId, 'cancelled');
      
      setBookings(prev => prev.map(b => 
        b.id === bookingId ? { ...b, status: 'cancelled' as const, updatedAt: new Date().toISOString() } : b
      ));

      const booking = bookings.find(b => b.id === bookingId);
      if (booking && user) {
        addNotification({
          userId: user.id,
          title: 'Booking Cancelled',
          body: `Your booking with ${booking.providerName} has been cancelled`,
          type: 'booking',
          data: { bookingId },
          read: false,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('[Booking] Failed to cancel booking:', error);
      return { success: false, error: 'Failed to cancel booking' };
    }
  }, [bookings, addNotification]);

  const refreshBookings = useCallback(async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const role = user.role === 'admin' ? 'customer' : user.role;
      const fetchedBookings = await getUserBookings(user.id, role);
      setBookings(fetchedBookings);
    } catch (error) {
      console.error('[Booking] Failed to refresh bookings:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return useMemo(
    () => ({
      bookings,
      isLoading,
      mockAutoAccept,
      toggleMockAutoAccept,
      createBooking,
      acceptBooking,
      declineBooking,
      startBooking,
      completeBooking,
      cancelBooking,
      refreshBookings,
    }),
    [
      bookings,
      isLoading,
      mockAutoAccept,
      toggleMockAutoAccept,
      createBooking,
      acceptBooking,
      declineBooking,
      startBooking,
      completeBooking,
      cancelBooking,
      refreshBookings,
    ]
  );
});
