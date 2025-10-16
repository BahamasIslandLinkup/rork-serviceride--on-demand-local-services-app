import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { TransactionDetail } from '@/types';

const TRANSACTIONS_COLLECTION = 'transactions';

export async function createTransaction(
  transaction: Omit<TransactionDetail, 'id' | 'createdAt'>
): Promise<string> {
  try {
    const cleanedTransaction: any = {
      ...transaction,
      createdAt: Timestamp.now(),
    };

    Object.keys(cleanedTransaction).forEach(key => {
      if (cleanedTransaction[key] === undefined) {
        delete cleanedTransaction[key];
      }
    });

    console.log('[Firestore] Creating transaction');
    const docRef = await addDoc(collection(db, TRANSACTIONS_COLLECTION), cleanedTransaction);
    console.log('[Firestore] Transaction created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[Firestore] Error creating transaction:', error);
    throw error;
  }
}

export async function getTransaction(transactionId: string): Promise<TransactionDetail | null> {
  try {
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        capturedAt: data.capturedAt?.toDate?.()?.toISOString() || data.capturedAt,
      } as TransactionDetail;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error getting transaction:', error);
    throw error;
  }
}

export async function getProviderTransactions(
  providerId: string,
  status?: TransactionDetail['status']
): Promise<TransactionDetail[]> {
  try {
    console.log('[Firestore] Getting transactions for provider:', providerId);
    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);

    const constraints: QueryConstraint[] = [where('providerId', '==', providerId)];

    if (status) {
      constraints.push(where('status', '==', status));
    }

    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(100));

    const q = query(transactionsRef, ...constraints);

    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        capturedAt: data.capturedAt?.toDate?.()?.toISOString() || data.capturedAt,
      } as TransactionDetail;
    });

    console.log('[Firestore] Found', transactions.length, 'transactions');
    return transactions;
  } catch (error: any) {
    console.error('[Firestore] Error getting provider transactions:', error);
    throw error;
  }
}

export async function updateTransactionStatus(
  transactionId: string,
  status: TransactionDetail['status']
): Promise<void> {
  try {
    console.log('[Firestore] Updating transaction status:', transactionId, 'to', status);
    const docRef = doc(db, TRANSACTIONS_COLLECTION, transactionId);
    const updates: any = { status };

    if (status === 'captured') {
      updates.capturedAt = Timestamp.now();
    }

    await updateDoc(docRef, updates);
    console.log('[Firestore] Transaction status updated successfully');
  } catch (error) {
    console.error('[Firestore] Error updating transaction status:', error);
    throw error;
  }
}

export function subscribeToProviderTransactions(
  providerId: string,
  callback: (transactions: TransactionDetail[]) => void,
  status?: TransactionDetail['status']
): () => void {
  const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);

  const constraints: QueryConstraint[] = [where('providerId', '==', providerId)];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(100));

  const q = query(transactionsRef, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const transactions = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          capturedAt: data.capturedAt?.toDate?.()?.toISOString() || data.capturedAt,
        } as TransactionDetail;
      });
      callback(transactions);
    },
    (error) => {
      console.error('[Firestore] Error in transactions subscription:', error);
    }
  );

  return unsubscribe;
}

export async function captureTransaction(bookingId: string, providerId: string): Promise<void> {
  try {
    console.log('[Firestore] Capturing transaction for booking:', bookingId);

    const transactionsRef = collection(db, TRANSACTIONS_COLLECTION);
    const q = query(
      transactionsRef,
      where('bookingId', '==', bookingId),
      where('providerId', '==', providerId),
      where('status', '==', 'authorized'),
      limit(1)
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('No authorized transaction found for this booking');
    }

    const transactionDoc = snapshot.docs[0];
    await updateDoc(transactionDoc.ref, {
      status: 'captured',
      capturedAt: Timestamp.now(),
    });

    console.log('[Firestore] Transaction captured successfully');
  } catch (error) {
    console.error('[Firestore] Error capturing transaction:', error);
    throw error;
  }
}
