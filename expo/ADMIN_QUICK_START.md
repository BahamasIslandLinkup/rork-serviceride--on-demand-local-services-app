# 🚀 Admin Panel Quick Start Guide

**Island LinkUp Admin Panel - Get Started in 10 Minutes**

---

## Prerequisites

✅ Firebase project already configured  
✅ Firestore database exists  
✅ Firebase CLI installed (`npm install -g firebase-tools`)  
✅ You have Firebase Admin/Owner access  

---

## Step 1: Deploy Firestore Rules & Indexes

```bash
# Navigate to project root
cd /path/to/island-linkup

# Login to Firebase (if not already)
firebase login

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

**Expected Output:**
```
✔ Deploy complete!
✔ firestore: rules deployed
✔ firestore: indexes deployed
```

---

## Step 2: Create Your First Admin User

### Option A: Using Firebase Console (Recommended)

1. **Go to Firebase Console** → Authentication → Users
2. **Click "Add user"**
   - Email: `admin@islandlinkup.com`
   - Password: `YourSecurePassword123!`
3. **Copy the User UID** (e.g., `abc123def456`)
4. **Go to Firestore Database** → Start collection
   - Collection ID: `admins`
   - Document ID: `[paste the UID from step 3]`
   - Fields:
     ```
     email: "admin@islandlinkup.com"
     name: "Super Admin"
     role: "super_admin"
     status: "active"
     mfaEnabled: false
     createdAt: [current timestamp]
     updatedAt: [current timestamp]
     ```

### Option B: Using Seed Script (All Test Users)

```bash
# Install dependencies
npm install

# Run seed script
npx ts-node scripts/seed-admin-data.ts
```

This creates 7 admin users (one for each role):
- `superadmin@islandlinkup.com` / `SuperAdmin123!`
- `ops@islandlinkup.com` / `OpsAdmin123!`
- `finance@islandlinkup.com` / `FinanceAdmin123!`
- `safety@islandlinkup.com` / `SafetyAdmin123!`
- `agent@islandlinkup.com` / `CSAgent123!`
- `lead@islandlinkup.com` / `CSLead123!`
- `auditor@islandlinkup.com` / `Auditor123!`

**⚠️ SECURITY WARNING**: These are test credentials. Change passwords immediately for production!

---

## Step 3: Test Admin Login

### On Web
```bash
npm start
# or
expo start --web
```

Then navigate to: `http://localhost:8081/admin/login`

### On Mobile Device
```bash
expo start
```

Scan QR code, then navigate to Admin Login from the app.

### Test Login Flow

1. **Enter credentials** (e.g., `admin@islandlinkup.com` / your password)
2. **Click "Sign In"**
3. **Should redirect to** `/admin/dashboard`
4. **Verify you see**:
   - Welcome message with your name
   - Role badge (e.g., "SUPER ADMIN")
   - KPI cards (bookings, revenue, disputes)
   - Quick action cards

---

## Step 4: Verify Permissions

### Test Role-Based Access

```typescript
// In any admin screen, check permissions:
const { hasPermission, adminUser } = useAdmin();

if (hasPermission('tickets', 'create')) {
  // Show "Create Ticket" button
}

if (adminUser?.role === 'super_admin') {
  // Show admin-only settings
}
```

### Permission Test Matrix

| Action | Super Admin | CS Agent | Auditor |
|--------|------------|----------|---------|
| View Dashboard | ✅ | ✅ | ✅ |
| Create Ticket | ✅ | ✅ | ❌ |
| Process Refund | ✅ | ❌ | ❌ |
| Ban User | ✅ | ❌ | ❌ |
| Export Logs | ✅ | ❌ | ✅ |

---

## Step 5: Create Test Data

### Manual Test Tickets

**Via Firestore Console:**

1. Go to Firestore → `tickets` collection
2. Add document with auto-ID:
```json
{
  "type": "support",
  "subject": "Test Support Request",
  "description": "This is a test ticket",
  "priority": "medium",
  "status": "open",
  "channel": "in_app",
  "tags": ["test"],
  "slaBreach": false,
  "createdAt": "2025-10-15T12:00:00Z",
  "updatedAt": "2025-10-15T12:00:00Z"
}
```

3. Refresh admin dashboard
4. Navigate to Tickets screen
5. Verify ticket appears

---

## Step 6: Test Core Workflows

### ✅ Workflow 1: View Dashboard

- [x] Login as any admin role
- [x] See KPIs (bookings, revenue, disputes)
- [x] See quick action cards
- [x] Click "Tickets" → navigates to tickets screen

### ✅ Workflow 2: Manage Tickets

- [x] Navigate to Tickets
- [x] See list of tickets
- [x] Search by ID or subject
- [x] Filter by status (coming soon)
- [x] Click ticket → view details (coming soon)

### ✅ Workflow 3: Test Permissions

