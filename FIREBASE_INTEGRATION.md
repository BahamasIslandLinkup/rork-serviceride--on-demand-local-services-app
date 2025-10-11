# 🔥 Firebase Integration Guide

## ✅ Setup Complete

Firebase has been successfully integrated into the Bahama Island LinkUp app with the following features:

### 📦 Installed Services
- ✅ Firebase App (Core)
- ✅ Firebase Authentication
- ✅ Cloud Firestore (Database)
- ✅ Firebase Storage (File uploads)
- ✅ Firebase Analytics (Web only)

---

## 🔧 Configuration

### Environment Variables
All Firebase configuration is stored in `.env`:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAt__1VR0GlFLxvRsg_laYlyVgwNsO3XSA
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bahamasislandlinkup-9feff.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bahamasislandlinkup-9feff
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bahamasislandlinkup-9feff.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=356564119827
EXPO_PUBLIC_FIREBASE_APP_ID=1:356564119827:web:65ddeedcea480d612d6ae6
```

### Firebase Emulators (Optional)
To use Firebase Emulators for local development, add to `.env`:

```env
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=true
```

Then start the emulators:
```bash
firebase emulators:start
```

---

## 📁 Project Structure

```
config/
  └── firebase.ts          # Firebase initialization & config

services/
  ├── firestore/
  │   ├── utils.ts         # Firestore utility functions
  │   ├── bookings.ts      # Booking operations
  │   ├── messages.ts      # Messaging operations
  │   ├── users.ts         # User operations
  │   └── index.ts         # Firestore exports
  └── api/
      └── auth.ts          # Authentication API

contexts/
  └── AuthContext.tsx      # Auth state management
```

---

## 🚀 Usage Examples

### Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LoginScreen() {
  const { login, signup, logout, user, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');
    if (result.success) {
      console.log('Logged in:', result.user);
    } else {
      console.error('Login failed:', result.error);
    }
  };

  const handleSignup = async () => {
    const result = await signup(
      'user@example.com',
      'password123',
      'John Doe',
      '+1234567890',
      'customer'
    );
    if (result.success) {
      console.log('Account created:', result.user);
    }
  };

  return (
    <View>
      {isAuthenticated ? (
        <Text>Welcome, {user?.name}!</Text>
      ) : (
        <Button title="Login" onPress={handleLogin} />
      )}
    </View>
  );
}
```

### Firestore Operations

```typescript
import { 
  getDocument, 
  getDocuments, 
  createDocument, 
  updateDocument,
  deleteDocument,
  buildQuery
} from '@/services/firestore/utils';
import { where } from 'firebase/firestore';

// Get a single document
const user = await getDocument<User>('users', 'user123');

// Get multiple documents with filters
const constraints = buildQuery(
  'bookings',
  [
    { field: 'userId', operator: '==', value: 'user123' },
    { field: 'status', operator: '==', value: 'active' }
  ],
  'createdAt',
  'desc',
  10
);
const bookings = await getDocuments<Booking>('bookings', constraints);

// Create a document
const bookingId = await createDocument('bookings', {
  userId: 'user123',
  serviceId: 'service456',
  status: 'pending',
  amount: 100
});

// Update a document
await updateDocument('bookings', bookingId, {
  status: 'confirmed'
});

// Delete a document
await deleteDocument('bookings', bookingId);
```

### Real-time Listeners

```typescript
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { useEffect, useState } from 'react';

function BookingsList() {
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', 'user123')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Booking[];
      setBookings(data);
    });

    return () => unsubscribe();
  }, []);

  return (
    <View>
      {bookings.map(booking => (
        <Text key={booking.id}>{booking.status}</Text>
      ))}
    </View>
  );
}
```

### File Upload (Storage)

```typescript
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import * as ImagePicker from 'expo-image-picker';

async function uploadProfileImage(userId: string) {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    const { uri } = result.assets[0];
    
    // Convert URI to blob
    const response = await fetch(uri);
    const blob = await response.blob();
    
    // Upload to Firebase Storage
    const storageRef = ref(storage, `profiles/${userId}/avatar.jpg`);
    await uploadBytes(storageRef, blob);
    
    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    
    // Update user profile
    await updateDocument('users', userId, {
      avatar: downloadURL
    });
    
    return downloadURL;
  }
}
```

### Batch Operations

