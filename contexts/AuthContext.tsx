import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User } from '@/types';

const AUTH_STORAGE_KEY = 'app_auth';
const USER_STORAGE_KEY = 'app_user';
const REMEMBER_ME_KEY = 'app_remember_me';
const REMEMBER_EMAIL_KEY = 'app_remember_email';

const secureStorage = {
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') {
      await AsyncStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return await AsyncStorage.getItem(key);
    } else {
      return await SecureStore.getItemAsync(key);
    }
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') {
      await AsyncStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadAuth();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            const appUser: User = {
              ...userData,
              id: firebaseUser.uid,
            };

            await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
            setUser(appUser);
            setIsAuthenticated(true);
          }
        } catch (error) {
          console.error('Failed to load user data:', error);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadAuth = async () => {
    try {
      console.log('[Auth] Loading auth state...');
      const [authToken, userData, rememberMe] = await Promise.all([
        secureStorage.getItem(AUTH_STORAGE_KEY),
        AsyncStorage.getItem(USER_STORAGE_KEY),
        secureStorage.getItem(REMEMBER_ME_KEY),
      ]);

      console.log('[Auth] Auth token exists:', !!authToken);
      console.log('[Auth] User data exists:', !!userData);
      console.log('[Auth] Remember me:', rememberMe);

      if (authToken && userData && rememberMe === 'true') {
        const parsedUser = JSON.parse(userData);
        console.log('[Auth] Auto-login with remembered credentials');
        setUser(parsedUser);
        setIsAuthenticated(true);
      } else {
        console.log('[Auth] No valid session found');
      }
    } catch (error) {
      console.error('[Auth] Failed to load auth:', error);
    }
  };

  const login = useCallback(async (email: string, password: string, rememberMe: boolean = false) => {
    try {
      console.log('[Auth] Login attempt for:', email, 'Remember me:', rememberMe);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const authToken = await firebaseUser.getIdToken();

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data() as User;
        const appUser: User = {
          ...userData,
          id: firebaseUser.uid,
        };

        await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
        await secureStorage.setItem(AUTH_STORAGE_KEY, authToken);
        
        if (rememberMe) {
          console.log('[Auth] Saving remember me credentials');
          await secureStorage.setItem(REMEMBER_ME_KEY, 'true');
          await secureStorage.setItem(REMEMBER_EMAIL_KEY, email);
        } else {
          console.log('[Auth] Clearing remember me credentials');
          await secureStorage.removeItem(REMEMBER_ME_KEY);
          await secureStorage.removeItem(REMEMBER_EMAIL_KEY);
        }

        setUser(appUser);
        setIsAuthenticated(true);
        console.log('[Auth] Login successful');

        return { success: true, user: appUser };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error: any) {
      console.error('[Auth] Login failed:', error);
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection';
      }
      return { success: false, error: errorMessage };
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
      console.log('[Auth] Signup attempt for:', email);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      const authToken = await firebaseUser.getIdToken();

      const appUser: User = {
        id: firebaseUser.uid,
        email,
        name,
        phone,
        role,
        verified: false,
        ...(role === 'provider' && { kycStatus: 'pending' as const }),
        createdAt: new Date().toISOString(),
      };

      const firestoreData: any = {
        email,
        name,
        phone,
        role,
        verified: false,
        createdAt: new Date().toISOString(),
      };

      if (role === 'provider') {
        firestoreData.kycStatus = 'pending';
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
      await secureStorage.setItem(AUTH_STORAGE_KEY, authToken);

      setUser(appUser);
      setIsAuthenticated(true);
      console.log('[Auth] Signup successful');

      return { success: true, user: appUser };
    } catch (error: any) {
      console.error('[Auth] Signup failed:', error);
      let errorMessage = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      console.log('[Auth] Logging out...');
      await firebaseSignOut(auth);
      await Promise.all([
        secureStorage.removeItem(AUTH_STORAGE_KEY),
        secureStorage.removeItem(REMEMBER_ME_KEY),
        secureStorage.removeItem(REMEMBER_EMAIL_KEY),
        AsyncStorage.removeItem(USER_STORAGE_KEY),
      ]);

      setUser(null);
      setIsAuthenticated(false);
      console.log('[Auth] Logout successful');
    } catch (error) {
      console.error('[Auth] Logout failed:', error);
      throw error;
    }
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...updates };
      
      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
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
        ...(role === 'provider' && { kycStatus: 'pending' as const }),
      };

      const firestoreData: any = {
        role,
      };

      if (role === 'provider') {
        firestoreData.kycStatus = 'pending';
      } else {
        delete updatedUser.kycStatus;
      }
      
      await setDoc(doc(db, 'users', user.id), firestoreData, { merge: true });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Switch role failed:', error);
    }
  }, [user]);

  const getRememberedEmail = useCallback(async () => {
    try {
      const [rememberMe, email] = await Promise.all([
        secureStorage.getItem(REMEMBER_ME_KEY),
        secureStorage.getItem(REMEMBER_EMAIL_KEY),
      ]);
      console.log('[Auth] Remember me check:', { rememberMe, hasEmail: !!email });
      if (rememberMe === 'true' && email) {
        return email;
      }
      return null;
    } catch (error) {
      console.error('[Auth] Failed to get remembered email:', error);
      return null;
    }
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error('No user logged in');

    try {
      console.log('[Auth] Updating profile:', updates);
      const updatedUser = { ...user, ...updates };
      
      await setDoc(doc(db, 'users', user.id), updates, { merge: true });
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      console.log('[Auth] Profile updated successfully');
    } catch (error) {
      console.error('[Auth] Update profile failed:', error);
      throw error;
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
      updateProfile,
      switchRole,
      getRememberedEmail,
    }),
    [user, isLoading, isAuthenticated, login, signup, logout, updateUser, updateProfile, switchRole, getRememberedEmail]
  );
});
