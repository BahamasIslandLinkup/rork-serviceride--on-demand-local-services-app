import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  User,
  MessageSquare,
  AlertCircle,
  Send,

  CheckCircle,
  XCircle,
  Tag,
} from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import {
  getTicketById,
  getTicketComments,
  addTicketComment,
  updateTicket,
} from '@/services/firestore/admin';
import type { Ticket, TicketComment } from '@/types/admin';

const COLORS = {
  background: '#0A0F1C',
  card: '#1A1F2E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2F3E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF4444',
  info: '#2196F3',
};

const PRIORITY_COLORS = {
  low: '#4CAF50',
  medium: '#2196F3',
  high: '#FF9800',
  urgent: '#FF4444',
};

const STATUS_COLORS = {
  new: '#2196F3',
  open: '#4CAF50',
  pending: '#FF9800',
  awaiting_customer: '#FF9800',
  awaiting_merchant: '#FF9800',
  in_progress: '#4CAF50',
  resolved: '#4CAF50',
  closed: '#A0A0A0',
};

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { adminUser, hasPermission, isAuthenticated } = useAdmin();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    if (id) {
      loadTicketData();
    }
  }, [isAuthenticated, id, loadTicketData]);

  const loadTicketData = useCallback(async () => {
    if (!id) return;
    try {
      const [ticketData, commentsData] = await Promise.all([
        getTicketById(id),
        getTicketComments(id),
      ]);
      setTicket(ticketData);
      setComments(commentsData);
    } catch (error) {
      console.error('[Admin] Failed to load ticket:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const handleSendComment = async () => {
    if (!commentText.trim() || !adminUser || !id) return;

    setIsSending(true);
    try {
      await addTicketComment(
        id,
        {
          ticketId: id,
          authorId: adminUser.id,
          authorName: adminUser.name,
          authorRole: 'admin',
          text: commentText.trim(),
          attachments: [],
          isInternal: isInternal,
        },
        adminUser.id,
        adminUser.name
      );
      setCommentText('');
      await loadTicketData();
    } catch (error) {
      console.error('[Admin] Failed to send comment:', error);
      Alert.alert('Error', 'Failed to send comment');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: Ticket['status']) => {
    if (!id || !adminUser) return;

    try {
      await updateTicket(id, { status: newStatus }, adminUser.id, adminUser.name);
      await loadTicketData();
      Alert.alert('Success', `Ticket status updated to ${newStatus}`);
    } catch (error) {
      console.error('[Admin] Failed to update status:', error);
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const handleUpdatePriority = async (newPriority: Ticket['priority']) => {
    if (!id || !adminUser) return;

    try {
      await updateTicket(id, { priority: newPriority }, adminUser.id, adminUser.name);
      await loadTicketData();
      Alert.alert('Success', `Ticket priority updated to ${newPriority}`);
    } catch (error) {
      console.error('[Admin] Failed to update priority:', error);
      Alert.alert('Error', 'Failed to update ticket priority');
    }
  };

  const handleAssignToMe = async () => {
    if (!id || !adminUser) return;

    try {
      await updateTicket(
        id,
        { assigneeId: adminUser.id, assigneeName: adminUser.name },
        adminUser.id,
        adminUser.name
      );
      await loadTicketData();
      Alert.alert('Success', 'Ticket assigned to you');
    } catch (error) {
      console.error('[Admin] Failed to assign ticket:', error);
      Alert.alert('Error', 'Failed to assign ticket');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.loadingContainer}>
        <AlertCircle size={48} color={COLORS.error} />
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Ticket #${ticket.id.slice(-6)}`,
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={100}
        >
          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
            <View style={styles.ticketHeader}>
              <Text style={styles.ticketSubject}>{ticket.subject}</Text>
              
              <View style={styles.metaRow}>
                <View style={[styles.badge, { backgroundColor: `${STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS]}20`, borderColor: STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] }]}>
                  <Text style={[styles.badgeText, { color: STATUS_COLORS[ticket.status as keyof typeof STATUS_COLORS] }]}>
                    {ticket.status.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
                <View style={[styles.badge, { backgroundColor: `${PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS]}20`, borderColor: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS] }]}>
                  <Text style={[styles.badgeText, { color: PRIORITY_COLORS[ticket.priority as keyof typeof PRIORITY_COLORS] }]}>
                    {ticket.priority.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Clock size={16} color={COLORS.textSecondary} />
                <Text style={styles.infoText}>{formatDate(ticket.createdAt)}</Text>
              </View>

              {ticket.assigneeName && (
                <View style={styles.infoRow}>
                  <User size={16} color={COLORS.textSecondary} />
                  <Text style={styles.infoText}>Assigned to {ticket.assigneeName}</Text>
                </View>
              )}

              {ticket.tags && ticket.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {ticket.tags.map((tag: string, index: number) => (
                    <View key={index} style={styles.tag}>
                      <Tag size={12} color={COLORS.primary} />
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.descriptionCard}>
                <Text style={styles.descriptionLabel}>Description</Text>
                <Text style={styles.descriptionText}>{ticket.description}</Text>
              </View>
            </View>

            {hasPermission('tickets', 'update') && (
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Quick Actions</Text>
                <View style={styles.actionsGrid}>
                  {!ticket.assigneeId && (
                    <TouchableOpacity style={styles.actionButton} onPress={handleAssignToMe}>
                      <User size={20} color={COLORS.primary} />
                      <Text style={styles.actionButtonText}>Assign to Me</Text>
                    </TouchableOpacity>
                  )}
                  
                  {ticket.status !== 'resolved' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus('resolved')}
                    >
                      <CheckCircle size={20} color={COLORS.success} />
                      <Text style={styles.actionButtonText}>Mark Resolved</Text>
                    </TouchableOpacity>
                  )}

                  {ticket.status !== 'closed' && ticket.status === 'resolved' && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleUpdateStatus('closed')}
                    >
                      <XCircle size={20} color={COLORS.textSecondary} />
                      <Text style={styles.actionButtonText}>Close Ticket</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            <View style={styles.commentsSection}>
              <Text style={styles.sectionTitle}>Timeline</Text>
              {comments.length === 0 ? (
                <View style={styles.emptyState}>
                  <MessageSquare size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No comments yet</Text>
                </View>
              ) : (
                comments.map((comment) => (
                  <View
                    key={comment.id}
                    style={[
                      styles.commentCard,
                      comment.isInternal && styles.internalComment,
                    ]}
                  >
                    {comment.isInternal && (
                      <View style={styles.internalBadge}>
                        <Text style={styles.internalBadgeText}>INTERNAL</Text>
                      </View>
                    )}
                    <View style={styles.commentHeader}>
                      <Text style={styles.commentAuthor}>{comment.authorName}</Text>
                      <Text style={styles.commentTime}>{formatDate(comment.createdAt)}</Text>
                    </View>
                    <Text style={styles.commentMessage}>{comment.text}</Text>
                  </View>
                ))
              )}
            </View>
          </ScrollView>

          {hasPermission('tickets', 'update') && (
            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.internalToggle}
                onPress={() => setIsInternal(!isInternal)}
              >
                <View style={[styles.checkbox, isInternal && styles.checkboxActive]} />
                <Text style={styles.internalLabel}>Internal Note</Text>
              </TouchableOpacity>
              
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  placeholder="Type your message..."
                  placeholderTextColor={COLORS.textSecondary}
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                  maxLength={1000}
                />
                <TouchableOpacity
                  style={[styles.sendButton, !commentText.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendComment}
                  disabled={!commentText.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <Send size={20} color={COLORS.background} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 16,
    marginTop: 16,
  },
  backButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  ticketHeader: {
    padding: 24,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  ticketSubject: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  descriptionCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  descriptionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  actionsSection: {
    padding: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  commentsSection: {
    padding: 24,
    paddingTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
  },
  commentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  internalComment: {
    backgroundColor: `${COLORS.warning}10`,
    borderColor: COLORS.warning,
  },
  internalBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: COLORS.warning,
    borderRadius: 4,
    marginBottom: 8,
  },
  internalBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  commentTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentMessage: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  inputContainer: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  internalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  internalLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500' as const,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});