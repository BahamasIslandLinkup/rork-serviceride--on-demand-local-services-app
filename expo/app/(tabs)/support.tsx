import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { AlertCircle, Clock, CheckCircle, XCircle, Plus } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import type { Dispute } from '@/types';

const mockDisputes: Dispute[] = [
  {
    id: '1',
    bookingId: 'booking1',
    customerId: 'user1',
    customerName: 'John Smith',
    providerId: 'provider1',
    providerName: 'Mike Johnson',
    category: 'service_quality',
    reason: 'Service not completed as agreed',
    description: 'The brake repair was incomplete and the issue persists.',
    evidence: [],
    status: 'awaiting_merchant',
    merchantResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    merchantResponded: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
  {
    id: '2',
    bookingId: 'booking2',
    customerId: 'user1',
    customerName: 'John Smith',
    providerId: 'provider2',
    providerName: 'Sarah Williams',
    category: 'payment',
    reason: 'Overcharged for service',
    description: 'I was charged $200 but the agreed price was $150.',
    evidence: [],
    status: 'under_review',
    merchantResponded: true,
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    messages: [],
  },
];

export default function SupportScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'open' | 'resolved'>('open');

  const openDisputes = mockDisputes.filter(d => 
    d.status === 'open' || d.status === 'awaiting_merchant' || d.status === 'under_review'
  );
  const resolvedDisputes = mockDisputes.filter(d => 
    d.status === 'resolved' || d.status === 'closed'
  );

  const displayDisputes = activeTab === 'open' ? openDisputes : resolvedDisputes;

  const getStatusColor = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return colors.warning;
      case 'awaiting_merchant':
        return colors.warning;
      case 'under_review':
        return colors.primary;
      case 'resolved':
        return colors.success;
      case 'closed':
        return colors.textSecondary;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return AlertCircle;
      case 'awaiting_merchant':
        return Clock;
      case 'under_review':
        return AlertCircle;
      case 'resolved':
        return CheckCircle;
      case 'closed':
        return XCircle;
      default:
        return AlertCircle;
    }
  };

  const getStatusText = (status: Dispute['status']) => {
    switch (status) {
      case 'open':
        return 'Open';
      case 'awaiting_merchant':
        return 'Awaiting Merchant';
      case 'under_review':
        return 'Under Review';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      default:
        return status;
    }
  };

  const getTimeRemaining = (deadline: string) => {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const diff = deadlineDate.getTime() - now.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 0) return 'Overdue';
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 24) return `${hours} hours remaining`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} remaining`;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Support & Disputes</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'open' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('open')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'open' ? '#fff' : colors.textSecondary }]}>
            Open ({openDisputes.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'resolved' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('resolved')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'resolved' ? '#fff' : colors.textSecondary }]}>
            Resolved ({resolvedDisputes.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayDisputes.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No disputes</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {activeTab === 'open'
                ? 'You have no open disputes'
                : 'No resolved disputes to show'}
            </Text>
          </View>
        ) : (
          displayDisputes.map((dispute) => {
            const StatusIcon = getStatusIcon(dispute.status);
            return (
              <TouchableOpacity
                key={dispute.id}
                style={[styles.disputeCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/dispute/${dispute.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`Dispute with ${dispute.providerName}`}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.statusBadge}>
                    <StatusIcon size={16} color={getStatusColor(dispute.status)} />
                    <Text style={[styles.statusText, { color: getStatusColor(dispute.status) }]}>
                      {getStatusText(dispute.status)}
                    </Text>
                  </View>
                  <Text style={[styles.caseId, { color: colors.textSecondary }]}>#{dispute.id}</Text>
                </View>

                <Text style={[styles.providerName, { color: colors.text }]}>{dispute.providerName}</Text>
                <Text style={[styles.reason, { color: colors.text }]}>{dispute.reason}</Text>
                <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={2}>
                  {dispute.description}
                </Text>

                {dispute.status === 'awaiting_merchant' && dispute.merchantResponseDeadline && (
                  <View style={[styles.deadlineCard, { backgroundColor: colors.background }]}>
                    <Clock size={16} color={colors.warning} />
                    <Text style={[styles.deadlineText, { color: colors.warning }]}>
                      {getTimeRemaining(dispute.merchantResponseDeadline)}
                    </Text>
                  </View>
                )}

                <Text style={[styles.timestamp, { color: colors.textSecondary }]}>
                  Created {new Date(dispute.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => router.push('/dispute/new')}
        accessibilityRole="button"
        accessibilityLabel="Create new dispute"
      >
        <Plus size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  disputeCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  caseId: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reason: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  deadlineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  deadlineText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  timestamp: {
    fontSize: 12,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 90,
    right: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});
