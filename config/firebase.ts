import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getReactNativePersistence, Auth, connectAuthEmulator } from 'firebase/auth';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, LogBox } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'demo-api-key',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'demo-project.firebaseapp.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'demo-project',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'demo-project.appspot.com',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '123456789',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:123456789:web:abcdef',
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const isDevelopment = __DEV__;
const useEmulators = isDevelopment && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

LogBox.ignoreLogs(['@firebase/auth']);

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  db = getFirestore(app);
  
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  
  storage = getStorage(app);

  if (useEmulators) {
    console.log('🔧 Connecting to Firebase Emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Firebase Emulators connected');
  }

  console.log('✅ Firebase initialized successfully');
  console.log('📦 Project ID:', firebaseConfig.projectId);
  console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
} catch (error) {
  console.error('❌ Firebase initialization failed:', error);
  throw error;
}

let analytics: any = null;

if (Platform.OS === 'web' && typeof window !== 'undefined' && process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID) {
  import('firebase/analytics')
    .then(({ getAnalytics, isSupported }) => {
      isSupported().then((supported) => {
        if (supported) {
          try {
            analytics = getAnalytics(app);
            console.log('✅ Firebase Analytics initialized');
          } catch (err: any) {
            console.log('ℹ️ Firebase Analytics initialization skipped:', err.message);
          }
        } else {
          console.log('ℹ️ Firebase Analytics not supported in this environment');
        }
      }).catch((err) => {
        console.log('ℹ️ Firebase Analytics check failed:', err.message);
      });
    })
    .catch((err) => {
      console.log('ℹ️ Firebase Analytics not available:', err.message);
    });
} else {
  console.log('ℹ️ Firebase Analytics disabled (no measurement ID provided)');
}

export { app, db, auth, storage, analytics };
export default app;
