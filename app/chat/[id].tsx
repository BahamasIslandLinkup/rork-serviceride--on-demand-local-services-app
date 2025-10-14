import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Send, Paperclip, X, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { serviceProviders } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { sendMessage, subscribeToMessages } from '@/services/firestore/messages';
import type { Message, MessageAttachment } from '@/types';

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [attachments, setAttachments] = useState<MessageAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const provider = serviceProviders.find((p) => p.id === id);

  useEffect(() => {
    if (!user?.id || !id) {
      setIsLoadingMessages(false);
      return;
    }

    setIsLoadingMessages(true);
    console.log('[Chat] Setting up real-time message listener');
    const unsubscribe = subscribeToMessages(
      user.id,
      id as string,
      (newMessages) => {
        console.log('[Chat] Received messages:', newMessages.length);
        setMessages(newMessages);
        setIsLoadingMessages(false);
      },
      () => {
        setIsLoadingMessages(false);
      }
    );

    return () => {
      console.log('[Chat] Cleaning up message listener');
      unsubscribe();
    };
  }, [user?.id, id]);

  if (!provider) {
    return null;
  }

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to send images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: MessageAttachment[] = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random(),
          type: asset.type === 'video' ? 'video' : 'image',
          uri: asset.uri,
          size: asset.fileSize || 0,
          mimeType: asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg'),
        }));
        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to send messages');
      return;
    }

    setIsUploading(true);

    const messageText = message.trim();
    const messageAttachments = [...attachments];
    
    setMessage('');
    setAttachments([]);

    try {
      await sendMessage(
        {
          senderId: user.id,
          receiverId: id as string,
          text: messageText || undefined,
          attachments: messageAttachments.length > 0 ? messageAttachments : undefined,
          read: false,
        },
        (progress) => {
          console.log('[Chat] Upload progress:', progress);
        }
      );
      
      console.log('[Chat] Message sent successfully');
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('[Chat] Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      setMessage(messageText);
      setAttachments(messageAttachments);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen
        options={{
          title: provider.name,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {isLoadingMessages && messages.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading messages...</Text>
          </View>
        ) : messages.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No messages yet</Text>
            <Text style={[styles.emptySubtext, { color: colors.textLight }]}>Start the conversation!</Text>
          </View>
        ) : (
          messages.map((msg) => {
          const isMe = msg.senderId === user?.id;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage,
              ]}
            >
              {!isMe && (
                <Image
                  source={{ uri: provider.image }}
                  style={styles.messageAvatar}
                />
              )}
              <View
                style={[
                  styles.messageContent,
                  {
                    backgroundColor: isMe ? colors.primary : colors.card,
                  },
                ]}
              >
                {msg.attachments && msg.attachments.length > 0 && (
                  <View style={styles.attachmentsContainer}>
                    {msg.attachments.map((attachment) => (
                      <View key={attachment.id} style={styles.attachmentWrapper}>
                        {attachment.type === 'image' ? (
                          <Image
                            source={{ uri: attachment.uri }}
                            style={styles.attachmentImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <View style={styles.videoPlaceholder}>
                            <Video size={32} color="#fff" />
                            <Text style={styles.videoText}>Video</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
                {msg.text && (
                  <Text
                    style={[
                      styles.messageText,
                      { color: isMe ? '#fff' : colors.text },
                    ]}
                  >
                    {msg.text}
                  </Text>
                )}
                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.messageTime,
                      { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                    ]}
                  >
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                  {msg.uploadStatus === 'uploading' && (
                    <ActivityIndicator size="small" color={isMe ? '#fff' : colors.primary} style={styles.uploadIndicator} />
                  )}
                </View>
              </View>
            </View>
          );
        })
        )}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {attachments.length > 0 && (
          <ScrollView
            horizontal
            style={styles.attachmentPreviewContainer}
            showsHorizontalScrollIndicator={false}
          >
            {attachments.map((attachment) => (
              <View key={attachment.id} style={styles.attachmentPreview}>
                {attachment.type === 'image' ? (
                  <Image source={{ uri: attachment.uri }} style={styles.previewImage} />
                ) : (
                  <View style={[styles.previewImage, styles.videoPreview]}>
                    <Video size={24} color="#fff" />
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeAttachment}
                  onPress={() => removeAttachment(attachment.id)}
                  accessibilityLabel="Remove attachment"
                  accessibilityRole="button"
                >
                  <X size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        )}
        <View style={styles.inputRow}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.background }]}
            onPress={pickImage}
            disabled={isUploading}
            accessibilityLabel="Attach photo or video"
            accessibilityRole="button"
          >
            <Paperclip size={20} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text }]}
            placeholder="Type a message..."
            placeholderTextColor={colors.textSecondary}
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              { backgroundColor: (message.trim() || attachments.length > 0) ? colors.primary : colors.border },
            ]}
            onPress={handleSend}
            disabled={!message.trim() && attachments.length === 0 || isUploading}
            activeOpacity={0.7}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            {isUploading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  myMessage: {
    justifyContent: 'flex-end',
  },
  theirMessage: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  messageContent: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  attachmentsContainer: {
    marginBottom: 8,
    gap: 8,
  },
  attachmentWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  videoPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600' as const,
    marginTop: 8,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 11,
  },
  uploadIndicator: {
    marginLeft: 4,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
  },
  attachmentPreviewContainer: {
    marginBottom: 8,
    maxHeight: 80,
  },
  attachmentPreview: {
    marginRight: 8,
    position: 'relative' as const,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  videoPreview: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeAttachment: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-end',
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
});
