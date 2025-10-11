# Firestore Security Rules Setup

## Problem
You're getting a "permission-denied" error when trying to create bookings because Firestore security rules are blocking the write operation.

## Solution
You need to update your Firestore security rules in the Firebase Console to allow authenticated users to create and manage bookings.

## Steps to Fix

### 1. Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **bahamasislandlinkup-9feff**
3. Click on **Firestore Database** in the left sidebar
4. Click on the **Rules** tab at the top

### 2. Update Security Rules
Replace the existing rules with the following:

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Helper function to check if user owns the document
    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }
    
    // Users collection
    match /users/{userId} {
      // Anyone can read user profiles (for displaying provider info)
      allow read: if true;
      
      // Users can only create/update their own profile
      allow create: if isAuthenticated() && request.auth.uid == userId;
      allow update: if isOwner(userId);
      allow delete: if isOwner(userId);
    }
    
    // Bookings collection
    match /bookings/{bookingId} {
      // Users can read bookings where they are either the client or provider
      allow read: if isAuthenticated() && (
        resource.data.clientId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
      
      // Authenticated users can create bookings
      allow create: if isAuthenticated() && 
        request.resource.data.clientId == request.auth.uid;
      
      // Client or provider can update their bookings
      allow update: if isAuthenticated() && (
        resource.data.clientId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
      
      // Only the client can delete their booking
      allow delete: if isAuthenticated() && 
        resource.data.clientId == request.auth.uid;
    }
    
    // Messages collection
    match /messages/{messageId} {
      // Users can read messages where they are sender or receiver
      allow read: if isAuthenticated() && (
        resource.data.senderId == request.auth.uid ||
        resource.data.receiverId == request.auth.uid
      );
      
      // Users can create messages where they are the sender
      allow create: if isAuthenticated() && 
        request.resource.data.senderId == request.auth.uid;
      
      // Users can update their own messages
      allow update: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
      
      // Users can delete their own messages
      allow delete: if isAuthenticated() && 
        resource.data.senderId == request.auth.uid;
    }
    
    // Notifications collection
    match /notifications/{notificationId} {
      // Users can only read their own notifications
      allow read: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      // System can create notifications (or users for testing)
      allow create: if isAuthenticated();
      
      // Users can update their own notifications (mark as read)
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      // Users can delete their own notifications
      allow delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
    
    // Disputes collection
    match /disputes/{disputeId} {
      // Users can read disputes where they are involved
      allow read: if isAuthenticated() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
      
      // Customers can create disputes for their bookings
      allow create: if isAuthenticated() && 
        request.resource.data.customerId == request.auth.uid;
      
      // Involved parties can update disputes
      allow update: if isAuthenticated() && (
        resource.data.customerId == request.auth.uid ||
        resource.data.providerId == request.auth.uid
      );
    }
    
    // Reviews collection
    match /reviews/{reviewId} {
      // Anyone can read reviews
      allow read: if true;
      
      // Authenticated users can create reviews
      allow create: if isAuthenticated();
      
      // Users can update their own reviews
      allow update: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
      
      // Users can delete their own reviews
      allow delete: if isAuthenticated() && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### 3. Publish the Rules
1. Click the **Publish** button at the top right
2. Wait for the confirmation message

### 4. Test the Booking Creation
1. Make sure you're logged in to the app
2. Try creating a booking again
3. Check the console logs for any errors

## Important Notes

- **Authentication Required**: All write operations require the user to be authenticated via Firebase Auth
- **User Ownership**: Users can only create bookings with their own `clientId`
- **Read Access**: Users can only read bookings where they are either the client or provider
- **Security**: These rules prevent unauthorized access and ensure data privacy

## Troubleshooting

If you still get permission errors:

1. **Check Authentication**: Make sure the user is properly logged in
   - Open browser console and check for `[Auth] Current user:` logs
   - Verify the user ID is present

2. **Check Firebase Auth**: In Firebase Console → Authentication
   - Verify the user exists in the Users tab
   - Check that the user's UID matches the one in the logs

3. **Check Rules**: In Firebase Console → Firestore → Rules
   - Verify the rules were published successfully
   - Check the timestamp to ensure they're the latest version

4. **Test in Simulator**: Use the Rules Playground in Firebase Console
   - Click "Rules Playground" tab
   - Simulate a write operation with your user's UID
   - See if the rules allow or deny the operation

## Development vs Production

For **development/testing only**, you can temporarily use these permissive rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

⚠️ **WARNING**: Never use these permissive rules in production! They allow any authenticated user to read/write any document.
