import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const ADMIN_USERS = [
  {
    email: 'admin@servicerideondemand.com',
    password: 'Admin123!',
    name: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'superadmin@islandlinkup.com',
    password: 'SuperAdmin123!',
    name: 'Super Admin',
    role: 'super_admin',
  },
  {
    email: 'ops@islandlinkup.com',
    password: 'OpsAdmin123!',
    name: 'Operations Admin',
    role: 'ops_admin',
  },
  {
    email: 'finance@islandlinkup.com',
    password: 'FinanceAdmin123!',
    name: 'Finance Admin',
    role: 'finance_admin',
  },
  {
    email: 'safety@islandlinkup.com',
    password: 'SafetyAdmin123!',
    name: 'Trust & Safety',
    role: 'trust_safety',
  },
  {
    email: 'agent@islandlinkup.com',
    password: 'CSAgent123!',
    name: 'CS Agent',
    role: 'cs_agent',
  },
  {
    email: 'lead@islandlinkup.com',
    password: 'CSLead123!',
    name: 'CS Lead',
    role: 'cs_lead',
  },
  {
    email: 'auditor@islandlinkup.com',
    password: 'Auditor123!',
    name: 'Auditor',
    role: 'auditor',
  },
];

async function createAdminUser(userData: typeof ADMIN_USERS[0]) {
  try {
    console.log(`Creating admin user: ${userData.email}...`);
    
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      userData.email,
      userData.password
    );
    
    const adminData = {
      email: userData.email,
      name: userData.name,
      role: userData.role,
      status: 'active',
      mfaEnabled: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    
    await setDoc(doc(db, 'admins', userCredential.user.uid), adminData);
    
    console.log(`✅ Created admin user: ${userData.name} (${userData.role})`);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      console.log(`⚠️  User already exists: ${userData.email}`);
    } else {
      console.error(`❌ Failed to create ${userData.email}:`, error.message);
    }
  }
}

async function seedTickets() {
  console.log('\nSeeding sample tickets...');
  
  const sampleTickets = [
    {
      type: 'support',
      subject: 'Payment not processing',
      description: 'Customer unable to complete payment for booking',
      priority: 'high',
      status: 'open',
      channel: 'in_app',
      tags: ['payment', 'urgent'],
      slaBreach: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      type: 'dispute',
      subject: 'Service quality complaint',
      description: 'Customer unhappy with cleaning service quality',
      priority: 'medium',
      status: 'in_progress',
      channel: 'email',
      tags: ['dispute', 'quality'],
      slaBreach: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      type: 'fraud',
      subject: 'Suspicious merchant activity',
      description: 'Multiple cancellations after payment collected',
      priority: 'urgent',
      status: 'new',
      channel: 'internal',
      tags: ['fraud', 'investigation'],
      slaBreach: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];
  
  for (const ticket of sampleTickets) {
    const ticketRef = doc(collection(db, 'tickets'));
    await setDoc(ticketRef, ticket);
    console.log(`✅ Created ticket: ${ticket.subject}`);
  }
}

async function seedSystemSettings() {
  console.log('\nSeeding system settings...');
  
  const settings = {
    commissionRate: 0.05,
    discoveryFeeMin: 5,
    discoveryFeeMax: 10,
    adBoostPricing: {
      basic: 20,
      standard: 50,
      premium: 100,
      featured: 200,
    },
    refundPolicy: {
      maxDaysAfterBooking: 30,
      maxRefundsByRole: {
        cs_agent: 100,
        cs_lead: 500,
        finance_admin: 10000,
        super_admin: 999999,
      },
    },
    dataRetention: {
      tickets: 730,
      messages: 365,
      kycDocuments: 2555,
      auditLogs: 1825,
    },
    updatedAt: Timestamp.now(),
    updatedById: 'system',
    updatedByName: 'System',
  };
  
  await setDoc(doc(db, 'systemSettings', 'default'), settings);
  console.log('✅ Created system settings');
}

async function seedSLADefinitions() {
  console.log('\nSeeding SLA definitions...');
  
  const slas = [
    {
      name: 'Low Priority',
      priority: 'low',
      responseTimeMinutes: 240,
      resolutionTimeMinutes: 2880,
      businessHoursOnly: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: 'Medium Priority',
      priority: 'medium',
      responseTimeMinutes: 120,
      resolutionTimeMinutes: 1440,
      businessHoursOnly: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: 'High Priority',
      priority: 'high',
      responseTimeMinutes: 30,
      resolutionTimeMinutes: 480,
      escalationTimeMinutes: 240,
      businessHoursOnly: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
    {
      name: 'Urgent',
      priority: 'urgent',
      responseTimeMinutes: 15,
      resolutionTimeMinutes: 120,
      escalationTimeMinutes: 60,
      businessHoursOnly: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    },
  ];
  
  for (const sla of slas) {
    const slaRef = doc(collection(db, 'slaDefinitions'));
    await setDoc(slaRef, sla);
    console.log(`✅ Created SLA: ${sla.name}`);
  }
}

async function seedKBArticles() {
  console.log('\nSeeding KB articles...');
  
  const articles = [
    {
      title: 'How to Process a Refund',
      slug: 'how-to-process-refund',
      body: '1. Verify the refund reason and policy\n2. Check refund limits for your role\n3. Navigate to Payments → Refunds\n4. Select the booking and enter refund amount\n5. Add detailed reason notes\n6. Submit for approval (if required)',
      excerpt: 'Step-by-step guide for processing customer refunds',
      category: 'Payments',
      tags: ['refund', 'payments', 'how-to'],
      visibility: 'internal',
      version: 1,
      authorId: 'system',
      authorName: 'System',
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
    },
    {
      title: 'Dispute Resolution Workflow',
      slug: 'dispute-resolution-workflow',
      body: 'When a dispute is opened:\n1. Review the booking details and history\n2. Request evidence from both parties\n3. Set 24h merchant response timer\n4. Analyze evidence gallery\n5. Make decision (refund/partial/deny)\n6. Document resolution clearly\n7. Update payouts if refund issued\n8. Close ticket and notify parties',
      excerpt: 'Complete workflow for handling customer disputes',
      category: 'Disputes',
      tags: ['dispute', 'workflow', 'resolution'],
      visibility: 'internal',
      version: 1,
      authorId: 'system',
      authorName: 'System',
      views: 0,
      helpful: 0,
      notHelpful: 0,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      publishedAt: Timestamp.now(),
    },
  ];
  
  for (const article of articles) {
    const articleRef = doc(collection(db, 'kbArticles'));
    await setDoc(articleRef, article);
    console.log(`✅ Created KB article: ${article.title}`);
  }
}

async function main() {
  console.log('🌴 Island LinkUp Admin Panel - Seed Data Script\n');
  console.log('='.repeat(50));
  console.log('\n📝 Creating admin users...\n');
  
  for (const adminUser of ADMIN_USERS) {
    await createAdminUser(adminUser);
  }
  
  await seedTickets();
  await seedSystemSettings();
  await seedSLADefinitions();
  await seedKBArticles();
  
  console.log('\n' + '='.repeat(50));
  console.log('\n✅ Seed data complete!\n');
  console.log('Admin Credentials:');
  ADMIN_USERS.forEach(user => {
    console.log(`  ${user.role.padEnd(20)} → ${user.email} / ${user.password}`);
  });
  console.log('\n⚠️  IMPORTANT: Change all passwords before production!\n');
  
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Seed script failed:', error);
  process.exit(1);
});
