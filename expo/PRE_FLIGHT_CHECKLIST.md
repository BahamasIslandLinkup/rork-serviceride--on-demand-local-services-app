# ✈️ Pre-Flight Checklist - Ready for Live Testing

## 🎯 Quick Start (5 Minutes)

### Step 1: Firebase Console Setup (CRITICAL)
**Do this first before testing!**

1. **Open Firebase Console**: https://console.firebase.google.com
2. **Select Project**: `bahamasislandlinkup-9feff`

#### A. Enable Authentication (2 min)
- [ ] Go to **Authentication** → **Sign-in method**
- [ ] Click **Email/Password**
- [ ] Toggle **Enable**
- [ ] Click **Save**

#### B. Create Firestore Database (2 min)
- [ ] Go to **Firestore Database**
- [ ] Click **Create database**
- [ ] Select **Start in test mode**
- [ ] Choose region: **us-east1** (closest to Bahamas)
- [ ] Click **Enable**

#### C. Update Security Rules (1 min)
- [ ] In Firestore, go to **Rules** tab
- [ ] Copy rules from `LIVE_TESTING_GUIDE.md` (Section 2B)
- [ ] Click **Publish**

---

### Step 2: Verify Local Setup

#### Check Environment Variables
```bash
cat .env
```

Should show:
```
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAt__1VR0GlFLxvRsg_laYlyVgwNsO3XSA
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=bahamasislandlinkup-9feff.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=bahamasislandlinkup-9feff
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=bahamasislandlinkup-9feff.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=356564119827
EXPO_PUBLIC_FIREBASE_APP_ID=1:356564119827:web:65ddeedcea480d612d6ae6
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=G-9J33QD9L57
EXPO_PUBLIC_USE_FIREBASE_EMULATORS=false
```

✅ All variables present? Continue.
❌ Missing variables? Update `.env` file.

---

### Step 3: Start the App

```bash
npm start
```

**Expected output:**
```
✅ Firebase initialized successfully
📦 Project ID: bahamasislandlinkup-9feff
🌍 Environment: Development
```

❌ **If you see errors:**
- "API key not valid" → Check Firebase Console API key
- "Permission denied" → Update Firestore rules
- Other errors → Check `LIVE_TESTING_GUIDE.md`

---

## 🧪 Quick Smoke Test (2 Minutes)

### Test 1: App Loads
- [ ] App opens without crashing
- [ ] Login screen appears
- [ ] No red error screens

### Test 2: Firebase Connection
- [ ] Console shows "Firebase initialized successfully"
- [ ] No Firebase errors in console
- [ ] Network tab shows Firebase requests

### Test 3: Create Account
- [ ] Tap "Sign Up"
- [ ] Fill form with test data
- [ ] Tap "Create Account"
- [ ] Account created successfully
- [ ] Redirected to home screen

**If all 3 tests pass → You're ready for full testing! 🎉**

---

## 📋 Full Pre-Flight Checklist

### Firebase Backend
- [ ] Firebase project exists
- [ ] Email/Password authentication enabled
- [ ] Firestore database created
- [ ] Security rules configured
- [ ] Storage bucket created (optional)
- [ ] API keys valid

### Local Environment
- [ ] `.env` file configured
- [ ] All dependencies installed (`npm install`)
- [ ] No TypeScript errors
- [ ] No build errors
- [ ] Development server starts

### App Configuration
- [ ] Firebase config file exists (`config/firebase.ts`)
- [ ] Auth context working (`contexts/AuthContext.tsx`)
- [ ] All providers wrapped in `app/_layout.tsx`
- [ ] Routes configured correctly

### Testing Tools Ready
- [ ] Expo Go app installed (for mobile testing)
- [ ] Browser ready (for web testing)
- [ ] Firebase Console open
- [ ] Console logs visible

---

## 🚀 Testing Platforms

### Option 1: Web Testing (Fastest)
```bash
npm start
# Press 'w' for web
```
**Pros:** Instant reload, easy debugging
**Cons:** Some native features won't work

### Option 2: iOS Testing (Expo Go)
```bash
npm start
# Scan QR with Camera app
```
**Pros:** Real device testing, all features work
**Cons:** Slower reload, need physical device

### Option 3: Android Testing (Expo Go)
```bash
npm start
# Scan QR with Expo Go app
```
**Pros:** Real device testing, all features work
**Cons:** Slower reload, need physical device

---

## 🎯 What to Test First

### Priority 1: Authentication (Must Work)
1. Sign up new account
2. Login with account
3. Logout
4. Login again

### Priority 2: Core Features
1. Browse services
2. View provider profiles
3. Create booking
4. View bookings list

### Priority 3: Real-time Features
1. Send message
2. Receive notification
3. Update booking status

---

## 🐛 Troubleshooting Quick Reference

### Error: "API key not valid"
**Fix:** 
1. Check `.env` file has correct API key
2. Restart dev server: `npm start -- --clear`
3. Verify API key in Firebase Console

### Error: "Permission denied"
**Fix:**
1. Update Firestore security rules
2. Ensure user is logged in
3. Check Firebase Console → Firestore → Rules

### Error: "Network request failed"
**Fix:**
1. Check internet connection
2. Verify Firebase project is active
3. Check Firebase Console → Usage

### App crashes on startup
**Fix:**
1. Clear cache: `npm start -- --clear`
2. Reinstall dependencies: `rm -rf node_modules && npm install`
3. Check console for specific error

---

## ✅ Ready to Test?

**Before you start:**
- [ ] Firebase Console setup complete
- [ ] Environment variables configured
- [ ] App starts without errors
- [ ] Quick smoke test passed

**If all checked → Proceed to `LIVE_TESTING_GUIDE.md` for full testing scenarios! 🚀**

---

## 📞 Need Help?

1. **Check console logs** - Most errors show here
2. **Firebase Console** - Check Authentication & Firestore tabs
3. **Review guides** - `LIVE_TESTING_GUIDE.md` has detailed solutions
4. **Clear cache** - Often fixes mysterious issues

**Common Commands:**
```bash
# Clear cache and restart
npm start -- --clear

# Reinstall dependencies
rm -rf node_modules && npm install

# Check environment variables
cat .env

# View Firebase logs
# (Check browser console or terminal)
```

---

## 🎉 Success Indicators

You'll know everything is working when:
- ✅ No errors in console
- ✅ Can create account
- ✅ Can login/logout
- ✅ Data appears in Firebase Console
- ✅ App navigates smoothly
- ✅ All tabs accessible

**Ready? Let's test! 🚀**
