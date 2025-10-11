import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { NotificationSettings, Notification } from '@/types';

const NOTIFICATION_SETTINGS_KEY = '@app_notification_settings';
const NOTIFICATIONS_KEY = '@app_notifications';

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  categories: {
    booking: true,
    message: true,
    dispute: true,
    payment: true,
    promotion: true,
    system: true,
  },
};

export const [NotificationProvider, useNotifications] = createContextHook(() => {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
    loadNotifications();
  }, []);

  const loadSettings = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (stored) {
        setSettings(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATIONS_KEY);
      if (stored) {
        setNotifications(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>) => {
    try {
      const updated = { ...settings, ...newSettings };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update notification settings:', error);
    }
  }, [settings]);

  const updateCategorySettings = useCallback(async (category: keyof NotificationSettings['categories'], enabled: boolean) => {
    try {
      const updated = {
        ...settings,
        categories: {
          ...settings.categories,
          [category]: enabled,
        },
      };
      await AsyncStorage.setItem(NOTIFICATION_SETTINGS_KEY, JSON.stringify(updated));
      setSettings(updated);
    } catch (error) {
      console.error('Failed to update category settings:', error);
    }
  }, [settings]);

  const addNotification = useCallback(async (notification: Omit<Notification, 'id' | 'createdAt'>) => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
      };

      const updated = [newNotification, ...notifications];
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      setNotifications(updated);

      return newNotification;
    } catch (error) {
      console.error('Failed to add notification:', error);
      return null;
    }
  }, [notifications]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const updated = notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [notifications]);

  const markAllAsRead = useCallback(async () => {
    try {
      const updated = notifications.map(n => ({ ...n, read: true }));
      await AsyncStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
      setNotifications(updated);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);

  const clearNotifications = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(NOTIFICATIONS_KEY);
      setNotifications([]);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  return useMemo(
    () => ({
      settings,
      notifications,
      isLoading,
      unreadCount,
      updateSettings,
      updateCategorySettings,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    }),
    [
      settings,
      notifications,
      isLoading,
      unreadCount,
      updateSettings,
      updateCategorySettings,
      addNotification,
      markAsRead,
      markAllAsRead,
      clearNotifications,
    ]
  );
});
