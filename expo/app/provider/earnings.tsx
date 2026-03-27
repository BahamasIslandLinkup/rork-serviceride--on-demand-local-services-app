import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  ChevronRight,
  CreditCard,
  AlertCircle,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useEarnings } from '@/hooks/useEarnings';

export default function EarningsScreen() {
  const { colors } = useTheme();
  const { summary, transactions, isLoading, error, period: currentPeriod, changePeriod, exportCSV, refresh } = useEarnings();

  const handleExport = async () => {
    const result = await exportCSV();
    if (!result.success && result.error) {
      console.error('Export failed:', result.error);
    }
  };

  const periods = [
    { key: 'weekly' as const, label: 'Week' },
    { key: 'monthly' as const, label: 'Month' },
    { key: 'all_time' as const, label: 'All Time' },
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
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {error && (
          <View style={[styles.errorCard, { backgroundColor: `${colors.error}10` }]}>
            <AlertCircle size={24} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
          </View>
        )}

        {isLoading && !summary ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading earnings...</Text>
          </View>
        ) : null}
        <View style={styles.periodSelector}>
          {periods.map(period => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    currentPeriod === period.key ? colors.primary : colors.card,
                  borderColor:
                    currentPeriod === period.key ? colors.primary : colors.border,
                },
              ]}
              onPress={() => changePeriod(period.key)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  { color: currentPeriod === period.key ? '#1E1E1E' : colors.text },
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
            <TouchableOpacity style={styles.downloadButton} onPress={handleExport}>
              <Download size={18} color="#1E1E1E" strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          <Text style={styles.earningsAmount}>${(summary?.netEarnings || 0).toFixed(2)}</Text>
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
              ${(summary?.grossEarnings || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: colors.textSecondary }]}>
              Commission
            </Text>
            <Text style={[styles.breakdownValue, { color: colors.error }]}>
              -${(summary?.commission || 0).toFixed(2)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.breakdownRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Net Earnings</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${(summary?.netEarnings || 0).toFixed(2)}
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
              ${(summary?.pendingPayouts || 0).toFixed(2)}
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

          {transactions.slice(0, 10).map(transaction => (
            <TouchableOpacity
              key={transaction.id}
              style={[styles.transactionItem, { borderBottomColor: colors.border }]}
              activeOpacity={0.7}
            >
              <View style={styles.transactionInfo}>
                <Text style={[styles.transactionCustomer, { color: colors.text }]}>
                  {transaction.type}
                </Text>
                <Text style={[styles.transactionService, { color: colors.textSecondary }]}>
                  {transaction.description} • {new Date(transaction.createdAt).toLocaleDateString()}
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
                  +${transaction.netAmount.toFixed(2)}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        transaction.status === 'captured'
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
                          transaction.status === 'captured' ? colors.success : colors.primary,
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

        {transactions.length > 0 && (
          <TouchableOpacity
            style={[styles.exportButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.7}
            onPress={handleExport}
          >
            <Download size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.exportButtonText, { color: colors.primary }]}>
              Export Statement
            </Text>
            <ChevronRight size={20} color={colors.primary} strokeWidth={2.5} />
          </TouchableOpacity>
        )}
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
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
});
