import { auth, db, storage } from '../config/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

export async function verifyFirebaseSetup() {
  console.log('\n🔍 Verifying Firebase Setup...\n');

  const results = {
    config: false,
    auth: false,
    firestore: false,
    storage: false,
  };

  try {
    console.log('1️⃣ Checking Firebase Configuration...');
    if (auth && db && storage) {
      results.config = true;
      console.log('   ✅ Firebase initialized successfully');
      console.log(`   📦 Project ID: ${process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID}`);
    } else {
      console.log('   ❌ Firebase initialization failed');
      return results;
    }

    console.log('\n2️⃣ Testing Authentication...');
    if (auth) {
      results.auth = true;
      console.log('   ✅ Auth service available');
      console.log(`   👤 Current user: ${auth.currentUser ? auth.currentUser.email : 'Not logged in'}`);
    } else {
      console.log('   ❌ Auth service unavailable');
    }

    console.log('\n3️⃣ Testing Firestore Database...');
    try {
      const testCollection = collection(db, 'test_connection');
      const testDoc = await addDoc(testCollection, {
        message: 'Firebase connection test',
        timestamp: new Date().toISOString(),
        platform: 'React Native',
      });
      
      console.log('   ✅ Write test successful');
      console.log(`   📝 Test document ID: ${testDoc.id}`);

      const snapshot = await getDocs(testCollection);
      console.log(`   ✅ Read test successful (${snapshot.size} documents)`);

      await deleteDoc(doc(db, 'test_connection', testDoc.id));
      console.log('   ✅ Delete test successful');
      
      results.firestore = true;
    } catch (error: any) {
      console.log('   ❌ Firestore test failed:', error.message);
      if (error.code === 'permission-denied') {
        console.log('   ⚠️  Check Firestore security rules');
      }
    }

    console.log('\n4️⃣ Testing Storage...');
    if (storage) {
      results.storage = true;
      console.log('   ✅ Storage service available');
    } else {
      console.log('   ❌ Storage service unavailable');
    }

    console.log('\n📊 Summary:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Configuration: ${results.config ? '✅' : '❌'}`);
    console.log(`Authentication: ${results.auth ? '✅' : '❌'}`);
    console.log(`Firestore: ${results.firestore ? '✅' : '❌'}`);
    console.log(`Storage: ${results.storage ? '✅' : '❌'}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const allPassed = Object.values(results).every(v => v);
    if (allPassed) {
      console.log('🎉 All tests passed! Firebase is ready for live testing.\n');
    } else {
      console.log('⚠️  Some tests failed. Please check the errors above.\n');
    }

    return results;
  } catch (error: any) {
    console.error('❌ Verification failed:', error.message);
    return results;
  }
}
