import { 
  getDocument, 
  getDocuments, 
  createDocument, 
  updateDocument,
  deleteDocument,
  buildQuery
} from './utils';
import type { User, Booking } from '@/types';

export async function testFirebaseConnection(): Promise<boolean> {
  try {
    console.log('🧪 Testing Firebase connection...');
    
    const testUserId = `test_user_${Date.now()}`;
    const testUser: Partial<User> = {
      email: 'test@example.com',
      name: 'Test User',
      phone: '+1234567890',
      role: 'customer',
      verified: false,
    };

    console.log('📝 Creating test user...');
    const userId = await createDocument('users', testUser, testUserId);
    console.log('✅ Test user created:', userId);

    console.log('📖 Reading test user...');
    const user = await getDocument<User>('users', userId);
    console.log('✅ Test user retrieved:', user);

    console.log('✏️ Updating test user...');
    await updateDocument('users', userId, { verified: true });
    console.log('✅ Test user updated');

    console.log('📖 Reading updated user...');
    const updatedUser = await getDocument<User>('users', userId);
    console.log('✅ Updated user retrieved:', updatedUser);

    console.log('🗑️ Deleting test user...');
    await deleteDocument('users', userId);
    console.log('✅ Test user deleted');

    console.log('✅ Firebase connection test passed!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection test failed:', error);
    return false;
  }
}

export async function seedInitialData(): Promise<void> {
  try {
    console.log('🌱 Seeding initial data...');

    console.log('📝 Creating service categories...');
    const categories = [
      { name: 'Plumbing', icon: 'wrench', description: 'Professional plumbing services' },
      { name: 'Electrical', icon: 'zap', description: 'Licensed electricians' },
      { name: 'Cleaning', icon: 'sparkles', description: 'Home and office cleaning' },
      { name: 'Landscaping', icon: 'tree', description: 'Garden and lawn care' },
      { name: 'Painting', icon: 'paintbrush', description: 'Interior and exterior painting' },
    ];

    for (const category of categories) {
      await createDocument('categories', category);
    }
    console.log('✅ Categories created');

    console.log('✅ Initial data seeded successfully!');
  } catch (error) {
    console.error('❌ Failed to seed initial data:', error);
    throw error;
  }
}

export async function testQueryOperations(): Promise<void> {
  try {
    console.log('🧪 Testing query operations...');

    console.log('📝 Creating test bookings...');
    const testBookings = [
      {
        customerId: 'customer1',
        providerId: 'provider1',
        serviceId: 'service1',
        status: 'pending' as const,
        amount: 100,
      },
      {
        customerId: 'customer1',
        providerId: 'provider2',
        serviceId: 'service2',
        status: 'confirmed' as const,
        amount: 150,
      },
      {
        customerId: 'customer2',
        providerId: 'provider1',
        serviceId: 'service1',
        status: 'completed' as const,
        amount: 200,
      },
    ];

    const bookingIds: string[] = [];
    for (const booking of testBookings) {
      const id = await createDocument('test_bookings', booking);
      bookingIds.push(id);
    }
    console.log('✅ Test bookings created:', bookingIds);

    console.log('📖 Querying bookings for customer1...');
    const constraints = buildQuery(
      'test_bookings',
      [{ field: 'customerId', operator: '==', value: 'customer1' }],
      'amount',
      'desc'
    );
    const customer1Bookings = await getDocuments<Booking>('test_bookings', constraints);
    console.log('✅ Found bookings:', customer1Bookings.length);

    console.log('📖 Querying pending bookings...');
    const pendingConstraints = buildQuery(
      'test_bookings',
      [{ field: 'status', operator: '==', value: 'pending' }]
    );
    const pendingBookings = await getDocuments<Booking>('test_bookings', pendingConstraints);
    console.log('✅ Found pending bookings:', pendingBookings.length);

    console.log('🗑️ Cleaning up test bookings...');
    for (const id of bookingIds) {
      await deleteDocument('test_bookings', id);
    }
    console.log('✅ Test bookings cleaned up');

    console.log('✅ Query operations test passed!');
  } catch (error) {
    console.error('❌ Query operations test failed:', error);
    throw error;
  }
}

export async function runAllTests(): Promise<void> {
  console.log('🚀 Running all Firebase tests...\n');

  try {
    await testFirebaseConnection();
    console.log('\n');
    
    await testQueryOperations();
    console.log('\n');

    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Tests failed:', error);
    throw error;
  }
}
