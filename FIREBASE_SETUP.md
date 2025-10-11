# Firebase Setup Guide

This app uses Firebase for backend services including Firestore database, Authentication, and Storage.

## Prerequisites

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Firestore Database
3. Enable Authentication (Email/Password, Google, etc.)
4. Enable Storage

## Configuration

### 1. Get Firebase Config

1. Go to Project Settings in Firebase Console
2. Under "Your apps", select Web app
3. Copy the Firebase configuration object

### 2. Set Environment Variables

Create a `.env` file in the root directory with your Firebase credentials:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Firestore Security Rules

Set up the following security rules in Firestore:

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
      allow update: if request.auth != null && resource.data.receiverId == request.auth.uid;
    }
    
    // Conversations collection
    match /conversations/{conversationId} {
      allow read: if request.auth != null && request.auth.uid in resource.data.participants;
      allow write: if request.auth != null && request.auth.uid in resource.data.participants;
    }
  }
}
```

### 4. Storage Security Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /bookings/{bookingId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

## Firestore Collections Structure

### Users Collection
```typescript
{
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'provider' | 'admin';
  avatar?: string;
  verified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  vehicleInfo?: VehicleInfo;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Bookings Collection
```typescript
{
  id: string;
  customerId: string;
  providerId: string;
  providerName: string;
  providerImage: string;
  category: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  address: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Messages Collection
```typescript
{
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  attachments?: MessageAttachment[];
  timestamp: Timestamp;
  read: boolean;
}
```

### Conversations Collection
```typescript
{
  id: string;
  participants: string[];
  participantId: string;
  participantName: string;
  participantImage: string;
  lastMessage: string;
  lastMessageTime: Timestamp;
  unreadCount: number;
}
```

## Usage

### Import Firebase Services

```typescript
import { db, auth, storage } from '@/config/firebase';
```

### Use Firestore Hooks

```typescript
import { useUserBookings, useCreateBooking } from '@/hooks/useFirestoreBookings';

// In your component
const { data: bookings, isLoading } = useUserBookings(userId, 'customer');
const createBookingMutation = useCreateBooking();
```

### Direct Firestore Operations

```typescript
import { createBooking, getBooking, updateBookingStatus } from '@/services/firestore';

// Create a booking
const bookingId = await createBooking({
  customerId: 'user123',
  providerId: 'provider456',
  // ... other fields
});

// Get a booking
const booking = await getBooking(bookingId);

// Update booking status
await updateBookingStatus(bookingId, 'confirmed');
```

## Testing

For development, you can use Firebase Emulator Suite:

```bash
npm install -g firebase-tools
firebase init emulators
firebase emulators:start
```

Then update your Firebase config to use emulators:

```typescript
if (__DEV__) {
  connectFirestoreEmulator(db, 'localhost', 8080);
  connectAuthEmulator(auth, 'http://localhost:9099');
  connectStorageEmulator(storage, 'localhost', 9199);
}
```

## Migration from Mock Data

To migrate from mock data to Firebase:

1. Set up Firebase as described above
2. Replace mock API calls with Firestore hooks
3. Update contexts to use Firebase Authentication
4. Migrate existing mock data to Firestore collections

Example migration:

```typescript
// Before (mock)
import { mockBookings } from '@/mocks/services';

// After (Firebase)
import { useUserBookings } from '@/hooks/useFirestoreBookings';
const { data: bookings } = useUserBookings(userId, 'customer');
```

## Best Practices

1. **Always validate data** before writing to Firestore
2. **Use transactions** for operations that need atomicity
3. **Implement offline persistence** for better UX
4. **Monitor usage** in Firebase Console to stay within free tier limits
5. **Use indexes** for complex queries
6. **Implement proper error handling** for all Firebase operations

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check Firestore security rules
2. **Network Error**: Verify Firebase config and internet connection
3. **Quota Exceeded**: Monitor usage in Firebase Console
4. **Invalid Document**: Ensure all required fields are present

### Debug Mode

Enable Firebase debug logging:

```typescript
import { setLogLevel } from 'firebase/firestore';
setLogLevel('debug');
```

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
- [Firebase Pricing](https://firebase.google.com/pricing)
