import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { Dispute, DisputeMessage, DisputeEvidence } from '@/types';

const DISPUTES_COLLECTION = 'disputes';
const DISPUTE_MESSAGES_COLLECTION = 'disputeMessages';

export async function uploadDisputeEvidence(
  file: { uri: string; type: string; name?: string },
  disputeId: string,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<DisputeEvidence> {
  try {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const fileName = file.name || `${timestamp}.${file.type.split('/')[1]}`;
    const storageRef = ref(storage, `disputes/${disputeId}/${userId}/${timestamp}_${fileName}`);
    
    const uploadTask = uploadBytesResumable(storageRef, blob, {
      contentType: file.type,
    });
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('[Disputes] Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const evidence: DisputeEvidence = {
            id: timestamp.toString(),
            type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'document',
            uri: downloadURL,
            uploadedAt: new Date().toISOString(),
          };
          resolve(evidence);
        }
      );
    });
  } catch (error) {
    console.error('[Disputes] Error uploading evidence:', error);
    throw new Error('Failed to upload evidence');
  }
}

export async function createDispute(
  dispute: Omit<Dispute, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, DISPUTES_COLLECTION), {
      ...dispute,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
    
    console.log('[Disputes] Dispute created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[Disputes] Error creating dispute:', error);
    throw new Error('Failed to create dispute');
  }
}

export async function getDispute(disputeId: string): Promise<Dispute | null> {
  try {
    const docRef = doc(db, DISPUTES_COLLECTION, disputeId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Dispute;
    }
    return null;
  } catch (error) {
    console.error('[Disputes] Error getting dispute:', error);
    throw new Error('Failed to get dispute');
  }
}

export async function getUserDisputes(userId: string): Promise<Dispute[]> {
  try {
    const disputesRef = collection(db, DISPUTES_COLLECTION);
    const q = query(
      disputesRef,
      where('customerId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Dispute));
  } catch (error) {
    console.error('[Disputes] Error getting user disputes:', error);
    throw new Error('Failed to get disputes');
  }
}

export async function updateDisputeStatus(
  disputeId: string,
  status: Dispute['status'],
  resolution?: string
): Promise<void> {
  try {
    const docRef = doc(db, DISPUTES_COLLECTION, disputeId);
    await updateDoc(docRef, {
      status,
      resolution,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('[Disputes] Error updating dispute status:', error);
    throw new Error('Failed to update dispute status');
  }
}

export async function sendDisputeMessage(
  message: Omit<DisputeMessage, 'id' | 'timestamp'>
): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, DISPUTE_MESSAGES_COLLECTION), {
      ...message,
      timestamp: Timestamp.now(),
    });
    
    await updateDoc(doc(db, DISPUTES_COLLECTION, message.disputeId), {
      updatedAt: Timestamp.now(),
    });
    
    return docRef.id;
  } catch (error) {
    console.error('[Disputes] Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

export async function getDisputeMessages(disputeId: string): Promise<DisputeMessage[]> {
  try {
    const messagesRef = collection(db, DISPUTE_MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('disputeId', '==', disputeId),
      orderBy('timestamp', 'asc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisputeMessage));
  } catch (error) {
    console.error('[Disputes] Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

export function subscribeToDispute(
  disputeId: string,
  callback: (dispute: Dispute | null) => void
): () => void {
  const docRef = doc(db, DISPUTES_COLLECTION, disputeId);
  
  const unsubscribe = onSnapshot(
    docRef,
    (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as Dispute);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('[Disputes] Error in dispute subscription:', error);
    }
  );
  
  return unsubscribe;
}

export function subscribeToDisputeMessages(
  disputeId: string,
  callback: (messages: DisputeMessage[]) => void
): () => void {
  const messagesRef = collection(db, DISPUTE_MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where('disputeId', '==', disputeId),
    orderBy('timestamp', 'asc')
  );
  
  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as DisputeMessage));
      callback(messages);
    },
    (error) => {
      console.error('[Disputes] Error in messages subscription:', error);
    }
  );
  
  return unsubscribe;
}
