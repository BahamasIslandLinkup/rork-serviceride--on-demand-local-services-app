import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MessageCircle, Clock } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToConversations } from '@/services/firestore/messages';
import type { Conversation } from '@/types';

export default function MessagesScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      setConversations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeToConversations(
      user.id,
      (data) => {
        setConversations(data);
        setIsLoading(false);
        setError(null);
      },
      (subscriptionError) => {
        console.error('[Messages] Subscription error:', subscriptionError);
        setError('Failed to load conversations. Pull to refresh or try again later.');
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [user?.id]);

  const formatTime = (timestamp: string) => {
    if (!timestamp) {
      return 'Just now';
    }
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) {
      return 'Just now';
    }
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.max(Math.floor(diff / (1000 * 60)), 0);
    const hours = Math.floor(minutes / 60);
    
    if (hours < 1) {
      return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
    } else if (hours < 24) {
      return `${hours}h ago`;
    } else {
      const days = Math.floor(hours / 24);
      return `${days}d ago`;
    }
  };

  const renderContent = () => {
    if (!user?.id) {
      return (
        <View style={styles.emptyState}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign in to view messages</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Log in to start chatting with service providers.
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading conversations...
          </Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.emptyState}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Something went wrong</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>{error}</Text>
        </View>
      );
    }

    if (conversations.length === 0) {
      return (
        <View style={styles.emptyState}>
          <MessageCircle size={64} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            No messages yet
          </Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Start a conversation with a service provider
          </Text>
        </View>
      );
    }

    return conversations.map((conversation) => (
      <TouchableOpacity
        key={conversation.id}
        style={[styles.conversationCard, { backgroundColor: colors.card }]}
        onPress={() => router.push(`/chat/${conversation.participantId}` as any)}
        activeOpacity={0.7}
      >
        {conversation.participantImage ? (
          <Image
            source={{ uri: conversation.participantImage }}
            style={styles.avatar}
          />
        ) : (
          <View
            style={[
              styles.avatar,
              styles.avatarPlaceholder,
              { backgroundColor: colors.border },
            ]}
          >
            <MessageCircle size={24} color={colors.textSecondary} />
          </View>
        )}
        
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.participantName, { color: colors.text }]}>
              {conversation.participantName}
            </Text>
            <View style={styles.timeContainer}>
              <Clock size={12} color={colors.textSecondary} />
              <Text style={[styles.time, { color: colors.textSecondary }]}>
                {formatTime(conversation.lastMessageTime)}
              </Text>
            </View>
          </View>
          
          <View style={styles.messageRow}>
            <Text 
              style={[
                styles.lastMessage, 
                { color: conversation.unreadCount > 0 ? colors.text : colors.textSecondary }
              ]}
              numberOfLines={1}
            >
              {conversation.lastMessage || 'Sent a message'}
            </Text>
            {conversation.unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.unreadText}>
                  {conversation.unreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Text style={[styles.title, { color: colors.text }]}>Messages</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderContent()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 12,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 15,
  },
  conversationCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  participantName: {
    fontSize: 17,
    fontWeight: '600' as const,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 12,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
  },
});
