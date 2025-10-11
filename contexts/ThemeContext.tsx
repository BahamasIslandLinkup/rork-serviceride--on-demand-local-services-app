import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Theme = 'light' | 'dark';

export const lightColors = {
  primary: '#3DDAD7',
  primaryDark: '#2AB8B5',
  secondary: '#EAC763',
  accent: '#3DDAD7',
  background: '#F5FFFE',
  backgroundGradientStart: '#F5FFFE',
  backgroundGradientEnd: '#FFFFFF',
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  text: '#1E1E1E',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  star: '#EAC763',
  overlay: 'rgba(0, 0, 0, 0.4)',
  shadow: 'rgba(61, 218, 215, 0.15)',
  glow: 'rgba(61, 218, 215, 0.3)',
};

export const darkColors = {
  primary: '#3DDAD7',
  primaryDark: '#2AB8B5',
  secondary: '#EAC763',
  accent: '#3DDAD7',
  background: '#0A0F1E',
  backgroundGradientStart: '#0A0F1E',
  backgroundGradientEnd: '#1E1E1E',
  card: '#1A1F2E',
  cardElevated: '#252A3A',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
  textLight: '#6B7280',
  border: '#374151',
  borderLight: '#2D3748',
  error: '#F87171',
  success: '#34D399',
  warning: '#FBBF24',
  star: '#EAC763',
  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: 'rgba(61, 218, 215, 0.2)',
  glow: 'rgba(61, 218, 215, 0.4)',
};

const THEME_STORAGE_KEY = '@app_theme';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        setTheme(stored);
      }
    } catch (error) {
      console.error('Failed to load theme:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTheme = useCallback(async () => {
    const newTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  }, [theme]);

  const colors = theme === 'light' ? lightColors : darkColors;

  return useMemo(
    () => ({
      theme,
      colors,
      toggleTheme,
      isLoading,
      isDark: theme === 'dark',
    }),
    [theme, colors, toggleTheme, isLoading]
  );
});
