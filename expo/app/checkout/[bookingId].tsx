import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  CreditCard,
  Tag,
  CheckCircle,
  Plus,
  ChevronRight,
  DollarSign,
  Receipt,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { usePayment } from '@/contexts/PaymentContext';
import type { PaymentMethod, PromoCode } from '@/types';

export default function CheckoutScreen() {
  const { bookingId } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { paymentMethods, authorizePayment, applyPromoCode, validatePromoCode } = usePayment();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(
    paymentMethods.find(pm => pm.isDefault) || paymentMethods[0] || null
  );
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<PromoCode | null>(null);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState('');
  const [processing, setProcessing] = useState(false);

  const subtotal = 170.0;
  const serviceFee = 2.5;
  const tax = (subtotal + serviceFee) * 0.08;
  const discount = appliedPromo
    ? appliedPromo.discountType === 'percentage'
      ? Math.min(
          (subtotal * appliedPromo.discountValue) / 100,
          appliedPromo.maxDiscount || Infinity
        )
      : appliedPromo.discountValue
    : 0;
  const total = subtotal + serviceFee + tax - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoError('Please enter a promo code');
      return;
    }

    setPromoLoading(true);
    setPromoError('');

    try {
      const result = await validatePromoCode(promoCode.trim().toUpperCase());
      if (result.valid && result.promo) {
        if (result.promo.minAmount && subtotal < result.promo.minAmount) {
          setPromoError(`Minimum order amount is $${result.promo.minAmount.toFixed(2)}`);
          setPromoLoading(false);
          return;
        }

        setAppliedPromo(result.promo);
        applyPromoCode(result.promo);
        Alert.alert('Success', 'Promo code applied successfully!');
      } else {
        setPromoError(result.error || 'Invalid promo code');
      }
    } catch {
      setPromoError('Failed to apply promo code');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCode('');
    setPromoError('');
  };

  const handleCheckout = async () => {
    if (!selectedPaymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    setProcessing(true);

    try {
      const result = await authorizePayment({
        bookingId: bookingId as string,
        amount: total,
        paymentMethodId: selectedPaymentMethod.id,
        promoCodeId: appliedPromo?.id,
      });

      if (result.success) {
        Alert.alert(
          'Payment Authorized',
          'Your booking has been confirmed! Payment will be captured upon service completion.',
          [
            {
              text: 'View Booking',
              onPress: () => router.replace(`/booking-detail/${bookingId}`),
            },
          ]
        );
      } else {
        Alert.alert('Payment Failed', result.error || 'Please try again');
      }
    } catch {
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Checkout',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <CreditCard size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Payment Method</Text>
          </View>

          {paymentMethods.length === 0 ? (
            <TouchableOpacity
              style={[styles.addPaymentButton, { borderColor: colors.border }]}
              onPress={() => router.push('/payment-methods' as any)}
            >
              <Plus size={20} color={colors.primary} />
              <Text style={[styles.addPaymentText, { color: colors.primary }]}>
                Add Payment Method
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {paymentMethods.map(method => (
                <TouchableOpacity
                  key={method.id}
                  style={[
                    styles.paymentMethodCard,
                    {
                      backgroundColor: colors.background,
                      borderColor:
                        selectedPaymentMethod?.id === method.id ? colors.primary : colors.border,
                      borderWidth: selectedPaymentMethod?.id === method.id ? 2 : 1,
                    },
                  ]}
                  onPress={() => setSelectedPaymentMethod(method)}
                  activeOpacity={0.7}
                >
                  <View style={styles.paymentMethodInfo}>
                    <CreditCard size={24} color={colors.text} />
                    <View style={styles.paymentMethodDetails}>
                      <Text style={[styles.paymentMethodBrand, { color: colors.text }]}>
                        {method.brand || method.type}
                      </Text>
                      {method.last4 && (
                        <Text style={[styles.paymentMethodLast4, { color: colors.textSecondary }]}>
                          •••• {method.last4}
                        </Text>
                      )}
                    </View>
                  </View>
                  {selectedPaymentMethod?.id === method.id && (
                    <CheckCircle size={24} color={colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.addMoreButton, { borderColor: colors.border }]}
                onPress={() => router.push('/payment-methods' as any)}
              >
                <Plus size={18} color={colors.textSecondary} />
                <Text style={[styles.addMoreText, { color: colors.textSecondary }]}>
                  Add Another Method
                </Text>
                <ChevronRight size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Tag size={24} color={colors.secondary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Promo Code</Text>
          </View>

          {appliedPromo ? (
            <View style={[styles.appliedPromoCard, { backgroundColor: `${colors.success}15` }]}>
              <View style={styles.appliedPromoInfo}>
                <CheckCircle size={20} color={colors.success} strokeWidth={2.5} />
                <View style={styles.appliedPromoDetails}>
                  <Text style={[styles.appliedPromoCode, { color: colors.success }]}>
                    {appliedPromo.code}
                  </Text>
                  <Text style={[styles.appliedPromoDiscount, { color: colors.textSecondary }]}>
                    {appliedPromo.discountType === 'percentage'
                      ? `${appliedPromo.discountValue}% off`
                      : `$${appliedPromo.discountValue.toFixed(2)} off`}
                  </Text>
                </View>
              </View>
              <TouchableOpacity onPress={handleRemovePromo}>
                <Text style={[styles.removePromoText, { color: colors.error }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.promoInputContainer}>
              <View
                style={[
                  styles.promoInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: promoError ? colors.error : colors.border,
                  },
                ]}
              >
                <TextInput
                  style={[styles.promoTextInput, { color: colors.text }]}
                  placeholder="Enter promo code"
                  placeholderTextColor={colors.textLight}
                  value={promoCode}
                  onChangeText={text => {
                    setPromoCode(text.toUpperCase());
                    setPromoError('');
                  }}
                  autoCapitalize="characters"
                  editable={!promoLoading}
                />
              </View>
              <TouchableOpacity
                style={[
                  styles.applyPromoButton,
                  { backgroundColor: colors.primary, opacity: promoLoading ? 0.6 : 1 },
                ]}
                onPress={handleApplyPromo}
                disabled={promoLoading}
              >
                {promoLoading ? (
                  <ActivityIndicator color="#1E1E1E" size="small" />
                ) : (
                  <Text style={styles.applyPromoText}>Apply</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
          {promoError ? (
            <Text style={[styles.promoErrorText, { color: colors.error }]}>{promoError}</Text>
          ) : null}
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Receipt size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Order Summary</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Subtotal</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${subtotal.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
              Service Fee
            </Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${serviceFee.toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tax (8%)</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>${tax.toFixed(2)}</Text>
          </View>

          {discount > 0 && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: colors.success }]}>Discount</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>
                -${discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${total.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.noteCard, { backgroundColor: `${colors.primary}10` }]}>
            <DollarSign size={16} color={colors.primary} />
            <Text style={[styles.noteText, { color: colors.textSecondary }]}>
              Payment will be authorized now and captured after service completion
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.checkoutButton,
            { opacity: !selectedPaymentMethod || processing ? 0.5 : 1 },
          ]}
          onPress={handleCheckout}
          disabled={!selectedPaymentMethod || processing}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.checkoutButtonGradient}
          >
            {processing ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.checkoutButtonText}>Confirm & Pay ${total.toFixed(2)}</Text>
                <ChevronRight size={20} color="#1E1E1E" strokeWidth={3} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 120,
  },
  section: {
    margin: 16,
    padding: 20,
    borderRadius: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  addPaymentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPaymentText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  paymentMethodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  paymentMethodDetails: {
    flex: 1,
  },
  paymentMethodBrand: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  paymentMethodLast4: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  addMoreText: {
    fontSize: 14,
    fontWeight: '600' as const,
    flex: 1,
  },
  appliedPromoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
  },
  appliedPromoInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  appliedPromoDetails: {
    flex: 1,
  },
  appliedPromoCode: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  appliedPromoDiscount: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  removePromoText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  promoInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  promoInput: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
    justifyContent: 'center',
  },
  promoTextInput: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  applyPromoButton: {
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  applyPromoText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  promoErrorText: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 28,
    fontWeight: '700' as const,
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 13,
    fontWeight: '500' as const,
    flex: 1,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  checkoutButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
  },
  checkoutButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