- [x] Login as `agent@islandlinkup.com` (CS Agent)
- [x] Try to access Settings → should be limited
- [x] Try to issue refund → button should be hidden
- [x] Login as `superadmin@` → full access

---

## Common Issues & Solutions

### Issue: "Admin account not found"

**Solution:**
- Verify you created the admin document in Firestore `admins` collection
- Check that document ID matches Firebase Auth UID
- Verify `status` field is set to `"active"`

### Issue: "Permission denied" in Firestore

**Solution:**
- Run `firebase deploy --only firestore:rules` again
- Check that rules include admin helper functions
- Verify your user exists in `admins` collection

### Issue: "Cannot read properties of undefined"

**Solution:**
- Check that `AdminProvider` is wrapped around your app (see `app/_layout.tsx`)
- Verify imports are correct
- Clear cache: `npx expo start -c`

### Issue: Navigation type errors

**Solution:**
- These are expected for new routes
- Add route definitions to `app/_layout.tsx` if missing
- Use `as any` type assertion for now (will be fixed in next Expo version)

---

## Next Steps

### Immediate (Today)
- ✅ Deploy rules & indexes
- ✅ Create first admin user
- ✅ Test login flow
- ✅ Verify dashboard loads

### This Week
- 🔨 Build ticket detail screen
- 🔨 Add dispute resolution UI
- 🔨 Implement KYC review flow
- 🔨 Create payout approval interface

### Next Week
- 📊 Complete analytics dashboard
- 📧 Add notification templates
- 🔍 Build advanced search
- 📤 Add CSV export functionality

### Month 1
- ⚙️ Implement SLA timers
- 🤖 Build macro system
- 📈 Agent performance metrics
- 🔐 Add MFA support

---

## Useful Commands

```bash
# Start development server
npm start

# Start on specific platform
npm run ios
npm run android
npm run web

# Clear cache and restart
npx expo start -c

# Deploy Firebase rules
firebase deploy --only firestore:rules

# Deploy Firebase indexes
firebase deploy --only firestore:indexes

# Run seed script
npx ts-node scripts/seed-admin-data.ts

# Type check
npx tsc --noEmit

# Run tests (when implemented)
npm test
```

---

## File Structure Reference

```
app/admin/
  ├── login.tsx              ← Admin login screen
  ├── dashboard.tsx          ← Main dashboard with KPIs
  ├── tickets.tsx            ← Ticket list view
  ├── disputes.tsx           ← Dispute management
  ├── merchants.tsx          ← Merchant management
  ├── users.tsx              ← Customer management
  ├── bookings.tsx           ← Booking management
  └── settings.tsx           ← Admin settings

contexts/
  └── AdminContext.tsx       ← RBAC & auth logic

types/
  └── admin.ts               ← All admin TypeScript types

services/firestore/
  └── admin.ts               ← Firestore service functions

firestore.rules                ← Security rules (deployed)
firestore.indexes.json         ← Index definitions (deployed)
```

---

## Testing Checklist

Before marking as "Complete", verify:

- [ ] Admin login works
- [ ] Dashboard loads with KPIs
- [ ] Role permissions are enforced
- [ ] Firestore rules deny unauthorized access
- [ ] Audit logs are created for actions
- [ ] Navigation between screens works
- [ ] Search/filter functionality works
- [ ] Data refreshes on pull-to-refresh
- [ ] Logout redirects to login screen
- [ ] Multiple roles tested (at least 3)

---

## Support

### Documentation
- **Full Docs**: `ADMIN_PANEL_COMPLETE.md`
- **Type Reference**: `types/admin.ts`
- **API Reference**: `services/firestore/admin.ts`

### Debugging
- Check console logs prefixed with `[Admin]`
- Use React Native Debugger for breakpoints
- Monitor Firestore console for query errors

### Common Questions

**Q: Can I use existing user accounts as admins?**  
A: No, admin accounts must be in the `admins` collection with proper roles.

**Q: How do I change admin passwords?**  
A: Use Firebase Console → Authentication → Select user → Reset password

**Q: Can admins also be customers/merchants?**  
A: Not recommended. Keep admin and customer accounts separate for security.

**Q: How do I add a new admin role?**  
A: Update `AdminRole` type in `types/admin.ts` and add to `ROLE_PERMISSIONS` in `AdminContext.tsx`

---

## Production Checklist

Before going live:

- [ ] Change all default passwords
- [ ] Enable MFA for all admins
- [ ] Set up IP allowlist (if needed)
- [ ] Configure proper session timeouts
- [ ] Set up monitoring/alerts
- [ ] Review and test all permissions
- [ ] Audit log retention policy set
- [ ] Backup strategy in place
- [ ] Security audit completed

---

**Built with ❤️ for the Bahamas** 🇧🇸

*Last Updated: October 2025*
