import type { Transaction, Payout } from '@/types';

export interface EarningsSummary {
  gross: number;
  commission: number;
  platformFees: number;
  tips: number;
  net: number;
  pendingPayouts: number;
  completedPayouts: number;
}

export interface GetEarningsSummaryRequest {
  startDate: string;
  endDate: string;
}

export interface ListTransactionsRequest {
  startDate?: string;
  endDate?: string;
  status?: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';
  page?: number;
  limit?: number;
}

export interface SchedulePayoutsRequest {
  cadence: 'daily' | 'weekly' | 'monthly';
}

export async function getEarningsSummary(request: GetEarningsSummaryRequest): Promise<EarningsSummary> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return {
    gross: 28900,
    commission: 4335,
    platformFees: 850,
    tips: 1240,
    net: 24955,
    pendingPayouts: 2450,
    completedPayouts: 22505,
  };
}

export async function listTransactions(request: ListTransactionsRequest): Promise<Transaction[]> {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const mockTransactions: Transaction[] = [
    {
      id: 'txn_1',
      bookingId: 'booking_1',
      amount: 183.6,
      commission: 25.5,
      platformFee: 2.5,
      tip: 15,
      tax: 13.6,
      status: 'captured',
      createdAt: '2025-10-10T10:00:00Z',
    },
    {
      id: 'txn_2',
      bookingId: 'booking_2',
      amount: 194.4,
      commission: 27,
      platformFee: 2.5,
      tip: 0,
      tax: 14.4,
      status: 'captured',
      createdAt: '2025-10-09T14:00:00Z',
    },
    {
      id: 'txn_3',
      bookingId: 'booking_3',
      amount: 75.6,
      commission: 9.75,
      platformFee: 2.5,
      tip: 10,
      tax: 5.4,
      status: 'authorized',
      createdAt: '2025-10-08T09:00:00Z',
    },
  ];
  
  if (request.status) {
    return mockTransactions.filter(t => t.status === request.status);
  }
  
  return mockTransactions;
}

export async function listPayouts(): Promise<Payout[]> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return [
    {
      id: 'payout_1',
      providerId: 'provider_1',
      amount: 2450.50,
      status: 'pending',
      scheduledDate: '2025-10-15',
    },
    {
      id: 'payout_2',
      providerId: 'provider_1',
      amount: 3200.75,
      status: 'completed',
      scheduledDate: '2025-10-08',
      completedDate: '2025-10-08',
    },
  ];
}

export async function schedulePayouts(request: SchedulePayoutsRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function exportTransactions(request: ListTransactionsRequest): Promise<{ success: boolean; csvUrl?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, csvUrl: 'https://example.com/transactions.csv' };
}
