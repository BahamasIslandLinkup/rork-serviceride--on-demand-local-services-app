import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
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
import { serviceProviders } from '@/mocks/services';
import type { Message, Conversation, MessageAttachment } from '@/types';

const MESSAGES_COLLECTION = 'messages';
const CONVERSATIONS_COLLECTION = 'conversations';

type UserSummary = {
  name: string;
  image?: string;
};

const messagePreview = (message: Message): string => {
  if (message.text && message.text.trim().length > 0) {
    return message.text;
  }

  if (message.attachments && message.attachments.length > 0) {
    const attachment = message.attachments[0];
    return attachment.type === 'image' ? 'Sent a photo' : 'Sent a video';
  }

  return 'New message';
};

const toIsoTimestamp = (value: any): string => {
  if (!value) {
    return new Date().toISOString();
  }

  if (value instanceof Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  if (typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
    return new Timestamp(value.seconds, value.nanoseconds).toDate().toISOString();
  }

  return new Date().toISOString();
};

const getTimestampMillis = (value: string): number => {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
};

const mapDocumentToMessage = (docSnapshot: { id: string; data: () => Record<string, any> }): Message => {
  const data = docSnapshot.data();
  return {
    ...(data as Message),
    id: docSnapshot.id,
    timestamp: toIsoTimestamp(data.timestamp),
  };
};

const sortMessagesByTimestamp = (messages: Message[]): Message[] =>
  [...messages].sort((a, b) => getTimestampMillis(a.timestamp) - getTimestampMillis(b.timestamp));

const ensureUserSummary = async (
  userId: string,
  cache: Map<string, UserSummary>
): Promise<UserSummary> => {
  if (cache.has(userId)) {
    return cache.get(userId)!;
  }

  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data() as Record<string, any>;
      const summary: UserSummary = {
        name: (data.name || data.displayName || data.fullName || data.email || 'Unknown user') as string,
        image: (data.photoURL || data.avatar || data.image || undefined) as string | undefined,
      };
      cache.set(userId, summary);
      return summary;
    }
  } catch (error) {
    console.error('[Messages] Failed to fetch user summary for', userId, error);
  }

  const mockProvider = serviceProviders.find((provider) => provider.id === userId);
  if (mockProvider) {
    const summary: UserSummary = {
      name: mockProvider.name,
      image: mockProvider.image,
    };
    cache.set(userId, summary);
    return summary;
  }

  const fallback: UserSummary = {
    name: `User ${userId.slice(0, 6)}`,
  };
  cache.set(userId, fallback);
  return fallback;
};

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
    const { attachments, ...messageWithoutAttachments } = message;
    const sanitizedMessage = Object.fromEntries(
      Object.entries(messageWithoutAttachments).filter(
        ([, value]) => value !== undefined && value !== null
      )
    );
    let uploadedAttachments: MessageAttachment[] | undefined;
    
    if (attachments && attachments.length > 0) {
      uploadedAttachments = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const attachment = attachments[i];
        const { uri } = await uploadMessageAttachment(
          {
            uri: attachment.uri,
            type: attachment.mimeType,
            name: `attachment_${i}`,
          },
          message.senderId,
          (progress) => {
            const totalProgress = ((i + progress / 100) / attachments!.length) * 100;
            onUploadProgress?.(totalProgress);
          }
        );
        
        uploadedAttachments.push({
          ...attachment,
          uri,
        });
      }
    }
    const docData: Record<string, any> = {
      ...sanitizedMessage,
      timestamp: Timestamp.now(),
    };

    if (uploadedAttachments && uploadedAttachments.length > 0) {
      docData.attachments = uploadedAttachments;
    }
    
    const docRef = await addDoc(collection(db, MESSAGES_COLLECTION), docData);
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
      where('receiverId', '==', otherUserId)
    );
    
    const receivedQuery = query(
      messagesRef,
      where('senderId', '==', otherUserId),
      where('receiverId', '==', userId)
    );

    const [sentSnapshot, receivedSnapshot] = await Promise.all([
      getDocs(sentQuery),
      getDocs(receivedQuery),
    ]);
    
    const sentMessages = sentSnapshot.docs.map(mapDocumentToMessage);
    const receivedMessages = receivedSnapshot.docs.map(mapDocumentToMessage);
    
    const allMessages = sortMessagesByTimestamp([...sentMessages, ...receivedMessages]);
    
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
  callback: (messages: Message[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.log('[Messages] Subscribing to messages between', userId, 'and', otherUserId);
  const messagesRef = collection(db, MESSAGES_COLLECTION);
  
  const sentQuery = query(
    messagesRef,
    where('senderId', '==', userId),
    where('receiverId', '==', otherUserId),
  );
  
  const receivedQuery = query(
    messagesRef,
    where('senderId', '==', otherUserId),
    where('receiverId', '==', userId),
  );
  
  let sentMessages: Message[] = [];
  let receivedMessages: Message[] = [];
  
  const updateMessages = () => {
    const allMessages = sortMessagesByTimestamp([...sentMessages, ...receivedMessages]);
    callback(allMessages);
  };
  const handleError = (error: any) => {
    console.error('[Messages] Error in messages subscription:', error);
    onError?.(error);
  };
  
  const unsubscribeSent = onSnapshot(
    sentQuery,
    snapshot => {
      sentMessages = snapshot.docs.map(mapDocumentToMessage);
      updateMessages();
    },
    handleError
  );
  
  const unsubscribeReceived = onSnapshot(
    receivedQuery,
    snapshot => {
      receivedMessages = snapshot.docs.map(mapDocumentToMessage);
      updateMessages();
    },
    handleError
  );

  return () => {
    unsubscribeSent();
    unsubscribeReceived();
  };
}

export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void,
  onError?: (error: Error) => void
): () => void {
  console.log('[Messages] Subscribing to conversations for', userId);

  const messagesRef = collection(db, MESSAGES_COLLECTION);
  const userCache = new Map<string, UserSummary>();

  const sentQuery = query(
    messagesRef,
    where('senderId', '==', userId),
  );

  const receivedQuery = query(
    messagesRef,
    where('receiverId', '==', userId),
  );

  let sentMessages: Message[] = [];
  let receivedMessages: Message[] = [];
  let isProcessing = false;
  let shouldProcessAgain = false;

  const buildConversations = async () => {
    if (isProcessing) {
      shouldProcessAgain = true;
      return;
    }

    isProcessing = true;
    shouldProcessAgain = false;

    try {
      const allMessages = sortMessagesByTimestamp([...sentMessages, ...receivedMessages]);
      const conversationMap = new Map<string, Conversation>();

      for (const message of allMessages) {
        const otherUserId = message.senderId === userId ? message.receiverId : message.senderId;
        if (!otherUserId) {
          continue;
        }

        const existing = conversationMap.get(otherUserId);
        const messageTime = message.timestamp;

        if (!existing) {
          conversationMap.set(otherUserId, {
            id: otherUserId,
            participantId: otherUserId,
            participantName: '',
            participantImage: '',
            lastMessage: messagePreview(message),
            lastMessageTime: messageTime,
            unreadCount: message.receiverId === userId && !message.read ? 1 : 0,
          });
        } else {
          if (getTimestampMillis(messageTime) >= getTimestampMillis(existing.lastMessageTime)) {
            existing.lastMessage = messagePreview(message);
            existing.lastMessageTime = messageTime;
          }

          if (message.receiverId === userId && !message.read) {
            existing.unreadCount += 1;
          }
        }
      }

      const participantIds = Array.from(conversationMap.keys());
      await Promise.all(
        participantIds.map(async (participantId) => {
          const summary = await ensureUserSummary(participantId, userCache);
          const conversation = conversationMap.get(participantId);
          if (conversation) {
            conversation.participantName = summary.name;
            if (summary.image) {
              conversation.participantImage = summary.image;
            }
          }
        })
      );

      const conversations = Array.from(conversationMap.values())
        .sort((a, b) => getTimestampMillis(b.lastMessageTime) - getTimestampMillis(a.lastMessageTime))
        .slice(0, 50);

      callback(conversations);
    } catch (error) {
      console.error('[Messages] Error building conversations:', error);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    } finally {
      isProcessing = false;
      if (shouldProcessAgain) {
        buildConversations();
      }
    }
  };

  const handleSnapshotError = (error: any) => {
    console.error('[Messages] Error in conversations subscription:', error);
    onError?.(error instanceof Error ? error : new Error(String(error)));
  };

  const unsubscribeSent = onSnapshot(
    sentQuery,
    (snapshot) => {
      sentMessages = snapshot.docs.map(mapDocumentToMessage);
      buildConversations();
    },
    handleSnapshotError
  );

  const unsubscribeReceived = onSnapshot(
    receivedQuery,
    (snapshot) => {
      receivedMessages = snapshot.docs.map(mapDocumentToMessage);
      buildConversations();
    },
    handleSnapshotError
  );

  // Emit the initial empty state
  buildConversations();

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
    return querySnapshot.docs.map((docSnapshot) => {
      const data = docSnapshot.data() as Record<string, any>;
      return {
        id: docSnapshot.id,
        participantId: (data.participantId || data.otherUserId || '') as string,
        participantName: (data.participantName || data.otherUserName || 'Unknown user') as string,
        participantImage: (data.participantImage || data.otherUserImage || '') as string,
        lastMessage: (data.lastMessage || '') as string,
        lastMessageTime: toIsoTimestamp(data.lastMessageTime),
        unreadCount: (data.unreadCount || 0) as number,
      };
    });
  } catch (error) {
    console.error('Error getting conversations:', error);
    throw new Error('Failed to get conversations');
  }
}
