import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { EarningsSummary, TransactionDetail } from '@/types';
import {
  getEarningsSummary,
  exportTransactionsToCSV,
} from '@/services/firestore/earnings';
import { subscribeToProviderTransactions } from '@/services/firestore/transactions';
import { Platform, Alert } from 'react-native';

export function useEarnings() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all_time'>('monthly');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      setIsLoading(false);
      return;
    }

    loadSummary();
  }, [user, period]);

  useEffect(() => {
    if (!user || user.role !== 'provider') {
      return;
    }

    console.log('[useEarnings] Setting up transactions subscription');
    const unsubscribe = subscribeToProviderTransactions(user.id, (updatedTransactions) => {
      console.log('[useEarnings] Received', updatedTransactions.length, 'transactions');
      setTransactions(updatedTransactions);
      setError(null);
    });

    return () => {
      console.log('[useEarnings] Cleaning up transactions subscription');
      unsubscribe();
    };
  }, [user]);

  const loadSummary = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('[useEarnings] Loading summary for period:', period);
      const summaryData = await getEarningsSummary(user.id, period);
      setSummary(summaryData);
      setError(null);
    } catch (err: any) {
      console.error('[useEarnings] Failed to load summary:', err);
      setError(err.message || 'Failed to load earnings data');
    } finally {
      setIsLoading(false);
    }
  }, [user, period]);

  const changePeriod = useCallback((newPeriod: typeof period) => {
    setPeriod(newPeriod);
  }, []);

  const exportCSV = useCallback(async () => {
    if (!user || transactions.length === 0) {
      return { success: false, error: 'No transactions to export' };
    }

    try {
      console.log('[useEarnings] Exporting transactions to CSV');
      const csv = exportTransactionsToCSV(transactions);

      if (Platform.OS === 'web') {
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `earnings_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return { success: true };
      } else {
        Alert.alert('Export CSV', 'CSV export is available on web. Please use the web version to export your earnings.');
        return { success: false, error: 'Not supported on mobile yet' };
      }
    } catch (error: any) {
      console.error('[useEarnings] Failed to export CSV:', error);
      return { success: false, error: error.message || 'Failed to export CSV' };
    }
  }, [user, transactions]);

  const refresh = useCallback(() => {
    loadSummary();
  }, [period, user]);

  return {
    summary,
    transactions,
    isLoading,
    error,
    period,
    changePeriod,
    exportCSV,
    refresh,
  };
}
