import type { PaymentMethod, Transaction } from '@/types';

export interface AddPaymentMethodRequest {
  type: 'card' | 'apple_pay' | 'google_pay';
  token: string;
  last4?: string;
  brand?: string;
  isDefault?: boolean;
}

export interface AuthorizePaymentRequest {
  bookingId: string;
  amount: number;
  paymentMethodId: string;
  tip?: number;
}

export interface CapturePaymentRequest {
  transactionId: string;
}

export interface RefundPaymentRequest {
  transactionId: string;
  amount?: number;
  reason?: string;
}

export interface GetReceiptRequest {
  transactionId: string;
}

export interface Receipt {
  id: string;
  transactionId: string;
  bookingId: string;
  amount: number;
  subtotal: number;
  tax: number;
  tip: number;
  platformFee: number;
  discount: number;
  date: string;
  paymentMethod: string;
  providerName: string;
  serviceName: string;
}

export async function listPaymentMethods(): Promise<PaymentMethod[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'pm_1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true,
    },
    {
      id: 'pm_2',
      type: 'card',
      last4: '5555',
      brand: 'Mastercard',
      isDefault: false,
    },
  ];
}

export async function addPaymentMethod(request: AddPaymentMethodRequest): Promise<{ success: boolean; method?: PaymentMethod; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const newMethod: PaymentMethod = {
    id: 'pm_' + Date.now(),
    type: request.type,
    last4: request.last4,
    brand: request.brand,
    isDefault: request.isDefault || false,
  };
  
  return { success: true, method: newMethod };
}

export async function removePaymentMethod(methodId: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function setDefaultPaymentMethod(methodId: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return { success: true };
}

export async function authorizePayment(request: AuthorizePaymentRequest): Promise<{ success: boolean; transaction?: Transaction; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const transaction: Transaction = {
    id: 'txn_' + Date.now(),
    bookingId: request.bookingId,
    amount: request.amount,
    commission: request.amount * 0.15,
    platformFee: 2.5,
    tip: request.tip || 0,
    tax: request.amount * 0.08,
    status: 'authorized',
    createdAt: new Date().toISOString(),
  };
  
  return { success: true, transaction };
}

export async function capturePayment(request: CapturePaymentRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return { success: true };
}

export async function refundPayment(request: RefundPaymentRequest): Promise<{ success: boolean; refundAmount?: number; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, refundAmount: request.amount };
}

export async function getReceipt(request: GetReceiptRequest): Promise<Receipt | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockReceipt: Receipt = {
    id: 'receipt_' + Date.now(),
    transactionId: request.transactionId,
    bookingId: 'booking_1',
    amount: 183.6,
    subtotal: 170,
    tax: 13.6,
    tip: 0,
    platformFee: 2.5,
    discount: 0,
    date: new Date().toISOString(),
    paymentMethod: 'Visa •••• 4242',
    providerName: 'Mike Johnson',
    serviceName: 'Brake Inspection & Repair',
  };
  
  return mockReceipt;
}
