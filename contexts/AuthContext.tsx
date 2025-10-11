import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types';

const AUTH_STORAGE_KEY = '@app_auth';
const USER_STORAGE_KEY = '@app_user';

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadAuth();
  }, []);

  const loadAuth = async () => {
    try {
      const [authToken, userData] = await Promise.all([
        AsyncStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
      ]);

      if (authToken && userData) {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    try {
      const mockUser: User = {
        id: 'user1',
        email,
        name: 'John Smith',
        phone: '+1 (555) 123-4567',
        role: 'customer',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
        verified: true,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, mockToken),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser)),
      ]);

      setUser(mockUser);
      setIsAuthenticated(true);

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Login failed' };
    }
  }, []);

  const signup = useCallback(async (
    email: string,
    password: string,
    name: string,
    phone: string,
    role: 'customer' | 'provider'
  ) => {
    try {
      const mockUser: User = {
        id: 'user_' + Date.now(),
        email,
        name,
        phone,
        role,
        verified: false,
        kycStatus: role === 'provider' ? 'pending' : undefined,
        createdAt: new Date().toISOString(),
      };

      const mockToken = 'mock_jwt_token_' + Date.now();

      await Promise.all([
        AsyncStorage.setItem(AUTH_STORAGE_KEY, mockToken),
        AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUser)),
      ]);

      setUser(mockUser);
      setIsAuthenticated(true);

      return { success: true, user: mockUser };
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'Signup failed' };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(AUTH_STORAGE_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);

      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Update user failed:', error);
    }
  }, [user]);

  const switchRole = useCallback(async (role: 'customer' | 'provider') => {
    if (!user) return;

    try {
      const updatedUser: User = {
        ...user,
        role,
        kycStatus: role === 'provider' ? 'pending' : undefined,
      };
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Switch role failed:', error);
    }
  }, [user]);

  return useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated,
      isProvider: user?.role === 'provider',
      isCustomer: user?.role === 'customer',
      login,
      signup,
      logout,
      updateUser,
      switchRole,
    }),
    [user, isLoading, isAuthenticated, login, signup, logout, updateUser, switchRole]
  );
});
