import {
  collection,
  doc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { Message, Conversation } from '@/types';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

export async function sendMessage(message: Omit<Message, 'id' | 'timestamp'>): Promise<string> {
  try {
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      timestamp: Timestamp.now(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message');
  }
}

export async function getConversationMessages(
  userId: string,
  otherUserId: string,
  limitCount: number = 50
): Promise<Message[]> {
  try {
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    const q = query(
      messagesRef,
      where('senderId', 'in', [userId, otherUserId]),
      where('receiverId', 'in', [userId, otherUserId]),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Message))
      .reverse();
  } catch (error) {
    console.error('Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

export function subscribeToMessages(
  userId: string,
  otherUserId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const q = query(
    messagesRef,
    where('senderId', 'in', [userId, otherUserId]),
    where('receiverId', 'in', [userId, otherUserId]),
    orderBy('timestamp', 'asc')
  );

  const unsubscribe = onSnapshot(q, snapshot => {
    const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    callback(messages);
  });

  return unsubscribe;
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  try {
    const docRef = doc(db, MESSAGES_COLLECTION, messageId);
    await updateDoc(docRef, { read: true });
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw new Error('Failed to mark message as read');
  }
}

export async function getUserConversations(userId: string): Promise<Conversation[]> {
  try {
    const conversationsRef = collection(db, CONVERSATIONS_COLLECTION);
    const q = query(
      conversationsRef,
      where('participants', 'array-contains', userId),
      orderBy('lastMessageTime', 'desc'),
      limit(50)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Conversation));
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw new Error('Failed to get conversations');
  }
}