```typescript
import { batchWrite } from '@/services/firestore/utils';

await batchWrite([
  {
    type: 'set',
    collection: 'bookings',
    documentId: 'booking1',
    data: { status: 'confirmed' }
  },
  {
    type: 'update',
    collection: 'users',
    documentId: 'user123',
    data: { bookingCount: 5 }
  },
  {
    type: 'delete',
    collection: 'notifications',
    documentId: 'notif456'
  }
]);
```

### Transactions

```typescript
import { runFirestoreTransaction } from '@/services/firestore/utils';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

await runFirestoreTransaction(async (transaction) => {
  const userRef = doc(db, 'users', 'user123');
  const userDoc = await transaction.get(userRef);
  
  if (!userDoc.exists()) {
    throw new Error('User not found');
  }
  
  const currentBalance = userDoc.data().balance || 0;
  const newBalance = currentBalance - 100;
  
  if (newBalance < 0) {
    throw new Error('Insufficient balance');
  }
  
  transaction.update(userRef, { balance: newBalance });
});
```

---

## 🔐 Security Rules

### Firestore Rules (to be set in Firebase Console)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Users collection
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      allow read: if request.auth != null && (
        resource.data.customerId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.customerId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
    }
    
    // Messages collection
    match /messages/{messageId} {
      allow read: if request.auth != null && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      allow create: if request.auth != null;
    }
    
    // Disputes collection
    match /disputes/{disputeId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null && (
        resource.data.customerId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
    }
  }
}
```

### Storage Rules (to be set in Firebase Console)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    
    // Profile images
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Booking attachments
    match /bookings/{bookingId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Dispute evidence
    match /disputes/{disputeId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

---

## 📊 Firestore Collections Schema

### Users Collection (`users`)
```typescript
{
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'provider';
  avatar?: string;
  verified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Bookings Collection (`bookings`)
```typescript
{
  id: string;
  customerId: string;
  providerId: string;
  serviceId: string;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  scheduledDate: Timestamp;
  amount: number;
  location: {
    address: string;
    coordinates: { lat: number; lng: number };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Messages Collection (`messages`)
```typescript
{
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  read: boolean;
  createdAt: Timestamp;
}
```

### Disputes Collection (`disputes`)
```typescript
{
  id: string;
  bookingId: string;
  customerId: string;
  providerId: string;
  reason: string;
  description: string;
  evidence: string[];
  status: 'open' | 'in_review' | 'resolved' | 'closed';
  resolution?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

---

## 🎯 Next Steps

1. **Set up Firestore Security Rules** in Firebase Console
2. **Set up Storage Security Rules** in Firebase Console
3. **Enable Authentication Methods** (Email/Password, Google, etc.)
4. **Create Firestore Indexes** for complex queries
5. **Set up Cloud Functions** for server-side logic (optional)
6. **Configure Firebase Analytics** events
7. **Set up Firebase Cloud Messaging** for push notifications

---

## 🐛 Troubleshooting

### Common Issues

**Issue: "Firebase not initialized"**
- Solution: Make sure `config/firebase.ts` is imported before any Firebase operations

**Issue: "Permission denied" errors**
- Solution: Check Firestore Security Rules and ensure user is authenticated

**Issue: "Network request failed"**
- Solution: Check internet connection and Firebase project status

**Issue: Analytics not working on mobile**
- Solution: Analytics is web-only in this setup. For mobile analytics, use Firebase SDK for React Native

### Debug Mode

Enable detailed Firebase logs:
```typescript
import { setLogLevel } from 'firebase/firestore';
setLogLevel('debug');
```

---

## 📚 Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Firebase Authentication](https://firebase.google.com/docs/auth)
- [Firebase Storage](https://firebase.google.com/docs/storage)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)

---

## ✅ Integration Checklist

- [x] Install Firebase SDK
- [x] Configure Firebase with environment variables
- [x] Initialize Firebase services (Auth, Firestore, Storage)
- [x] Create utility functions for Firestore operations
- [x] Integrate Firebase Auth with AuthContext
- [x] Add Analytics support (web only)
- [x] Add Emulator support for local development
- [ ] Set up Firestore Security Rules
- [ ] Set up Storage Security Rules
- [ ] Create Firestore indexes
- [ ] Test authentication flows
- [ ] Test CRUD operations
- [ ] Test file uploads
- [ ] Test real-time listeners

---

**Last Updated:** 2025-10-11
**Firebase SDK Version:** 12.4.0
**Project:** Bahama Island LinkUp
