# ⚡ Quick Start - Live Testing in 5 Minutes

## 🔥 Firebase Console Setup (Do This First!)

### 1. Enable Authentication (1 min)
```
1. Open: https://console.firebase.google.com
2. Select: bahamasislandlinkup-9feff
3. Go to: Authentication → Sign-in method
4. Enable: Email/Password
5. Save
```

### 2. Create Firestore Database (2 min)
```
1. Go to: Firestore Database
2. Click: Create database
3. Select: Test mode
4. Region: us-east1
5. Enable
```

### 3. Update Security Rules (1 min)
```
1. In Firestore, click: Rules tab
2. Paste this:
```

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /bookings/{bookingId} {
      allow read, write: if request.auth != null;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null;
    }
    match /services/{serviceId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /reviews/{reviewId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

```
3. Click: Publish
```

---

## 🚀 Start Testing (1 min)

### Start the App
```bash
npm start
```

### Choose Platform
- **Web**: Press `w`
- **iOS**: Scan QR with Camera
- **Android**: Scan QR with Expo Go

---

## ✅ First Test (2 min)

### Create Account
1. Tap "Sign Up"
2. Fill form:
   - Name: Test User
   - Email: test@example.com
   - Phone: +1 242 555 0100
   - Password: Test123456
3. Select: Customer
4. Tap "Create Account"

### Expected Result
- ✅ Account created
- ✅ Redirected to home
- ✅ Tabs visible at bottom

---

## 🎯 What to Test

### Must Test
- [ ] Sign up
- [ ] Login
- [ ] Browse services
- [ ] Create booking
- [ ] View bookings

### Should Test
- [ ] Search
- [ ] Messages
- [ ] Notifications
- [ ] Profile

---

## 🐛 Common Issues

### "API key not valid"
```bash
# Restart with cache clear
npm start -- --clear
```

### "Permission denied"
- Update Firestore rules (see above)
- Make sure you're logged in

### App won't start
```bash
# Reinstall dependencies
rm -rf node_modules && npm install
npm start
```

---

## 📊 Success Checklist

- [ ] Firebase Console setup complete
- [ ] App starts without errors
- [ ] Can create account
- [ ] Can login
- [ ] Can browse services
- [ ] Data appears in Firebase Console

**All checked? You're ready! 🎉**

---

## 📚 Full Documentation

- **Detailed Testing**: `LIVE_TESTING_GUIDE.md`
- **Pre-Flight Checklist**: `PRE_FLIGHT_CHECKLIST.md`
- **Firebase Setup**: `FIREBASE_SETUP_COMPLETE.md`

---

## 🆘 Quick Help

**Console shows errors?**
1. Read the error message
2. Check Firebase Console
3. Review security rules
4. Clear cache and restart

**Can't create account?**
1. Check Email/Password is enabled
2. Use valid email format
3. Password must be 8+ characters
4. Check console for specific error

**Data not saving?**
1. Check Firestore rules
2. Verify user is authenticated
3. Check Firebase Console → Firestore

---

## 🎉 Ready to Go!

**Start here:**
1. ✅ Complete Firebase Console setup (above)
2. ✅ Run `npm start`
3. ✅ Create test account
4. ✅ Start testing!

**Need more details?** → See `LIVE_TESTING_GUIDE.md`

**Let's build something amazing! 🚀**
