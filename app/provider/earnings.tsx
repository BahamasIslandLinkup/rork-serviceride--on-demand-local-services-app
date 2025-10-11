import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ChevronRight,
  CreditCard,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface Transaction {
  id: string;
  bookingId: string;
  customerName: string;
  service: string;
  amount: number;
  commission: number;
  platformFee: number;
  net: number;
  date: string;
  status: 'completed' | 'pending' | 'processing';
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    bookingId: 'BK001',
    customerName: 'Sarah Johnson',
    service: 'Oil Change',
    amount: 85.0,
    commission: 12.75,
    platformFee: 2.5,
    net: 69.75,
    date: '2025-10-10',
    status: 'completed',
  },
  {
    id: '2',
    bookingId: 'BK002',
    customerName: 'Mike Davis',
    service: 'Brake Inspection',
    amount: 170.0,
    commission: 25.5,
    platformFee: 2.5,
    net: 142.0,
    date: '2025-10-09',
    status: 'completed',
  },
  {
    id: '3',
    bookingId: 'BK003',
    customerName: 'Emily Chen',
    service: 'AC Repair',
    amount: 220.0,
    commission: 33.0,
    platformFee: 2.5,
    net: 184.5,
    date: '2025-10-08',
    status: 'processing',
  },
];

export default function EarningsScreen() {
  const { colors } = useTheme();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');

  const totalEarnings = mockTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalCommission = mockTransactions.reduce((sum, t) => sum + t.commission, 0);
  const totalFees = mockTransactions.reduce((sum, t) => sum + t.platformFee, 0);
  const netEarnings = mockTransactions.reduce((sum, t) => sum + t.net, 0);

  const periods = [
    { key: 'week' as const, label: 'Week' },
    { key: 'month' as const, label: 'Month' },
    { key: 'year' as const, label: 'Year' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Earnings',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    selectedPeriod === period.key ? colors.primary : colors.card,
                  borderColor:
                    selectedPeriod === period.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => setSelectedPeriod(period.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: selectedPeriod === period.key ? '#1E1E1E' : colors.text },
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <LinearGradient
          colors={[colors.primary, colors.secondary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.earningsCard}
        >
          <View style={styles.earningsHeader}>
            <Text style={styles.earningsLabel}>Net Earnings</Text>
            <TouchableOpacity style={styles.downloadButton}>
              <Download size={18} color="#1E1E1E" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>${netEarnings.toFixed(2)}</Text>
          <View style={styles.earningsStats}>
            <View style={styles.statItem}>
              <TrendingUp size={16} color="#1E1E1E" strokeWidth={2.5} />
              <Text style={styles.statText}>+12.5% vs last month</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={[styles.breakdownCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Earnings Breakdown</Text>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Gross Earnings
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.text }]}>
              ${totalEarnings.toFixed(2)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Commission (15%)
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.error }]}>
              -${totalCommission.toFixed(2)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Platform Fee
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.error }]}>
              -${totalFees.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Net Earnings</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${netEarnings.toFixed(2)}
            </Text>
          </View>
        </View>

        <View style={[styles.payoutCard, { backgroundColor: colors.card }]}>
          <View style={styles.payoutHeader}>
            <View style={styles.payoutInfo}>
              <CreditCard size={24} color={colors.primary} strokeWidth={2.5} />
              <View style={styles.payoutDetails}>
                <Text style={[styles.payoutTitle, { color: colors.text }]}>Next Payout</Text>
                <Text style={[styles.payoutDate, { color: colors.textSecondary }]}>
                  October 15, 2025
                </Text>
              </View>
            </View>
            <Text style={[styles.payoutAmount, { color: colors.primary }]}>
              ${netEarnings.toFixed(2)}
            </Text>
          </View>
          <View style={[styles.payoutNote, { backgroundColor: `${colors.primary}10` }]}>
            <Text style={[styles.payoutNoteText, { color: colors.textSecondary }]}>
              Payouts are processed weekly on Fridays
            </Text>
          </View>
        </View>

        <View style={[styles.transactionsCard, { backgroundColor: colors.card }]}>
          <View style={styles.transactionsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockTransactions.map(transaction => (
            <TouchableOpacity
              key={transaction.id}
              style={[styles.transactionItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionCustomer, { color: colors.text }]}>
                  {transaction.customerName}
                </Text>
                <Text style={[styles.transactionService, { color: colors.textSecondary }]}>
                  {transaction.service} • {transaction.date}
                </Text>
                <View style={styles.transactionBreakdown}>
                  <Text style={[styles.transactionBreakdownText, { color: colors.textLight }]}>
                    ${transaction.amount.toFixed(2)} - ${transaction.commission.toFixed(2)} - $
                    {transaction.platformFee.toFixed(2)}
                  </Text>
                </View>
              </View>
              <View style={styles.transactionRight}>
                <Text style={[styles.transactionAmount, { color: colors.success }]}>
                  +${transaction.net.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        transaction.status === 'completed'
                          ? `${colors.success}15`
                          : `${colors.primary}15`,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color:
                          transaction.status === 'completed' ? colors.success : colors.primary,
                      },
                    ]}
                  >
                    {transaction.status}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Download size={20} color={colors.primary} strokeWidth={2.5} />
          <Text style={[styles.exportButtonText, { color: colors.primary }]}>
            Export Statement
          </Text>
          <ChevronRight size={20} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  periodButtonText: {
    fontSize: 15,
    fontWeight: '700' as const,
  },
  earningsCard: {
    padding: 24,
    borderRadius: 20,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E1E1E',
  },
  downloadButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(30, 30, 30, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#1E1E1E',
    marginBottom: 12,
  },
  earningsStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E1E1E',
  },
  breakdownCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  breakdownLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  breakdownValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  payoutCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  payoutInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  payoutDetails: {
    flex: 1,
  },
  payoutTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  payoutDate: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  payoutAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  payoutNote: {
    padding: 12,
    borderRadius: 10,
  },
  payoutNoteText: {
    fontSize: 13,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  transactionsCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionCustomer: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  transactionService: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 6,
  },
  transactionBreakdown: {
    flexDirection: 'row',
  },
  transactionBreakdownText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
    textTransform: 'capitalize',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    flex: 1,
    textAlign: 'center',
  },
});
