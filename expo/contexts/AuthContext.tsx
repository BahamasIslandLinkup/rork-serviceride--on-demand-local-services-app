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
import { doc, setDoc, getDoc, getDocFromCache } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import type { User, VehicleInfo, GovernmentID, BusinessLicense, ProviderProfile, ProviderSignupPayload } from '@/types';
import { createProviderProfile } from '@/services/firestore/provider';
import { StorageService } from '@/services/storage';

const AUTH_STORAGE_KEY = 'app_auth';
const USER_STORAGE_KEY = 'app_user';
const REMEMBER_ME_KEY = 'app_remember_me';
const REMEMBER_EMAIL_KEY = 'app_remember_email';

const secureStorage = {
  async setItem(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.setItem(key, value);
      } else {
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error('[SecureStorage] Set item failed:', error);
      await AsyncStorage.setItem(key, value);
    }
  },
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(key);
      } else {
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error('[SecureStorage] Get item failed:', error);
      return await AsyncStorage.getItem(key);
    }
  },
  async removeItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        await AsyncStorage.removeItem(key);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error('[SecureStorage] Remove item failed:', error);
      await AsyncStorage.removeItem(key);
    }
  },
};

const retryAsync = async <T>(
  operation: () => Promise<T>,
  {
    retries = 2,
    baseDelayMs = 750,
    shouldRetry,
  }: {
    retries?: number;
    baseDelayMs?: number;
    shouldRetry?: (error: any) => boolean;
  } = {}
): Promise<T> => {
  let attempt = 0;
  let lastError: any;

  const predicate =
    shouldRetry ||
    ((error: any) => error?.code === 'auth/network-request-failed' || error?.code === 'unavailable');

  while (attempt <= retries) {
    try {
      return await operation();
    } catch (error: any) {
      lastError = error;
      if (!predicate(error) || attempt === retries) {
        break;
      }

      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, delay));
      attempt += 1;
    }
  }

  throw lastError;
};

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    
    const initAuth = async () => {
      try {
        await loadAuth();

        unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
          try {
            if (firebaseUser) {
              const userDocRef = doc(db, 'users', firebaseUser.uid);
              
              let userDoc;
              try {
                userDoc = await getDoc(userDocRef);
              } catch (firestoreError: any) {
                if (firestoreError.code === 'unavailable') {
                  console.log('[Auth] Firestore unavailable, trying cache...');
                  try {
                    userDoc = await getDocFromCache(userDocRef);
                  } catch (cacheError) {
                    console.log('[Auth] No cached data, using stored user');
                    const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                    if (storedUser) {
                      const parsedUser = JSON.parse(storedUser);
                      setUser(parsedUser);
                      setIsAuthenticated(true);
                    }
                    return;
                  }
                } else {
                  throw firestoreError;
                }
              }

              if (userDoc && userDoc.exists()) {
                const userData = userDoc.data() as User;
                const appUser: User = {
                  ...userData,
                  id: firebaseUser.uid,
                };

                await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
                setUser(appUser);
                setIsAuthenticated(true);
              } else {
                const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
                if (storedUser) {
                  const parsedUser = JSON.parse(storedUser);
                  setUser(parsedUser);
                  setIsAuthenticated(true);
                }
              }
            } else {
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (error) {
            console.error('[Auth] onAuthStateChanged error:', error);
            const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
            if (storedUser) {
              console.log('[Auth] Using fallback cached user');
              const parsedUser = JSON.parse(storedUser);
              setUser(parsedUser);
              setIsAuthenticated(true);
            }
          } finally {
            setIsLoading(false);
          }
        });
      } catch (error) {
        console.error('[Auth] Init error:', error);
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
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
      const userCredential = await retryAsync(
        () => signInWithEmailAndPassword(auth, email, password)
      );
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
    role: 'customer' | 'provider',
    providerData?: ProviderSignupPayload
  ) => {
    let firebaseUser: FirebaseUser | null = null;

    try {
      console.log('[Auth] Signup attempt for:', email);
      const userCredential = await retryAsync(
        () => createUserWithEmailAndPassword(auth, email, password),
        { retries: 3, baseDelayMs: 1000 }
      );
      firebaseUser = userCredential.user;
      const authToken = await firebaseUser.getIdToken();
      const timestamp = new Date().toISOString();

      const appUser: User = {
        id: firebaseUser.uid,
        email,
        name,
        phone,
        role,
        verified: false,
        createdAt: timestamp,
      };

      const firestoreData: Record<string, any> = {
        email,
        name,
        phone,
        role,
        verified: false,
        createdAt: timestamp,
      };

      let providerProfileData: ProviderProfile | null = null;

      if (role === 'provider') {
        if (!providerData) {
          throw new Error('Provider data is required for provider signup');
        }

        const {
          vehicleInfo,
          governmentId: providerGovernmentId,
          businessLicense: providerBusinessLicense,
          businessName,
          uploadSources,
        } = providerData;

        if (!uploadSources.governmentIdFront.uri || !uploadSources.governmentIdBack.uri || !uploadSources.businessLicense.uri) {
          throw new Error('Provider documents are required for signup');
        }

        const verificationBasePath = `verification/${firebaseUser.uid}`;
        const uploadTimestamp = Date.now();

        const [governmentIdFrontUpload, governmentIdBackUpload, businessLicenseUpload] = await Promise.all([
          StorageService.uploadImage(
            uploadSources.governmentIdFront.uri,
            `${verificationBasePath}/governmentId`,
            `front_${uploadTimestamp}.jpg`,
            uploadSources.governmentIdFront.mimeType
          ),
          StorageService.uploadImage(
            uploadSources.governmentIdBack.uri,
            `${verificationBasePath}/governmentId`,
            `back_${uploadTimestamp}.jpg`,
            uploadSources.governmentIdBack.mimeType
          ),
          StorageService.uploadImage(
            uploadSources.businessLicense.uri,
            `${verificationBasePath}/businessLicense`,
            `license_${uploadTimestamp}.jpg`,
            uploadSources.businessLicense.mimeType
          ),
        ]);

        const governmentId: GovernmentID = {
          ...providerGovernmentId,
          frontImageUri: governmentIdFrontUpload.url,
          backImageUri: governmentIdBackUpload.url,
          uploadedAt: timestamp,
          status: 'pending',
        };

        const businessLicense: BusinessLicense = {
          ...providerBusinessLicense,
          imageUri: businessLicenseUpload.url,
          uploadedAt: timestamp,
          status: 'pending',
        };

        const resolvedBusinessName = (businessName || businessLicense.businessName || '').trim();

        appUser.vehicleInfo = vehicleInfo;
        appUser.governmentId = governmentId;
        appUser.businessLicense = businessLicense;
        appUser.kycStatus = 'pending';
        if (resolvedBusinessName.length > 0) {
          appUser.businessName = resolvedBusinessName;
        }

        firestoreData.kycStatus = 'pending';
        firestoreData.vehicleInfo = vehicleInfo;
        firestoreData.governmentId = governmentId;
        firestoreData.businessLicense = businessLicense;
        if (resolvedBusinessName.length > 0) {
          firestoreData.businessName = resolvedBusinessName;
        }

        const timezone = (() => {
          try {
            return Intl.DateTimeFormat().resolvedOptions().timeZone;
          } catch {
            return 'UTC';
          }
        })();

        providerProfileData = {
          id: firebaseUser.uid,
          userId: firebaseUser.uid,
          kycStatus: 'pending',
          kycDocuments: [],
          governmentId,
          businessLicense,
          services: [],
          availability: {
            slots: [],
            timezone,
          },
          coverageKm: 10,
          vehicleInfo,
          isOnline: false,
          isBusy: false,
          metrics: {
            totalJobs: 0,
            completedJobs: 0,
            cancelledJobs: 0,
            averageRating: 0,
            totalReviews: 0,
            responseTimeMinutes: 0,
            completionRate: 0,
            onTimeRate: 0,
          },
          createdAt: timestamp,
          updatedAt: timestamp,
          ...(resolvedBusinessName.length > 0 ? { businessName: resolvedBusinessName } : {}),
        };
      }

      await setDoc(doc(db, 'users', firebaseUser.uid), firestoreData);
      if (providerProfileData) {
        try {
          await createProviderProfile(firebaseUser.uid, providerProfileData);
        } catch (providerProfileError) {
          console.error('[Auth] Failed to initialize provider profile:', providerProfileError);
        }
      }
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(appUser));
      await secureStorage.setItem(AUTH_STORAGE_KEY, authToken);

      setUser(appUser);
      setIsAuthenticated(true);
      console.log('[Auth] Signup successful');

      return { success: true, user: appUser };
    } catch (error: any) {
      console.error('[Auth] Signup failed:', error);
      if (firebaseUser) {
        try {
          await firebaseUser.delete();
        } catch (cleanupError) {
          console.error('[Auth] Failed to rollback user after signup error:', cleanupError);
        }
      }
      let errorMessage = 'Signup failed';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      } else if (error.message === 'Provider documents are required for signup') {
        errorMessage = 'Please add your verification documents before signing up.';
      } else if (typeof error.message === 'string' && error.message.toLowerCase().includes('upload')) {
        errorMessage = 'Failed to upload verification documents. Please try again.';
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
