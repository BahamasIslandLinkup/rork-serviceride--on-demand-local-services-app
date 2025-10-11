import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

const AUTH_STORAGE_KEY = '@app_auth';
const USER_STORAGE_KEY = '@app_user';

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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

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

        return { success: true, user: appUser };
      } else {
        return { success: false, error: 'User profile not found' };
      }
    } catch (error: any) {
      console.error('Login failed:', error);
      let errorMessage = 'Login failed';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later';
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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      const appUser: User = {
        id: firebaseUser.uid,
        email,
        name,
        phone,
        role,
        verified: false,
        kycStatus: role === 'provider' ? 'pending' : undefined,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), appUser);
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));

      setUser(appUser);
      setIsAuthenticated(true);

      return { success: true, user: appUser };
    } catch (error: any) {
      console.error('Signup failed:', error);
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
      await firebaseSignOut(auth);
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
        kycStatus: role === 'provider' ? 'pending' : undefined,
      };
      
      await setDoc(doc(db, 'users', user.id), updatedUser, { merge: true });
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
