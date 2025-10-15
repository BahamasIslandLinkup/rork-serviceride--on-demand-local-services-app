# 🚀 Island LinkUp - Complete Deployment & Testing Guide

**Last Updated:** October 15, 2025  
**Status:** Ready for Backend Deployment & Live Testing

---

## 📋 Table of Contents

1. [Current Status](#current-status)
2. [Quick Start](#quick-start)
3. [Firebase Setup](#firebase-setup)
4. [Deployment Steps](#deployment-steps)
5. [Testing Checklist](#testing-checklist)
6. [Known Issues & Fixes](#known-issues--fixes)
7. [Admin Panel Guide](#admin-panel-guide)
8. [Phase Completion Status](#phase-completion-status)

---

## ✅ Current Status

### Completed Features

#### Phase 1: Core App (100%)
- ✅ Bookings screen (redesigned with premium UI)
- ✅ Firestore indexes fixed (clientId + status + createdAt)
- ✅ Booking creation and listing
- ✅ Real-time booking updates
- ✅ Search and filters
- ✅ Provider profiles
- ✅ In-app messaging
- ✅ Authentication context
- ✅ Location services

#### Phase 2: Admin Panel Foundation (60%)
- ✅ Admin authentication & RBAC
- ✅ Admin dashboard with KPIs
- ✅ Ticket management system
- ✅ **NEW:** Ticket detail screen with comments & timeline
- ✅ Dispute data models
- ✅ Merchant/User/Booking management (placeholders)
- ✅ Audit logging system
- ✅ Type-safe admin context

### In Progress
- 🔄 Dispute resolution UI
- 🔄 Merchant detail & KYC review
- 🔄 Payout management
- 🔄 Analytics & reports

---

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure you have Node.js 18+ and Bun installed
node --version  # v18+
bun --version   # 1.0+
```

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun expo start
```

### Environment Variables

Ensure `.env` file exists with Firebase config:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## 🔥 Firebase Setup

### Step 1: Deploy Firestore Indexes

The app requires composite indexes for efficient queries.

**CRITICAL:** You must deploy indexes before testing bookings.

```bash
# Deploy both rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

**What gets deployed:**
- Booking queries: `clientId` + `createdAt`
- Booking queries with status: `clientId` + `status` + `createdAt`
- Provider bookings: `providerId` + `createdAt`
- Provider bookings with status: `providerId` + `status` + `createdAt`
- Messages: `participants` + `createdAt`
- Disputes: `userId` + `createdAt`
- Admin tickets, events, comments indexes

**Index creation takes 5-10 minutes.** You'll receive an email when complete.

### Step 2: Verify Firestore Rules

Your `firestore.rules` file includes:

- ✅ Authentication checks for all collections
- ✅ Role-based access for admin collections
- ✅ User can only access own bookings
- ✅ Provider can access assigned bookings
- ✅ Proper read/write permissions for messages
- ✅ Dispute access limited to involved parties

### Step 3: Create Test Admin User

```bash
# Run seed script
bunx ts-node scripts/seed-admin-data.ts
```

This creates:
- 1 super admin user
- Sample tickets
- Sample disputes
- KYC entries

**Default admin credentials:**
```
Email: admin@islandlinkup.com
Password: Admin123!
```

---

## 📦 Deployment Steps

### For Backend Developers

#### 1. Deploy Firebase Infrastructure

```bash
# Deploy rules, indexes, and functions (if any)
firebase deploy
```

#### 2. Create Collections

Collections are auto-created on first write, but you can manually create:

**Core Collections:**
- `users` - Customer and provider accounts
- `bookings` - Service bookings
- `messages` - In-app chat
- `conversations` - Chat threads
- `notifications` - User notifications
- `reviews` - Provider reviews

**Admin Collections:**
- `admins` - Admin user accounts
- `tickets` - Support tickets
- `ticketComments` - Ticket messages
- `ticketEvents` - Ticket timeline
- `adminDisputes` - Disputes with evidence
- `merchantKYC` - KYC documents
- `payouts` - Merchant payouts
- `refunds` - Refund requests
- `adBoosts` - Ad campaigns
- `reportedContent` - Content moderation queue
- `kbArticles` - Knowledge base
- `auditLogs` - Admin action logs
- `slaDefinitions` - SLA rules
- `ticketMacros` - CS macros
- `featureFlags` - Feature flags
- `systemSettings` - Platform config

#### 3. Seed Sample Data

```bash
# Seed admin data
bunx ts-node scripts/seed-admin-data.ts
```

#### 4. Test Firebase Connection

```bash
# Run verification script
bunx ts-node scripts/verify-firebase.ts
```

Expected output:
```
✅ Firebase connected successfully
✅ Can write to Firestore
✅ Can read from Firestore
✅ Auth working
```

### For Frontend Developers

#### 1. Pull Latest Code

```bash
git pull origin main
bun install
```

#### 2. Test Locally

```bash
bun expo start
```

Press:
- `w` for web
- `i` for iOS simulator (Mac only)
- `a` for Android emulator
- Scan QR with Expo Go app

#### 3. Verify Features

See [Testing Checklist](#testing-checklist) below.

---

## ✅ Testing Checklist

### Pre-Flight Checks

- [ ] `.env` file configured
- [ ] Firebase indexes deployed
- [ ] Firebase rules deployed
- [ ] Admin user created
- [ ] App starts without errors

### Customer App Testing

#### Authentication
- [ ] Login with existing account
- [ ] Signup for new account
- [ ] Password reset flow
- [ ] Logout and login again

#### Home & Search
- [ ] Home screen loads with providers
- [ ] Search bar filters results
- [ ] Category filters work
- [ ] Price range filter works
- [ ] Distance filter works
- [ ] Featured providers appear

#### Provider Profile
- [ ] Provider detail screen loads
- [ ] Reviews display correctly
- [ ] Video reviews play (if any)
- [ ] "Proceed to Schedule" button works

#### Booking Flow
- [ ] Date/time picker works
- [ ] Address input saved
- [ ] Notes field optional
- [ ] Price calculation correct
- [ ] "Confirm Booking" creates booking
- [ ] Booking appears in Bookings tab

#### Bookings Screen
- [ ] "Awaiting" tab shows pending bookings
- [ ] "Active" tab shows accepted bookings
- [ ] "Past" tab shows completed bookings
- [ ] Tab badges show correct counts
- [ ] Pulsing dot on awaiting bookings
- [ ] Pull-to-refresh works
- [ ] Empty states display correctly
- [ ] "Book Now" button navigates to search

#### Messages
- [ ] Chat list loads
- [ ] Can send/receive messages
- [ ] Unread count updates
- [ ] Images/videos send (if implemented)

#### Profile
- [ ] User info displays
- [ ] Stats show correct counts
- [ ] Theme toggle works
- [ ] Settings screens accessible

### Provider App Testing

#### Business Dashboard
- [ ] Earnings displayed
- [ ] Active bookings count
- [ ] Performance metrics shown
- [ ] Quick actions work

#### Booking Requests
- [ ] New requests appear
- [ ] Accept button works
- [ ] Decline button works
- [ ] Status updates in real-time

### Admin Panel Testing

#### Admin Login
- [ ] Navigate to `/admin/login`
- [ ] Login with admin credentials
- [ ] Redirects to dashboard
- [ ] Logout works

#### Dashboard
- [ ] KPIs load (bookings, revenue, disputes)
- [ ] Quick stats display
- [ ] Quick action cards navigate correctly
- [ ] Refresh works

#### Tickets
- [ ] Ticket list loads
- [ ] Can filter by status/priority
- [ ] Search works
- [ ] Click ticket opens detail
- [ ] **NEW:** Ticket detail screen shows:
  - [ ] Subject, description, tags
  - [ ] Status and priority badges
  - [ ] Customer/merchant info
  - [ ] Related booking link
  - [ ] Comments timeline
  - [ ] Internal notes marked correctly
- [ ] **NEW:** Can add comments
- [ ] **NEW:** Internal note toggle works
- [ ] **NEW:** Status can be updated
- [ ] **NEW:** Priority can be changed
- [ ] **NEW:** Send button disabled when empty

#### Disputes (Placeholder)
- [ ] Screen loads
- [ ] Lists disputes (if any)

#### Merchants/Users/Bookings/Settings
- [ ] Placeholder screens load
- [ ] Navigation works

---

## 🐛 Known Issues & Fixes

### Issue 1: "Missing or insufficient permissions" (FIXED ✅)

**Symptom:** Bookings fail with permission-denied error.

**Cause:** Firestore rules too restrictive.

**Fix:** Rules have been updated. Deploy with:
```bash
firebase deploy --only firestore:rules
```

### Issue 2: "The query requires an index" (FIXED ✅)

**Symptom:** Bookings screen fails to load with failed-precondition error.

**Cause:** Missing composite index for `clientId` + `createdAt` query.

**Fix:** Indexes added to `firestore.indexes.json`. Deploy with:
```bash
firebase deploy --only firestore:indexes
```

Wait 5-10 minutes for indexes to build.

### Issue 3: npm install fails with "Class extends value undefined"

**Symptom:** Cannot install firebase-tools globally.

**Cause:** Node/npm version mismatch or corrupted cache.

**Fix:**
```bash
# Use npx instead (no install needed)
npx firebase-tools deploy --only firestore:indexes

# Or use bun
bun add -g firebase-tools
```

### Issue 4: Booking image fields undefined

**Symptom:** Firestore rejects booking creation with undefined values.

**Cause:** Optional fields not conditionally included.

**Fix:** Already applied in `app/booking/[id].tsx`:
```typescript
...(user.avatar && { clientImage: user.avatar }),
...(provider.image && { providerImage: provider.image }),
```

---

## 👨‍💼 Admin Panel Guide

### Accessing Admin Panel

1. Navigate to `/admin/login` in the app
2. Enter admin credentials (from seed script)
3. Dashboard loads with KPIs

### Role-Based Permissions

| Role | Permissions |
|------|-------------|
| **Super Admin** | Full access to everything |
| **Ops Admin** | Manage merchants, bookings, payouts |
| **Finance Admin** | View/approve payouts, refunds |
| **Trust & Safety** | Handle disputes, content moderation |
| **CS Agent** | Handle tickets, create disputes |
| **CS Lead** | Everything CS Agent + manage team |
| **Auditor** | Read-only access to logs |

### Ticket Management Workflow

#### Creating a Ticket
1. Navigate to **Tickets**
2. Click **Create Ticket** (if implemented)
3. Fill subject, description, tags
4. Assign priority
5. Save

#### Responding to Tickets
1. Click on ticket from list
2. Ticket detail screen opens
3. Type message in input box
4. Toggle "Internal Note" if for team only
5. Click **Send**
6. Comment appears in timeline

#### Updating Ticket Status
1. In ticket detail, scroll to **Actions**
2. Under **Status**, select new status:
   - Open
   - In Progress
   - Awaiting Customer
   - Awaiting Merchant
   - Resolved
   - Closed
3. Alert confirms update

#### Changing Priority
1. In ticket detail, scroll to **Actions**
2. Under **Priority**, select:
   - Low
   - Medium
   - High
   - Urgent
3. Alert confirms update

### Best Practices

- ✅ Always add internal notes for context
- ✅ Use tags for categorization
- ✅ Set SLA deadline for urgent tickets
- ✅ Attach evidence when resolving disputes
- ✅ Update status after every action
- ✅ Close tickets only after customer confirmation

---

## 📊 Phase Completion Status

### Phase 1: Core Booking Flow ✅ (100%)
- ✅ Bookings screen redesign
- ✅ Firestore index fixes
- ✅ Booking creation/listing
- ✅ Real-time updates
- ✅ Pull-to-refresh
- ✅ Empty states
- ✅ Tab navigation

### Phase 2: Admin Panel Foundation ✅ (60%)
- ✅ Admin auth & RBAC
- ✅ Dashboard with KPIs
- ✅ Ticket list screen
- ✅ **Ticket detail screen (NEW)**
- ✅ Comment system
- ✅ Status/priority management
- ✅ Audit logging
- ⏳ Dispute resolution UI (next)
- ⏳ Merchant detail & KYC
- ⏳ Payout queue
- ⏳ Analytics

### Phase 3: Advanced Features ⏳ (0%)
- ⏳ Payment integration
- ⏳ Live tracking
- ⏳ Push notifications
- ⏳ Provider onboarding
- ⏳ Earnings dashboard
- ⏳ Referral system

---

## 🎯 Next Steps

### Immediate (Required for Live Testing)

1. **Backend Developer:**
   ```bash
   # Deploy Firestore indexes and rules
   firebase deploy --only firestore:rules,firestore:indexes
   
   # Seed admin data
   bunx ts-node scripts/seed-admin-data.ts
   
   # Verify connection
   bunx ts-node scripts/verify-firebase.ts
   ```

2. **QA/Testing:**
   - Follow [Testing Checklist](#testing-checklist)
   - Report issues in GitHub/Jira
   - Test on both iOS and Android

3. **Product Manager:**
   - Review ticket workflow
   - Approve UI/UX
   - Sign off on Phase 1 & 2 features

### Short-Term (Next 2 Weeks)

1. Build remaining admin screens:
   - Dispute resolution interface
   - Merchant detail & KYC review
   - Payout approval queue
   - User management with ban/suspend
   - Booking detail with map
   - Analytics & reports

2. Implement payment integration:
   - Stripe/Square setup
   - Payment method management
   - Checkout flow
   - Escrow & capture

3. Add notifications:
   - FCM setup
   - Push notification service
   - In-app notification center
   - Email/SMS templates

### Long-Term (1-2 Months)

1. Provider tools:
   - Onboarding wizard
   - Earnings dashboard
   - Availability calendar
   - Service management

2. Advanced features:
   - Live tracking with map
   - Video reviews
   - Referral program
   - Subscription plans

3. Production prep:
   - Performance optimization
   - Security audit
   - Load testing
   - App store submission

---

## 🆘 Getting Help

### Common Issues

**"Firebase not initialized"**
→ Check `.env` file has all required variables

**"Permission denied"**
→ Deploy Firestore rules: `firebase deploy --only firestore:rules`

**"Index required"**
→ Deploy indexes: `firebase deploy --only firestore:indexes`

**"Admin user not found"**
→ Run seed script: `bunx ts-node scripts/seed-admin-data.ts`

**"Cannot read property of undefined"**
→ Check if user is authenticated: `console.log(user)`

### Documentation

- [Firebase Documentation](https://firebase.google.com/docs)
- [Expo Documentation](https://docs.expo.dev)
- [React Native Documentation](https://reactnative.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

### Internal Docs

- `ADMIN_PANEL_COMPLETE.md` - Full admin spec
- `ADMIN_QUICK_START.md` - 10-min setup guide
- `ADMIN_SYSTEM_SUMMARY.md` - System overview
- `IMPLEMENTATION_STATUS.md` - Feature checklist
- `FIREBASE_SETUP.md` - Firebase config guide

---

## 🎉 Success Criteria

### Phase 1 (Core App)
- ✅ Customer can create booking
- ✅ Provider can accept booking
- ✅ Both can message each other
- ✅ Bookings display correctly in tabs
- ✅ Real-time updates work
- ✅ App doesn't crash

### Phase 2 (Admin Panel)
- ✅ Admin can login
- ✅ Dashboard shows real data
- ✅ Tickets can be viewed/managed
- ✅ Comments/notes can be added
- ✅ Status/priority can be updated
- ⏳ Disputes can be resolved
- ⏳ Merchants can be approved/suspended

### Phase 3 (Production Ready)
- ⏳ Payments work end-to-end
- ⏳ Notifications delivered reliably
- ⏳ All features from spec implemented
- ⏳ 99% crash-free rate
- ⏳ <3s average load time
- ⏳ Passes security audit

---

## 📞 Contact

**Project:** Island LinkUp  
**Platform:** React Native (Expo) + Firebase  
**Framework:** TypeScript + Firestore  
**Status:** Phase 2 in progress, ready for live testing  

---

**Built with ❤️ for the Bahamas 🇧🇸**

*A premium marketplace connecting islanders with local service providers.*
