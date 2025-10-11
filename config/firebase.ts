import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth, connectAuthEmulator, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform, LogBox } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
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
  
  try {
    if (Platform.OS === 'web') {
      auth = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
      });
    } else {
      auth = getAuth(app);
    }
  } catch (error: any) {
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      throw error;
    }
  }
  
  storage = getStorage(app);

  if (useEmulators) {
    console.log('🔧 Connecting to Firebase Emulators...');
    connectFirestoreEmulator(db, 'localhost', 8080);
    connectAuthEmulator(auth, 'http://localhost:9099');
    connectStorageEmulator(storage, 'localhost', 9199);
    console.log('✅ Firebase Emulators connected');
  }

  if (isDevelopment) {
    console.log('✅ Firebase initialized successfully');
    console.log('📦 Project ID:', firebaseConfig.projectId);
    console.log('🌍 Environment:', isDevelopment ? 'Development' : 'Production');
  }
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
            if (isDevelopment) {
              console.log('✅ Firebase Analytics initialized');
            }
          } catch (err: any) {
            if (isDevelopment) {
              console.log('ℹ️ Firebase Analytics initialization skipped:', err.message);
            }
          }
        }
      }).catch(() => {});
    })
    .catch(() => {});
}

export { app, db, auth, storage, analytics };
export default app;
