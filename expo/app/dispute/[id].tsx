import React, { useState, useRef } from 'react';
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
import { Send, Paperclip, X, Video, AlertCircle, Clock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import type { DisputeMessage, DisputeEvidence } from '@/types';

const mockDisputeMessages: DisputeMessage[] = [
  {
    id: '1',
    disputeId: '1',
    senderId: 'user1',
    senderName: 'John Smith',
    senderRole: 'customer',
    text: 'The brake repair was incomplete and the issue persists. I paid $170 but the problem was not fixed.',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
];

export default function DisputeDetailScreen() {
  const { id } = useLocalSearchParams();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<DisputeMessage[]>(mockDisputeMessages);
  const [attachments, setAttachments] = useState<DisputeEvidence[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const dispute = {
    id: '1',
    status: 'awaiting_merchant' as const,
    providerName: 'Mike Johnson',
    reason: 'Service not completed as agreed',
    merchantResponseDeadline: new Date(Date.now() + 22 * 60 * 60 * 1000).toISOString(),
  };

  const pickAttachment = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to attach files.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets) {
        const newAttachments: DisputeEvidence[] = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random(),
          type: asset.type === 'video' ? 'video' : 'image',
          uri: asset.uri,
          uploadedAt: new Date().toISOString(),
        }));
        setAttachments([...attachments, ...newAttachments]);
      }
    } catch (error) {
      console.error('Error picking attachment:', error);
      Alert.alert('Error', 'Failed to pick attachment');
    }
  };

  const removeAttachment = (attachmentId: string) => {
    setAttachments(attachments.filter(a => a.id !== attachmentId));
  };

  const handleSend = async () => {
    if (!message.trim() && attachments.length === 0) return;

    setIsUploading(true);

    try {
      const newMessage: DisputeMessage = {
        id: Date.now().toString(),
        disputeId: id as string,
        senderId: user?.id || 'user1',
        senderName: user?.name || 'John Smith',
        senderRole: user?.role || 'customer',
        text: message.trim() || undefined,
        attachments: attachments.length > 0 ? attachments : undefined,
        timestamp: new Date().toISOString(),
        read: false,
      };

      setMessages([...messages, newMessage]);
      setMessage('');
      setAttachments([]);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setIsUploading(false);
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Overdue';
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''}`;
  };

  const getRoleBadgeColor = (role: 'customer' | 'provider' | 'admin') => {
    switch (role) {
      case 'customer':
        return colors.primary;
      case 'provider':
        return colors.warning;
      case 'admin':
        return colors.success;
      default:
        return colors.textSecondary;
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
          title: `Dispute #${id}`,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      {dispute.status === 'awaiting_merchant' && dispute.merchantResponseDeadline && (
        <View style={[styles.statusBanner, { backgroundColor: colors.warning + '20' }]}>
          <Clock size={20} color={colors.warning} />
          <View style={styles.statusBannerText}>
            <Text style={[styles.statusTitle, { color: colors.text }]}>Awaiting Merchant Response</Text>
            <Text style={[styles.statusSubtitle, { color: colors.textSecondary }]}>
              {getTimeRemaining(dispute.merchantResponseDeadline)} remaining
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        <View style={[styles.disputeHeader, { backgroundColor: colors.card }]}>
          <AlertCircle size={24} color={colors.primary} />
          <View style={styles.disputeHeaderText}>
            <Text style={[styles.disputeTitle, { color: colors.text }]}>{dispute.reason}</Text>
            <Text style={[styles.disputeProvider, { color: colors.textSecondary }]}>
              Dispute with {dispute.providerName}
            </Text>
          </View>
        </View>

        {messages.map((msg) => {
          const isMe = msg.senderId === user?.id || msg.senderId === 'user1';
          return (
            <View
              key={msg.id}
              style={[
                styles.messageBubble,
                isMe ? styles.myMessage : styles.theirMessage,
              ]}
            >
              <View
                style={[
                  styles.messageContent,
                  {
                    backgroundColor: isMe ? colors.primary : colors.card,
                  },
                ]}
              >
                <View style={styles.messageHeader}>
                  <Text style={[styles.senderName, { color: isMe ? '#fff' : colors.text }]}>
                    {msg.senderName}
                  </Text>
                  <View style={[styles.roleBadge, { backgroundColor: getRoleBadgeColor(msg.senderRole) + '30' }]}>
                    <Text style={[styles.roleText, { color: getRoleBadgeColor(msg.senderRole) }]}>
                      {msg.senderRole}
                    </Text>
                  </View>
                </View>

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

                <Text
                  style={[
                    styles.messageTime,
                    { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary },
                  ]}
                >
                  {new Date(msg.timestamp).toLocaleString([], {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Text>
              </View>
            </View>
          );
        })}
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
            onPress={pickAttachment}
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
            maxLength={1000}
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
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  statusBannerText: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  statusSubtitle: {
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  disputeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  disputeHeaderText: {
    flex: 1,
  },
  disputeTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  disputeProvider: {
    fontSize: 13,
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
  messageContent: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  senderName: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  roleText: {
    fontSize: 10,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
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
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 11,
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
});
