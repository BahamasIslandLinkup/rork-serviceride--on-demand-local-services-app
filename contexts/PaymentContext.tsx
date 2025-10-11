import createContextHook from '@nkzw/create-context-hook';
import { useState, useCallback, useMemo } from 'react';
import type { PaymentMethod, Transaction, PromoCode } from '@/types';

const PLATFORM_COMMISSION_RATE = 0.15;
const PLATFORM_FEE = 2.5;
const TAX_RATE = 0.08;

export const [PaymentProvider, usePayment] = createContextHook(() => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'pm_1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      isDefault: true,
    },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);

  const calculateBookingCost = useCallback(
    (baseAmount: number, tip: number = 0) => {
      const subtotal = baseAmount;
      let discount = 0;

      if (appliedPromo) {
        if (appliedPromo.discountType === 'percentage') {
          discount = (subtotal * appliedPromo.discountValue) / 100;
          if (appliedPromo.maxDiscount) {
            discount = Math.min(discount, appliedPromo.maxDiscount);
          }
        } else {
          discount = appliedPromo.discountValue;
        }
      }

      const discountedAmount = subtotal - discount;
      const tax = discountedAmount * TAX_RATE;
      const commission = discountedAmount * PLATFORM_COMMISSION_RATE;
      const platformFee = PLATFORM_FEE;
      const total = discountedAmount + tax + platformFee + tip;

      return {
        subtotal,
        discount,
        tax,
        commission,
        platformFee,
        tip,
        total,
        providerEarnings: discountedAmount - commission + tip,
      };
    },
    [appliedPromo]
  );

  const authorizePayment = useCallback(
    async (params: { bookingId: string; amount: number; paymentMethodId: string; promoCodeId?: string; tip?: number }) => {
      try {
        const costs = calculateBookingCost(params.amount, params.tip || 0);

        const transaction: Transaction = {
          id: 'txn_' + Date.now(),
          bookingId: params.bookingId,
          amount: costs.total,
          commission: costs.commission,
          platformFee: costs.platformFee,
          tip: costs.tip,
          tax: costs.tax,
          status: 'authorized',
          createdAt: new Date().toISOString(),
        };

        setTransactions((prev) => [...prev, transaction]);

        return { success: true, transaction };
      } catch (error) {
        console.error('Payment authorization failed:', error);
        return { success: false, error: 'Authorization failed' };
      }
    },
    [calculateBookingCost]
  );

  const capturePayment = useCallback(async (transactionId: string) => {
    try {
      setTransactions((prev) =>
        prev.map((t) =>
          t.id === transactionId ? { ...t, status: 'captured' as const } : t
        )
      );

      return { success: true };
    } catch (error) {
      console.error('Payment capture failed:', error);
      return { success: false, error: 'Capture failed' };
    }
  }, []);

  const refundPayment = useCallback(
    async (transactionId: string, amount?: number) => {
      try {
        const transaction = transactions.find((t) => t.id === transactionId);
        if (!transaction) {
          return { success: false, error: 'Transaction not found' };
        }

        const refundAmount = amount || transaction.amount;

        setTransactions((prev) =>
          prev.map((t) =>
            t.id === transactionId
              ? { ...t, status: 'refunded' as const, amount: refundAmount }
              : t
          )
        );

        return { success: true, refundAmount };
      } catch (error) {
        console.error('Refund failed:', error);
        return { success: false, error: 'Refund failed' };
      }
    },
    [transactions]
  );

  const addPaymentMethod = useCallback(
    async (method: Omit<PaymentMethod, 'id'>) => {
      try {
        const newMethod: PaymentMethod = {
          ...method,
          id: 'pm_' + Date.now(),
        };

        if (newMethod.isDefault) {
          setPaymentMethods((prev) =>
            prev.map((m) => ({ ...m, isDefault: false }))
          );
        }

        setPaymentMethods((prev) => [...prev, newMethod]);

        return { success: true, method: newMethod };
      } catch (error) {
        console.error('Add payment method failed:', error);
        return { success: false, error: 'Failed to add payment method' };
      }
    },
    []
  );

  const removePaymentMethod = useCallback(async (methodId: string) => {
    try {
      setPaymentMethods((prev) => prev.filter((m) => m.id !== methodId));
      return { success: true };
    } catch (error) {
      console.error('Remove payment method failed:', error);
      return { success: false, error: 'Failed to remove payment method' };
    }
  }, []);

  const setDefaultPaymentMethod = useCallback(async (methodId: string) => {
    try {
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === methodId }))
      );
      return { success: true };
    } catch (error) {
      console.error('Set default payment method failed:', error);
      return { success: false, error: 'Failed to set default' };
    }
  }, []);

  const validatePromoCode = useCallback(async (code: string) => {
    try {
      const mockPromoCodes: PromoCode[] = [
        {
          id: 'promo_1',
          code: 'WELCOME10',
          discountType: 'percentage',
          discountValue: 10,
          minAmount: 50,
          maxDiscount: 20,
          expiresAt: '2025-12-31',
          usageLimit: 100,
          usageCount: 45,
        },
        {
          id: 'promo_2',
          code: 'SAVE20',
          discountType: 'fixed',
          discountValue: 20,
          minAmount: 100,
          expiresAt: '2025-12-31',
          usageLimit: 50,
          usageCount: 12,
        },
      ];

      const promo = mockPromoCodes.find(
        (p) => p.code.toUpperCase() === code.toUpperCase()
      );

      if (!promo) {
        return { valid: false, error: 'Invalid promo code' };
      }

      if (new Date(promo.expiresAt) < new Date()) {
        return { valid: false, error: 'Promo code expired' };
      }

      if (promo.usageCount >= promo.usageLimit) {
        return { valid: false, error: 'Promo code usage limit reached' };
      }

      return { valid: true, promo };
    } catch (error) {
      console.error('Validate promo code failed:', error);
      return { valid: false, error: 'Failed to validate promo code' };
    }
  }, []);

  const applyPromoCode = useCallback((promo: PromoCode) => {
    setAppliedPromo(promo);
  }, []);

  const removePromoCode = useCallback(() => {
    setAppliedPromo(null);
  }, []);

  const defaultPaymentMethod = useMemo(
    () => paymentMethods.find((m) => m.isDefault) || paymentMethods[0],
    [paymentMethods]
  );

  return useMemo(
    () => ({
      paymentMethods,
      transactions,
      appliedPromo,
      defaultPaymentMethod,
      calculateBookingCost,
      authorizePayment,
      capturePayment,
      refundPayment,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      validatePromoCode,
      applyPromoCode,
      removePromoCode,
      PLATFORM_COMMISSION_RATE,
      PLATFORM_FEE,
      TAX_RATE,
    }),
    [
      paymentMethods,
      transactions,
      appliedPromo,
      defaultPaymentMethod,
      calculateBookingCost,
      authorizePayment,
      capturePayment,
      refundPayment,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      validatePromoCode,
      applyPromoCode,
      removePromoCode,
    ]
  );
});
