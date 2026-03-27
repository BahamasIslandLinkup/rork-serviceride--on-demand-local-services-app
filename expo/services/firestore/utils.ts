import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  QueryConstraint,
  DocumentData,
  Timestamp,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export const firestoreUtils = {
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
};

export async function getDocument<T = DocumentData>(
  collectionName: string,
  documentId: string
): Promise<T | null> {
  try {
    const docRef = doc(db, collectionName, documentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
}

export async function getDocuments<T = DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<T[]> {
  try {
    const collectionRef = collection(db, collectionName);
    const q = query(collectionRef, ...constraints);
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as T[];
  } catch (error) {
    console.error(`Error getting documents from ${collectionName}:`, error);
    throw error;
  }
}

export async function createDocument<T = DocumentData>(
  collectionName: string,
  data: T,
  documentId?: string
): Promise<string> {
  try {
    const collectionRef = collection(db, collectionName);
    const docRef = documentId 
      ? doc(collectionRef, documentId)
      : doc(collectionRef);
    
    await setDoc(docRef, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Document created in ${collectionName}:`, docRef.id);
    return docRef.id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function updateDocument<T = Partial<DocumentData>>(
  collectionName: string,
  documentId: string,
  data: T
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Document updated in ${collectionName}:`, documentId);
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
}

export async function deleteDocument(
  collectionName: string,
  documentId: string
): Promise<void> {
  try {
    const docRef = doc(db, collectionName, documentId);
    await deleteDoc(docRef);
    
    console.log(`✅ Document deleted from ${collectionName}:`, documentId);
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
}

export async function batchWrite(
  operations: {
    type: 'set' | 'update' | 'delete';
    collection: string;
    documentId: string;
    data?: any;
  }[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    
    operations.forEach(op => {
      const docRef = doc(db, op.collection, op.documentId);
      
      switch (op.type) {
        case 'set':
          batch.set(docRef, {
            ...op.data,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          break;
        case 'update':
          batch.update(docRef, {
            ...op.data,
            updatedAt: serverTimestamp(),
          });
          break;
        case 'delete':
          batch.delete(docRef);
          break;
      }
    });
    
    await batch.commit();
    console.log(`✅ Batch write completed: ${operations.length} operations`);
  } catch (error) {
    console.error('Error in batch write:', error);
    throw error;
  }
}

export async function runFirestoreTransaction<T>(
  transactionFn: (transaction: any) => Promise<T>
): Promise<T> {
  try {
    return await runTransaction(db, transactionFn);
  } catch (error) {
    console.error('Error in transaction:', error);
    throw error;
  }
}

export function buildQuery(
  collectionName: string,
  filters?: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection: 'asc' | 'desc' = 'asc',
  limitCount?: number
): QueryConstraint[] {
  const constraints: QueryConstraint[] = [];
  
  if (filters) {
    filters.forEach(filter => {
      constraints.push(where(filter.field, filter.operator, filter.value));
    });
  }
  
  if (orderByField) {
    constraints.push(orderBy(orderByField, orderDirection));
  }
  
  if (limitCount) {
    constraints.push(limit(limitCount));
  }
  
  return constraints;
}

export function convertTimestamp(timestamp: any): Date | null {
  if (!timestamp) return null;
  
  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }
  
  if (timestamp.seconds) {
    return new Timestamp(timestamp.seconds, timestamp.nanoseconds || 0).toDate();
  }
  
  return null;
}

export function formatFirestoreDate(date: Date | string | null): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
