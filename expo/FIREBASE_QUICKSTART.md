# 🚀 Firebase Quick Start Guide

## ✅ What's Already Done

Firebase is **fully integrated** and ready to use! Here's what's been set up:

### 📦 Installed & Configured
- ✅ Firebase SDK (v12.4.0)
- ✅ Authentication (Email/Password)
- ✅ Cloud Firestore (Database)
- ✅ Firebase Storage (File uploads)
- ✅ Analytics (Web only)
- ✅ Environment variables configured
- ✅ AuthContext integrated with Firebase Auth
- ✅ Utility functions for CRUD operations
- ✅ Storage helpers for file uploads
- ✅ Analytics tracking helpers

---

## 🎯 Next Steps (Firebase Console)

### 1. Set Up Firestore Security Rules

Go to [Firebase Console](https://console.firebase.google.com/) → Your Project → Firestore Database → Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /bookings/{bookingId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow update: if request.auth != null;
    }
    
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    
    match /disputes/{disputeId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish** to apply the rules.

---

### 2. Set Up Storage Security Rules

Go to Firebase Console → Storage → Rules

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profiles/{userId}/{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    match /bookings/{bookingId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    match /disputes/{disputeId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
    
    match /chats/{conversationId}/{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

Click **Publish** to apply the rules.

---

### 3. Enable Authentication Methods

Go to Firebase Console → Authentication → Sign-in method

Enable:
- ✅ **Email/Password** (Already enabled)
- ⬜ **Google** (Optional)
- ⬜ **Facebook** (Optional)
- ⬜ **Phone** (Optional)

---

### 4. Deploy Firestore Indexes

All composite indexes required by the app are checked into `firestore.indexes.json`. Deploy them with:

```bash
firebase deploy --only firestore:indexes
```

The file already defines indexes for the composite queries used throughout the app, including:
- `bookings`: filters by `clientId`/`providerId` with `status` and sorts by `createdAt`
- `messages`: sender/receiver conversation queries ordered by `timestamp` (asc & desc)
- `conversations`: participant membership ordered by `lastMessageTime`
- `disputes`: customer/provider lookups ordered by `createdAt`
- `disputeMessages`: dispute thread lookups ordered by `timestamp`

If a new query asks for an index at runtime, use the link Firestore provides, then mirror the definition in `firestore.indexes.json` so it can be deployed alongside the rest of the project.

---

## 🧪 Test Your Firebase Setup

### Option 1: Use the Test Functions

Add this to any screen to test Firebase:

```typescript
import { testFirebaseConnection, runAllTests } from '@/services/firestore/test';

// Test basic connection
await testFirebaseConnection();

// Run all tests
await runAllTests();
```

### Option 2: Try Authentication

The app already has Firebase Auth integrated! Just:

1. Go to the **Signup** screen
2. Create a new account
3. Check Firebase Console → Authentication → Users

You should see your new user!

---

## 📱 Using Firebase in Your App

### Authentication

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, login, signup, logout, isAuthenticated } = useAuth();

  // Login
  const handleLogin = async () => {
    const result = await login('user@example.com', 'password123');
    if (result.success) {
      console.log('Logged in!');
    }
  };

  // Signup
  const handleSignup = async () => {
    const result = await signup(
      'user@example.com',
      'password123',
      'John Doe',
      '+1234567890',
      'customer'
    );
    if (result.success) {
      console.log('Account created!');
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

### Firestore CRUD

```typescript
import { getDocument, createDocument, updateDocument } from '@/services/firestore/utils';

// Create
const bookingId = await createDocument('bookings', {
  customerId: 'user123',
  serviceId: 'service456',
  status: 'pending',
  amount: 100
});

// Read
const booking = await getDocument('bookings', bookingId);

// Update
await updateDocument('bookings', bookingId, {
  status: 'confirmed'
});
```

### File Upload

```typescript
import StorageService from '@/services/storage';

// Pick and upload image
const result = await StorageService.pickAndUploadImage(
  StorageService.getStoragePath.userAvatar('user123')
);

if (result) {
  console.log('Image URL:', result.url);
  // Update user profile with image URL
  await updateDocument('users', 'user123', {
    avatar: result.url
  });
}
```

### Analytics

```typescript
import Analytics from '@/services/analytics';

// Log events
await Analytics.logScreenView('Home');
await Analytics.logLogin('email');
await Analytics.logBookingCreated('service123', 100);
await Analytics.logSearch('plumber', 'home-services');
```

---

## 🔍 Debugging

### Check Firebase Initialization

Look for these console logs when the app starts:

```
✅ Firebase initialized successfully
📦 Project ID: bahamasislandlinkup-9feff
🌍 Environment: Development
```

### Enable Debug Logs

Add this to your code:

```typescript
import { setLogLevel } from 'firebase/firestore';
setLogLevel('debug');
```

### Common Issues

**"Permission denied"**
- Make sure you've set up Firestore Security Rules
- Ensure user is authenticated

**"Network request failed"**
- Check internet connection
- Verify Firebase project is active

**"Firebase not initialized"**
- Make sure `config/firebase.ts` is imported before use
- Check environment variables in `.env`

---

## 📊 Monitor Your App

### Firebase Console Dashboards

1. **Authentication**: See all users, sign-in methods
2. **Firestore**: Browse your database, see real-time updates
3. **Storage**: View uploaded files
4. **Analytics**: Track user behavior (web only)
5. **Performance**: Monitor app performance
6. **Crashlytics**: Track crashes (requires additional setup)

---

## 🎓 Learn More

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Guide](https://firebase.google.com/docs/firestore)
- [Firebase Auth Guide](https://firebase.google.com/docs/auth)
- [Storage Guide](https://firebase.google.com/docs/storage)
- [Full Integration Guide](./FIREBASE_INTEGRATION.md)

---

## ✅ Checklist

Before going to production:

- [ ] Set up Firestore Security Rules
- [ ] Set up Storage Security Rules
- [ ] Enable required authentication methods
- [ ] Create necessary Firestore indexes
- [ ] Test authentication flow
- [ ] Test CRUD operations
- [ ] Test file uploads
- [ ] Set up error monitoring
- [ ] Configure backup schedule
- [ ] Review Firebase pricing and set budget alerts

---

**🎉 You're all set! Firebase is ready to use in your app.**

For detailed documentation, see [FIREBASE_INTEGRATION.md](./FIREBASE_INTEGRATION.md)
