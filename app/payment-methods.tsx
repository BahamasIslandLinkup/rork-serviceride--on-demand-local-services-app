import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { CreditCard, Plus, Trash2, CheckCircle, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { usePayment } from '@/contexts/PaymentContext';
import type { PaymentMethod } from '@/types';

export default function PaymentMethodsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { paymentMethods, addPaymentMethod, removePaymentMethod, setDefaultPaymentMethod } =
    usePayment();

  const [loading, setLoading] = useState<string | null>(null);

  const handleAddCard = () => {
    Alert.prompt(
      'Add Card',
      'Enter last 4 digits',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async last4 => {
            if (last4 && last4.length === 4) {
              setLoading('add');
              try {
                const result = await addPaymentMethod({
                  type: 'card',
                  last4,
                  brand: 'Visa',
                  isDefault: paymentMethods.length === 0,
                });

                if (result.success) {
                  Alert.alert('Success', 'Card added successfully');
                } else {
                  Alert.alert('Error', result.error || 'Failed to add card');
                }
              } finally {
                setLoading(null);
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleRemoveCard = (methodId: string) => {
    Alert.alert('Remove Card', 'Are you sure you want to remove this card?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setLoading(methodId);
          try {
            const result = await removePaymentMethod(methodId);
            if (result.success) {
              Alert.alert('Success', 'Card removed successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove card');
            }
          } finally {
            setLoading(null);
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (methodId: string) => {
    setLoading(methodId);
    try {
      const result = await setDefaultPaymentMethod(methodId);
      if (!result.success) {
        Alert.alert('Error', result.error || 'Failed to set default');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Payment Methods',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {paymentMethods.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <CreditCard size={48} color={colors.primary} strokeWidth={2} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Payment Methods</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Add a payment method to start booking services
            </Text>
          </View>
        ) : (
          <View style={styles.cardsContainer}>
            {paymentMethods.map(method => (
              <View
                key={method.id}
                style={[
                  styles.cardItem,
                  {
                    backgroundColor: colors.card,
                    borderColor: method.isDefault ? colors.primary : colors.border,
                    borderWidth: method.isDefault ? 2 : 1,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.cardInfo}>
                    <CreditCard size={32} color={colors.text} strokeWidth={2} />
                    <View style={styles.cardDetails}>
                      <Text style={[styles.cardBrand, { color: colors.text }]}>
                        {method.brand || method.type}
                      </Text>
                      {method.last4 && (
                        <Text style={[styles.cardNumber, { color: colors.textSecondary }]}>
                          •••• •••• •••• {method.last4}
                        </Text>
                      )}
                    </View>
                  </View>

                  {method.isDefault && (
                    <View style={[styles.defaultBadge, { backgroundColor: `${colors.primary}15` }]}>
                      <Star size={14} color={colors.primary} fill={colors.primary} />
                      <Text style={[styles.defaultText, { color: colors.primary }]}>Default</Text>
                    </View>
                  )}
                </View>

                <View style={styles.cardActions}>
                  {!method.isDefault && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: `${colors.primary}10` }]}
                      onPress={() => handleSetDefault(method.id)}
                      disabled={loading === method.id}
                    >
                      {loading === method.id ? (
                        <ActivityIndicator size="small" color={colors.primary} />
                      ) : (
                        <>
                          <CheckCircle size={18} color={colors.primary} strokeWidth={2.5} />
                          <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                            Set as Default
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: `${colors.error}10` }]}
                    onPress={() => handleRemoveCard(method.id)}
                    disabled={loading === method.id}
                  >
                    {loading === method.id ? (
                      <ActivityIndicator size="small" color={colors.error} />
                    ) : (
                      <>
                        <Trash2 size={18} color={colors.error} strokeWidth={2.5} />
                        <Text style={[styles.actionButtonText, { color: colors.error }]}>
                          Remove
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your payment information is encrypted and secure. We never store your full card details.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCard}
          disabled={loading === 'add'}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButtonGradient}
          >
            {loading === 'add' ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Plus size={24} color="#1E1E1E" strokeWidth={3} />
                <Text style={styles.addButtonText}>Add Payment Method</Text>
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
    padding: 20,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  cardsContainer: {
    gap: 16,
  },
  cardItem: {
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  cardDetails: {
    flex: 1,
  },
  cardBrand: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  cardNumber: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  defaultText: {
    fontSize: 13,
    fontWeight: '700' as const,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 20,
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
  addButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    minHeight: 56,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
