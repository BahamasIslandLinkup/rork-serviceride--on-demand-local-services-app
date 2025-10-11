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
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import type { Message, Conversation, MessageAttachment } from '@/types';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

export async function uploadMessageAttachment(
  file: { uri: string; type: string; name?: string },
  userId: string,
  onProgress?: (progress: number) => void
): Promise<{ uri: string; thumbnailUri?: string }> {
  try {
    const response = await fetch(file.uri);
    const blob = await response.blob();
    
    const timestamp = Date.now();
    const fileName = file.name || `${timestamp}.${file.type.split('/')[1]}`;
    const storageRef = ref(storage, `messages/${userId}/${timestamp}_${fileName}`);
    
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
          console.error('Upload error:', error);
          reject(error);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ uri: downloadURL });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    throw new Error('Failed to upload attachment');
  }
}

export async function sendMessage(
  message: Omit<Message, 'id' | 'timestamp'>,
  onUploadProgress?: (progress: number) => void
): Promise<string> {
  try {
    let uploadedAttachments: MessageAttachment[] | undefined;
    
    if (message.attachments && message.attachments.length > 0) {
      uploadedAttachments = [];
      
      for (let i = 0; i < message.attachments.length; i++) {
        const attachment = message.attachments[i];
        const { uri } = await uploadMessageAttachment(
          {
            uri: attachment.uri,
            type: attachment.mimeType,
            name: `attachment_${i}`,
          },
          message.senderId,
          (progress) => {
            const totalProgress = ((i + progress / 100) / message.attachments!.length) * 100;
            onUploadProgress?.(totalProgress);
          }
        );
        
        uploadedAttachments.push({
          ...attachment,
          uri,
        });
      }
    }
    
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), {
      ...message,
      attachments: uploadedAttachments,
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
    console.log('[Messages] Getting messages between', userId, 'and', otherUserId);
    const messagesRef = collection(db, MESSAGES_COLLECTION);
    
    const sentQuery = query(
      messagesRef,
      where('senderId', '==', userId),
      where('receiverId', '==', otherUserId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    
    const receivedQuery = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('receiverId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery),
    ]);
    
    const sentMessages = sentSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    const receivedMessages = receivedSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    
    const allMessages = [...sentMessages, ...receivedMessages];
    allMessages.sort((a, b) => {
      const aTime = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : (a.timestamp as any).toMillis();
      const bTime = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : (b.timestamp as any).toMillis();
      return aTime - bTime;
    });
    
    console.log('[Messages] Found', allMessages.length, 'messages');
    return allMessages.slice(-limitCount);
  } catch (error) {
    console.error('[Messages] Error getting messages:', error);
    throw new Error('Failed to get messages');
  }
}

export function subscribeToMessages(
  userId: string,
  otherUserId: string,
  callback: (messages: Message[]) => void
): () => void {
  console.log('[Messages] Subscribing to messages between', userId, 'and', otherUserId);
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  
  const sentQuery = query(
    messagesRef,
    where('senderId', '==', userId),
    where('receiverId', '==', otherUserId),
    orderBy('timestamp', 'asc')
  );
  
  const receivedQuery = query(
    messagesRef,
    where('senderId', '==', otherUserId),
    where('receiverId', '==', userId),
    orderBy('timestamp', 'asc')
  );
  
  let sentMessages: Message[] = [];
  let receivedMessages: Message[] = [];
  
  const updateMessages = () => {
    const allMessages = [...sentMessages, ...receivedMessages];
    allMessages.sort((a, b) => {
      const aTime = typeof a.timestamp === 'string' ? new Date(a.timestamp).getTime() : (a.timestamp as any).toMillis();
      const bTime = typeof b.timestamp === 'string' ? new Date(b.timestamp).getTime() : (b.timestamp as any).toMillis();
      return aTime - bTime;
    });
    callback(allMessages);
  };
  
  const unsubscribeSent = onSnapshot(sentQuery, snapshot => {
    sentMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    updateMessages();
  });
  
  const unsubscribeReceived = onSnapshot(receivedQuery, snapshot => {
    receivedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message));
    updateMessages();
  });

  return () => {
    unsubscribeSent();
    unsubscribeReceived();
  };
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
