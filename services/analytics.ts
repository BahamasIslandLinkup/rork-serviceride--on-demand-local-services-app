import { Platform } from 'react-native';
import { analytics } from '@/config/firebase';

type EventParams = {
  [key: string]: string | number | boolean | undefined;
};

export const Analytics = {
  logEvent: async (eventName: string, params?: EventParams) => {
    if (Platform.OS !== 'web' || !analytics) {
      console.log(`📊 Analytics (${Platform.OS}):`, eventName, params);
      return;
    }

    try {
      const { logEvent } = await import('firebase/analytics');
      logEvent(analytics, eventName, params);
      console.log(`📊 Analytics logged:`, eventName, params);
    } catch (error) {
      console.warn('Analytics error:', error);
    }
  },

  logScreenView: async (screenName: string, screenClass?: string) => {
    await Analytics.logEvent('screen_view', {
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
  },

  logLogin: async (method: string) => {
    await Analytics.logEvent('login', { method });
  },

  logSignup: async (method: string, role: string) => {
    await Analytics.logEvent('sign_up', { method, role });
  },

  logBookingCreated: async (serviceId: string, amount: number) => {
    await Analytics.logEvent('booking_created', {
      service_id: serviceId,
      value: amount,
      currency: 'USD',
    });
  },

  logBookingCompleted: async (bookingId: string, amount: number) => {
    await Analytics.logEvent('booking_completed', {
      booking_id: bookingId,
      value: amount,
      currency: 'USD',
    });
  },

  logPaymentSuccess: async (amount: number, paymentMethod: string) => {
    await Analytics.logEvent('purchase', {
      value: amount,
      currency: 'USD',
      payment_method: paymentMethod,
    });
  },

  logSearch: async (searchTerm: string, category?: string) => {
    await Analytics.logEvent('search', {
      search_term: searchTerm,
      category: category || 'all',
    });
  },

  logShare: async (contentType: string, contentId: string) => {
    await Analytics.logEvent('share', {
      content_type: contentType,
      content_id: contentId,
    });
  },

  logError: async (errorMessage: string, errorCode?: string) => {
    await Analytics.logEvent('error', {
      error_message: errorMessage,
      error_code: errorCode || 'unknown',
    });
  },

  setUserId: async (userId: string) => {
    if (Platform.OS !== 'web' || !analytics) {
      console.log(`📊 Analytics User ID set (${Platform.OS}):`, userId);
      return;
    }

    try {
      const { setUserId } = await import('firebase/analytics');
      setUserId(analytics, userId);
      console.log(`📊 Analytics User ID set:`, userId);
    } catch (error) {
      console.warn('Analytics setUserId error:', error);
    }
  },

  setUserProperties: async (properties: EventParams) => {
    if (Platform.OS !== 'web' || !analytics) {
      console.log(`📊 Analytics User Properties (${Platform.OS}):`, properties);
      return;
    }

    try {
      const { setUserProperties } = await import('firebase/analytics');
      setUserProperties(analytics, properties);
      console.log(`📊 Analytics User Properties set:`, properties);
    } catch (error) {
      console.warn('Analytics setUserProperties error:', error);
    }
  },
};

export default Analytics;
