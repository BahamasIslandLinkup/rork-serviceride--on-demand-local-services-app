import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { ProviderProfile } from '@/types';

const PROVIDERS_COLLECTION = 'providers';

export async function createProviderProfile(
  userId: string,
  profile: ProviderProfile
): Promise<void> {
  try {
    const docRef = doc(db, PROVIDERS_COLLECTION, userId);
    const cleanedProfile: any = {
      ...profile,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    Object.keys(cleanedProfile).forEach(key => {
      if (cleanedProfile[key] === undefined) {
        delete cleanedProfile[key];
      }
    });

    console.log('[Firestore] Creating provider profile:', userId);
    await setDoc(docRef, cleanedProfile);
    console.log('[Firestore] Provider profile created successfully');
  } catch (error) {
    console.error('[Firestore] Error creating provider profile:', error);
    throw error;
  }
}

export async function getProviderProfile(userId: string): Promise<ProviderProfile | null> {
  try {
    const docRef = doc(db, PROVIDERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as ProviderProfile;
    }
    return null;
  } catch (error) {
    console.error('[Firestore] Error getting provider profile:', error);
    throw error;
  }
}

export async function updateProviderProfile(
  userId: string,
  updates: Partial<ProviderProfile>
): Promise<void> {
  try {
    const docRef = doc(db, PROVIDERS_COLLECTION, userId);
    const cleanedUpdates: any = {
      ...updates,
      updatedAt: Timestamp.now(),
    };

    Object.keys(cleanedUpdates).forEach(key => {
      if (cleanedUpdates[key] === undefined) {
        delete cleanedUpdates[key];
      }
    });

    console.log('[Firestore] Updating provider profile:', userId);
    await updateDoc(docRef, cleanedUpdates);
    console.log('[Firestore] Provider profile updated successfully');
  } catch (error) {
    console.error('[Firestore] Error updating provider profile:', error);
    throw error;
  }
}

export function subscribeToProviderProfile(
  userId: string,
  callback: (profile: ProviderProfile | null) => void
): () => void {
  const docRef = doc(db, PROVIDERS_COLLECTION, userId);
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        callback({
          id: docSnap.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        } as ProviderProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Firestore] Error in provider profile subscription:', error);
    }
  );
  
  return unsubscribe;
}
