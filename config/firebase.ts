import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { initializeAuth, getAuth, Auth, connectAuthEmulator, browserLocalPersistence, indexedDBLocalPersistence } from 'firebase/auth';
import { getStorage, FirebaseStorage, connectStorageEmulator } from 'firebase/storage';
import { Platform, LogBox } from 'react-native';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAt__1VR0GlFLxvRsg_laYlyVgwNsO3XSA",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "bahamasislandlinkup-9feff.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "bahamasislandlinkup-9feff",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "bahamasislandlinkup-9feff.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "356564119827",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:356564119827:web:65ddeedcea480d612d6ae6",
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9J33QD9L57",
};

const isDevelopment = __DEV__;
const useEmulators = isDevelopment && process.env.EXPO_PUBLIC_USE_FIREBASE_EMULATORS === 'true';
const firestoreDatabaseId = '(default)';

LogBox.ignoreLogs(['@firebase/auth']);

let app: FirebaseApp;
let db: Firestore;
let auth: Auth;
let storage: FirebaseStorage;

console.log('🔑 Firebase Config Check:');
console.log('API Key present:', !!firebaseConfig.apiKey);
console.log('API Key length:', firebaseConfig.apiKey?.length);
console.log('Project ID:', firebaseConfig.projectId);
console.log('Firestore Database ID:', firestoreDatabaseId);

try {
  const isNewAppInstance = getApps().length === 0;
  app = isNewAppInstance ? initializeApp(firebaseConfig) : getApp();
  
  db = isNewAppInstance
    ? initializeFirestore(
        app,
        {
          experimentalAutoDetectLongPolling: true,
          ignoreUndefinedProperties: true,
        },
        firestoreDatabaseId
      )
    : getFirestore(app);
  
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
