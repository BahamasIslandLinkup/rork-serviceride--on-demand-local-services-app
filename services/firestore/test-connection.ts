import { collection, addDoc, getDocs, query, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface TestRecord {
  message: string;
  timestamp: Date;
  platform: string;
}

export const createTestRecord = async (): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Hello from Bahama Island LinkUp!',
      timestamp: Timestamp.now(),
      platform: 'React Native',
      environment: __DEV__ ? 'development' : 'production',
    });
    
    console.log('✅ Test record added successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('❌ Error adding test document:', error);
    throw new Error(`Failed to create test record: ${error.message}`);
  }
};

export const getTestRecords = async (): Promise<TestRecord[]> => {
  try {
    const q = query(collection(db, 'test'), limit(10));
    const querySnapshot = await getDocs(q);
    
    const records: TestRecord[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      records.push({
        message: data.message,
        timestamp: data.timestamp?.toDate() || new Date(),
        platform: data.platform || 'unknown',
      });
    });
    
    console.log(`✅ Retrieved ${records.length} test records`);
    return records;
  } catch (error: any) {
    console.error('❌ Error getting test documents:', error);
    throw new Error(`Failed to get test records: ${error.message}`);
  }
};

export const testFirebaseConnection = async (): Promise<{
  success: boolean;
  message: string;
  recordId?: string;
  recordCount?: number;
}> => {
  try {
    const recordId = await createTestRecord();
    const records = await getTestRecords();
    
    return {
      success: true,
      message: 'Firebase connection successful!',
      recordId,
      recordCount: records.length,
    };
  } catch (error: any) {
    return {
      success: false,
      message: error.message,
    };
  }
};
