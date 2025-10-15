import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, Plus } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { getTickets } from '@/services/firestore/admin';
import type { Ticket } from '@/types/admin';

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
  urgent: '#FF4444',
  high: '#FF9800',
  medium: '#FFD700',
  low: '#4CAF50',
};

export default function AdminTicketsScreen() {
  const { isAuthenticated, hasPermission } = useAdmin();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadTickets();
  }, [isAuthenticated, filterStatus]);

  const loadTickets = async () => {
    try {
      const data = await getTickets({ status: filterStatus, limitCount: 50 });
      setTickets(data);
    } catch (error) {
      console.error('[Admin] Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return COLORS.urgent;
      case 'high': return COLORS.high;
      case 'medium': return COLORS.medium;
      case 'low': return COLORS.low;
      default: return COLORS.textSecondary;
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.id.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Support Tickets' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search tickets..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity style={styles.filterButton}>
            <Filter size={20} color={COLORS.primary} />
          </TouchableOpacity>
          {hasPermission('tickets', 'create') && (
            <TouchableOpacity style={styles.addButton}>
              <Plus size={20} color={COLORS.background} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {filteredTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No tickets found</Text>
            </View>
          ) : (
            <View style={styles.list}>
              {filteredTickets.map((ticket) => (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.ticketCard}
                  onPress={() => {}}
                >
                  <View style={styles.ticketHeader}>
                    <Text style={styles.ticketId}>#{ticket.id.slice(0, 8)}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        { backgroundColor: `${getPriorityColor(ticket.priority)}20`, borderColor: getPriorityColor(ticket.priority) },
                      ]}
                    >
                      <Text style={[styles.priorityText, { color: getPriorityColor(ticket.priority) }]}>
                        {ticket.priority.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.ticketSubject} numberOfLines={1}>
                    {ticket.subject}
                  </Text>

                  <View style={styles.ticketFooter}>
                    <Text style={styles.ticketMeta}>{ticket.type}</Text>
                    <Text style={styles.ticketMeta}>•</Text>
                    <Text style={styles.ticketMeta}>{ticket.status}</Text>
                    {ticket.assigneeName && (
                      <>
                        <Text style={styles.ticketMeta}>•</Text>
                        <Text style={styles.ticketMeta}>{ticket.assigneeName}</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    color: COLORS.text,
    fontSize: 15,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  ticketCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  ticketId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  ticketSubject: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 12,
  },
  ticketFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ticketMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
});
