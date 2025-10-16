
import type { EarningsSummary, TransactionDetail } from '@/types';
import { getProviderTransactions } from './transactions';

export async function getEarningsSummary(
  providerId: string,
  period: 'daily' | 'weekly' | 'monthly' | 'all_time' = 'all_time'
): Promise<EarningsSummary> {
  try {
    console.log('[Firestore] Getting earnings summary for provider:', providerId);

    const transactions = await getProviderTransactions(providerId);

    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'daily':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'weekly':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'all_time':
      default:
        startDate = new Date(0);
    }

    const filteredTransactions = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate;
    });

    const capturedTransactions = filteredTransactions.filter(t => t.status === 'captured');
    const pendingTransactions = filteredTransactions.filter(
      t => t.status === 'authorized' || t.status === 'pending'
    );

    const grossEarnings = capturedTransactions.reduce((sum, t) => sum + t.amount, 0);
    const commission = capturedTransactions.reduce((sum, t) => sum + t.commission, 0);
    const netEarnings = capturedTransactions.reduce((sum, t) => sum + t.netAmount, 0);
    const pendingPayouts = pendingTransactions.reduce((sum, t) => sum + t.netAmount, 0);

    const summary: EarningsSummary = {
      period,
      grossEarnings,
      commission,
      netEarnings,
      pendingPayouts,
      completedPayouts: netEarnings,
      totalTransactions: filteredTransactions.length,
    };

    console.log('[Firestore] Earnings summary calculated:', summary);
    return summary;
  } catch (error) {
    console.error('[Firestore] Error getting earnings summary:', error);
    throw error;
  }
}

export async function getTransactionsByPeriod(
  providerId: string,
  startDate: Date,
  endDate: Date
): Promise<TransactionDetail[]> {
  try {
    console.log('[Firestore] Getting transactions between', startDate, 'and', endDate);

    const transactions = await getProviderTransactions(providerId);

    const filtered = transactions.filter(t => {
      const transactionDate = new Date(t.createdAt);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    console.log('[Firestore] Found', filtered.length, 'transactions in period');
    return filtered;
  } catch (error) {
    console.error('[Firestore] Error getting transactions by period:', error);
    throw error;
  }
}

export function exportTransactionsToCSV(transactions: TransactionDetail[]): string {
  const headers = [
    'Transaction ID',
    'Booking ID',
    'Type',
    'Amount',
    'Commission',
    'Platform Fee',
    'Net Amount',
    'Status',
    'Date',
    'Captured Date',
  ];

  const rows = transactions.map(t => [
    t.id,
    t.bookingId || 'N/A',
    t.type,
    t.amount.toFixed(2),
    t.commission.toFixed(2),
    t.platformFee.toFixed(2),
    t.netAmount.toFixed(2),
    t.status,
    new Date(t.createdAt).toLocaleDateString(),
    t.capturedAt ? new Date(t.capturedAt).toLocaleDateString() : 'N/A',
  ]);

  const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');

  return csv;
}
