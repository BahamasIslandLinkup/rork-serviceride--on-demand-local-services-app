import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AlertTriangle,
  Search,
  ChevronRight,
  Clock,
  User,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
} from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { getDisputes } from '@/services/firestore/admin';
import type { AdminDispute } from '@/types/admin';

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

const STATUS_FILTERS = ['all', 'open', 'investigating', 'pending_merchant_response', 'pending_decision', 'resolved', 'rejected'] as const;

export default function AdminDisputesScreen() {
  const { isAuthenticated, hasPermission } = useAdmin();
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<AdminDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<typeof STATUS_FILTERS[number]>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadDisputes();
  }, [isAuthenticated]);

  const loadDisputes = async () => {
    try {
      setIsLoading(true);
      const data = await getDisputes({});
      setDisputes(data);
    } catch (error) {
      console.error('[Admin] Failed to load disputes:', error);
      Alert.alert('Error', 'Failed to load disputes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const filterDisputes = useCallback(() => {
    let filtered = disputes;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter((d) => d.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.id.toLowerCase().includes(query) ||
          d.customerName?.toLowerCase().includes(query) ||
          d.merchantName?.toLowerCase().includes(query) ||
          d.reason.toLowerCase().includes(query)
      );
    }

    setFilteredDisputes(filtered);
  }, [disputes, searchQuery, selectedStatus]);

  useEffect(() => {
    filterDisputes();
  }, [filterDisputes]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadDisputes();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return COLORS.info;
      case 'investigating':
        return COLORS.warning;
      case 'pending_merchant_response':
        return COLORS.warning;
      case 'pending_decision':
        return COLORS.primary;
      case 'resolved':
        return COLORS.success;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getOutcomeColor = (outcome?: string) => {
    if (!outcome) return COLORS.textSecondary;
    switch (outcome) {
      case 'full_refund':
      case 'partial_refund':
        return COLORS.success;
      case 'denied':
        return COLORS.error;
      case 'merchant_credit':
      case 'customer_credit':
        return COLORS.primary;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return 'N/A';
    return `$${amount.toFixed(2)}`;
  };

  const getOutcomeIcon = (outcome?: string) => {
    if (!outcome) return null;
    switch (outcome) {
      case 'full_refund':
      case 'partial_refund':
      case 'merchant_credit':
      case 'customer_credit':
        return <CheckCircle size={16} color={getOutcomeColor(outcome)} />;
      case 'denied':
        return <XCircle size={16} color={getOutcomeColor(outcome)} />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Disputes',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search disputes..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {STATUS_FILTERS.map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status.replace(/_/g, ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredDisputes.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {filteredDisputes.filter((d) => d.status === 'open' || d.status === 'investigating').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {filteredDisputes.filter((d) => d.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          {filteredDisputes.length === 0 ? (
            <View style={styles.emptyState}>
              <AlertTriangle size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'No disputes match your filters'
                  : 'No disputes to display'}
              </Text>
            </View>
          ) : (
            filteredDisputes.map((dispute) => (
              <TouchableOpacity
                key={dispute.id}
                style={styles.disputeCard}
                onPress={() => {
                  Alert.alert(
                    'Dispute Details',
                    `ID: ${dispute.id}\nReason: ${dispute.reason}\nAmount: ${formatCurrency(dispute.requestedAmount)}`,
                    [{ text: 'OK' }]
                  );
                }}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.headerLeft}>
                    <View style={[styles.statusDot, { backgroundColor: getStatusColor(dispute.status) }]} />
                    <View>
                      <Text style={styles.disputeId}>#{dispute.id.substring(0, 8)}</Text>
                      <Text style={styles.disputeReason}>{dispute.reason.replace(/_/g, ' ')}</Text>
                    </View>
                  </View>
                  <View style={styles.headerRight}>
                    <Text style={styles.amount}>{formatCurrency(dispute.requestedAmount)}</Text>
                    {dispute.outcome && (
                      <View style={styles.outcomeContainer}>
                        {getOutcomeIcon(dispute.outcome)}
                        <Text style={[styles.outcomeText, { color: getOutcomeColor(dispute.outcome) }]}>
                          {dispute.outcome.replace(/_/g, ' ')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={styles.cardBody}>
                  <View style={styles.infoRow}>
                    <User size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>
                      {dispute.customerName} vs {dispute.merchantName}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Clock size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{formatDate(dispute.createdAt)}</Text>
                  </View>
                  {dispute.bookingId && (
                    <View style={styles.infoRow}>
                      <MessageSquare size={14} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>Booking #{dispute.bookingId.substring(0, 8)}</Text>
                    </View>
                  )}
                </View>

                {dispute.description && (
                  <View style={styles.cardDescription}>
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {dispute.description}
                    </Text>
                  </View>
                )}

                {dispute.evidence && dispute.evidence.length > 0 && (
                  <View style={styles.evidenceContainer}>
                    <Eye size={14} color={COLORS.primary} />
                    <Text style={styles.evidenceText}>{dispute.evidence.length} evidence file(s)</Text>
                  </View>
                )}

                <View style={styles.cardFooter}>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(dispute.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(dispute.status) }]}>
                      {dispute.status.replace(/_/g, ' ').toUpperCase()}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={COLORS.textSecondary} />
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {hasPermission('disputes', 'create') && (
          <TouchableOpacity
            style={styles.fab}
            onPress={() => Alert.alert('Info', 'Create dispute feature coming soon')}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}
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
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  disputeCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  disputeId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 2,
  },
  disputeReason: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textTransform: 'capitalize' as const,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  amount: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.primary,
    marginBottom: 4,
  },
  outcomeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  outcomeText: {
    fontSize: 11,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  cardBody: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cardDescription: {
    padding: 12,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  evidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: 8,
    marginBottom: 12,
  },
  evidenceText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600' as const,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
  fab: {
    position: 'absolute' as const,
    right: 24,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabText: {
    fontSize: 28,
    color: COLORS.background,
    fontWeight: '700' as const,
  },
});
