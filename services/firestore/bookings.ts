import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Booking } from '@/types';

const BOOKINGS_COLLECTION = 'bookings';

export async function createBooking(booking: Omit<Booking, 'id'>): Promise<string> {
  try {
    const cleanedBooking: any = {
      ...booking,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    Object.keys(cleanedBooking).forEach(key => {
      if (cleanedBooking[key] === undefined) {
        delete cleanedBooking[key];
      }
    });

    console.log('[Firestore] Creating booking with data:', JSON.stringify(cleanedBooking, null, 2));
    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), cleanedBooking);
    console.log('[Firestore] Booking created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error: any) {
    console.error('[Firestore] Error creating booking:', error);
    console.error('[Firestore] Error code:', error?.code);
    console.error('[Firestore] Error message:', error?.message);
    throw error;
  }
}

export async function getBooking(bookingId: string): Promise<Booking | null> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Booking;
    }
    return null;
  } catch (error) {
    console.error('Error getting booking:', error);
    throw new Error('Failed to get booking');
  }
}

export async function getUserBookings(
  userId: string,
  role: 'customer' | 'provider',
  status?: string
): Promise<Booking[]> {
  try {
    console.log('[Firestore] Getting bookings for user:', userId, 'role:', role, 'status:', status);
    const bookingsRef = collection(db, BOOKINGS_COLLECTION);
    
    const constraints: QueryConstraint[] = [
      where(role === 'customer' ? 'clientId' : 'providerId', '==', userId)
    ];
    
    if (status) {
      constraints.push(where('status', '==', status));
    }
    
    constraints.push(orderBy('createdAt', 'desc'));
    constraints.push(limit(50));
    
    const q = query(bookingsRef, ...constraints);

    const querySnapshot = await getDocs(q);
    const bookings = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
    console.log('[Firestore] Found', bookings.length, 'bookings');
    return bookings;
  } catch (error: any) {
    console.error('[Firestore] Error getting user bookings:', error);
    console.error('[Firestore] Error code:', error?.code);
    console.error('[Firestore] Error message:', error?.message);
    throw error;
  }
}

export async function updateBookingStatus(
  bookingId: string,
  status: Booking['status']
): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      status,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    throw new Error('Failed to update booking status');
  }
}

export async function updateBooking(
  bookingId: string,
  updates: Partial<Booking>
): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking');
  }
}

export async function deleteBooking(bookingId: string): Promise<void> {
  try {
    const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('Error deleting booking:', error);
    throw new Error('Failed to delete booking');
  }
}

export function subscribeToBooking(
  bookingId: string,
  callback: (booking: Booking | null) => void
): () => void {
  const docRef = doc(db, BOOKINGS_COLLECTION, bookingId);
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Booking);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Firestore] Error in booking subscription:', error);
    }
  );
  
  return unsubscribe;
}

export function subscribeToUserBookings(
  userId: string,
  role: 'customer' | 'provider',
  callback: (bookings: Booking[]) => void,
  status?: string
): () => void {
  const bookingsRef = collection(db, BOOKINGS_COLLECTION);
  
  const constraints: QueryConstraint[] = [
    where(role === 'customer' ? 'clientId' : 'providerId', '==', userId)
  ];
  
  if (status) {
    constraints.push(where('status', '==', status));
  }
  
  constraints.push(orderBy('createdAt', 'desc'));
  constraints.push(limit(50));
  
  const q = query(bookingsRef, ...constraints);

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const bookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
      callback(bookings);
    },
    (error) => {
      console.error('[Firestore] Error in bookings subscription:', error);
    }
  );

  return unsubscribe;
}
