import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Clock,
  User,
  Tag,
  Send,
  Paperclip,
  CheckCircle,
  MapPin,
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

const STATUS_OPTIONS = ['open', 'in_progress', 'awaiting_customer', 'awaiting_merchant', 'resolved', 'closed'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'urgent'] as const;

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams();
  const { adminUser, isAuthenticated, hasPermission } = useAdmin();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [comments, setComments] = useState<TicketComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadTicketData();
  }, [isAuthenticated, id]);

  const loadTicketData = async () => {
    try {
      setIsLoading(true);
      const [ticketData, commentsData] = await Promise.all([
        getTicketById(id as string),
        getTicketComments(id as string),
      ]);
      
      setTicket(ticketData);
      setComments(commentsData);
    } catch (error) {
      console.error('[Admin] Failed to load ticket:', error);
      Alert.alert('Error', 'Failed to load ticket details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendComment = async () => {
    if (!newComment.trim() || !adminUser || !ticket) return;

    if (!hasPermission('tickets', 'update')) {
      Alert.alert('Permission Denied', 'You do not have permission to add comments');
      return;
    }

    try {
      setIsSending(true);
      await addTicketComment(
        id as string,
        {
          ticketId: id as string,
          authorId: adminUser.id,
          authorName: adminUser.name,
          authorRole: 'admin' as const,
          text: newComment.trim(),
          isInternal,
          attachments: [],
        },
        adminUser.id,
        adminUser.name
      );

      setNewComment('');
      setIsInternal(false);
      await loadTicketData();
    } catch (error) {
      console.error('[Admin] Failed to add comment:', error);
      Alert.alert('Error', 'Failed to add comment');
    } finally {
      setIsSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus: typeof STATUS_OPTIONS[number]) => {
    if (!adminUser || !ticket) return;

    if (!hasPermission('tickets', 'update')) {
      Alert.alert('Permission Denied', 'You do not have permission to update ticket status');
      return;
    }

    try {
      await updateTicket(
        id as string,
        { status: newStatus },
        adminUser.id,
        adminUser.name
      );
      await loadTicketData();
      Alert.alert('Success', 'Ticket status updated');
    } catch (error) {
      console.error('[Admin] Failed to update status:', error);
      Alert.alert('Error', 'Failed to update ticket status');
    }
  };

  const handleUpdatePriority = async (newPriority: typeof PRIORITY_OPTIONS[number]) => {
    if (!adminUser || !ticket) return;

    if (!hasPermission('tickets', 'update')) {
      Alert.alert('Permission Denied', 'You do not have permission to update ticket priority');
      return;
    }

    try {
      await updateTicket(
        id as string,
        { priority: newPriority },
        adminUser.id,
        adminUser.name
      );
      await loadTicketData();
      Alert.alert('Success', 'Ticket priority updated');
    } catch (error) {
      console.error('[Admin] Failed to update priority:', error);
      Alert.alert('Error', 'Failed to update ticket priority');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return COLORS.info;
      case 'in_progress':
        return COLORS.primary;
      case 'awaiting_customer':
      case 'awaiting_merchant':
        return COLORS.warning;
      case 'resolved':
        return COLORS.success;
      case 'closed':
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return COLORS.error;
      case 'high':
        return COLORS.warning;
      case 'medium':
        return COLORS.primary;
      case 'low':
        return COLORS.textSecondary;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString();
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
        <Text style={styles.errorText}>Ticket not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: `Ticket #${ticket.id.substring(0, 8)}`,
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
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <Text style={styles.title}>{ticket.subject}</Text>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(ticket.status)}20` }]}>
                <Text style={[styles.statusText, { color: getStatusColor(ticket.status) }]}>
                  {ticket.status.replace(/_/g, ' ').toUpperCase()}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <User size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{ticket.customerName || 'N/A'}</Text>
              </View>
              <View style={styles.metaItem}>
                <Clock size={16} color={COLORS.textSecondary} />
                <Text style={styles.metaText}>{formatDate(ticket.createdAt)}</Text>
              </View>
              <View style={styles.metaItem}>
                <Tag size={16} color={getPriorityColor(ticket.priority)} />
                <Text style={[styles.metaText, { color: getPriorityColor(ticket.priority) }]}>
                  {ticket.priority.toUpperCase()}
                </Text>
              </View>
            </View>

            {ticket.tags && ticket.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {ticket.tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{ticket.description}</Text>
          </View>

          {ticket.bookingId && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Related Booking</Text>
              <TouchableOpacity
                style={styles.relatedCard}
                onPress={() => router.push(`/admin/bookings` as any)}
              >
                <MapPin size={20} color={COLORS.primary} />
                <Text style={styles.relatedText}>Booking #{ticket.bookingId.substring(0, 8)}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <View style={styles.actionColumn}>
                <Text style={styles.actionLabel}>Status</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionsScroll}>
                  {STATUS_OPTIONS.map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.optionButton,
                        ticket.status === status && styles.optionButtonActive,
                        { borderColor: getStatusColor(status) },
                      ]}
                      onPress={() => handleUpdateStatus(status)}
                    >
                      <Text
                        style={[
                          styles.optionButtonText,
                          ticket.status === status && { color: getStatusColor(status) },
                        ]}
                      >
                        {status.replace(/_/g, ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <View style={styles.actionColumn}>
                <Text style={styles.actionLabel}>Priority</Text>
                <View style={styles.priorityButtons}>
                  {PRIORITY_OPTIONS.map((priority) => (
                    <TouchableOpacity
                      key={priority}
                      style={[
                        styles.priorityButton,
                        ticket.priority === priority && styles.priorityButtonActive,
                        { borderColor: getPriorityColor(priority) },
                      ]}
                      onPress={() => handleUpdatePriority(priority)}
                    >
                      <Text
                        style={[
                          styles.priorityButtonText,
                          ticket.priority === priority && { color: getPriorityColor(priority) },
                        ]}
                      >
                        {priority}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          </View>



          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Comments ({comments.length})</Text>
            {comments.map((comment, index) => (
              <View
                key={index}
                style={[
                  styles.commentCard,
                  comment.isInternal && styles.commentCardInternal,
                ]}
              >
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthor}>
                    <User size={16} color={comment.isInternal ? COLORS.warning : COLORS.primary} />
                    <Text style={styles.commentAuthorName}>{comment.authorName}</Text>
                    {comment.isInternal && (
                      <View style={styles.internalBadge}>
                        <Text style={styles.internalBadgeText}>INTERNAL</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.commentDate}>{formatDate(comment.createdAt)}</Text>
                </View>
                <Text style={styles.commentContent}>{comment.text}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.commentInputHeader}>
              <Text style={styles.sectionTitle}>Add Comment</Text>
              <TouchableOpacity
                style={styles.internalToggle}
                onPress={() => setIsInternal(!isInternal)}
              >
                <View style={[styles.checkbox, isInternal && styles.checkboxActive]}>
                  {isInternal && <CheckCircle size={16} color={COLORS.warning} />}
                </View>
                <Text style={styles.internalToggleText}>Internal Note</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.commentInputContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Type your comment..."
                placeholderTextColor={COLORS.textSecondary}
                multiline
                numberOfLines={4}
                value={newComment}
                onChangeText={setNewComment}
              />
              <View style={styles.commentActions}>
                <TouchableOpacity style={styles.attachButton}>
                  <Paperclip size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.sendButton, !newComment.trim() && styles.sendButtonDisabled]}
                  onPress={handleSendComment}
                  disabled={!newComment.trim() || isSending}
                >
                  {isSending ? (
                    <ActivityIndicator size="small" color={COLORS.background} />
                  ) : (
                    <>
                      <Send size={16} color={COLORS.background} />
                      <Text style={styles.sendButtonText}>Send</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
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
    fontWeight: '600' as const,
  },
  backButton: {
    padding: 8,
    marginLeft: Platform.OS === 'web' ? 8 : 0,
  },
  header: {
    padding: 24,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: COLORS.text,
    flex: 1,
    marginRight: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: `${COLORS.primary}20`,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  section: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  relatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  relatedText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  actionButtons: {
    gap: 20,
  },
  actionColumn: {
    gap: 8,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  optionsScroll: {
    flexDirection: 'row',
  },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 8,
  },
  optionButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  optionButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  priorityButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityButtonActive: {
    backgroundColor: `${COLORS.primary}15`,
  },
  priorityButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginRight: 12,
    marginTop: 4,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  timelineDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  timelineDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  commentCardInternal: {
    backgroundColor: `${COLORS.warning}10`,
    borderColor: `${COLORS.warning}30`,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  commentAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  commentAuthorName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  internalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: `${COLORS.warning}30`,
    borderRadius: 4,
  },
  internalBadgeText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: COLORS.warning,
  },
  commentDate: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  commentContent: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  commentInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  internalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    borderColor: COLORS.warning,
    backgroundColor: `${COLORS.warning}20`,
  },
  internalToggleText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  commentInputContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  commentInput: {
    padding: 16,
    fontSize: 14,
    color: COLORS.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  commentActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  attachButton: {
    padding: 8,
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
});
