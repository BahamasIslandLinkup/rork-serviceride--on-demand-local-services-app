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
import { Stack, useRouter } from 'expo-router';
import { CreditCard, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvider } from '@/contexts/ProviderContext';
import type { BankAccount } from '@/types';

export default function BankScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { connectBank } = useProvider();

  const [accountHolderName, setAccountHolderName] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>('checking');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (!accountHolderName || !bankName || !accountNumber || !routingNumber) {
      Alert.alert('Incomplete', 'Please fill in all fields');
      return;
    }

    setSaving(true);
    try {
      const bankAccount: BankAccount = {
        id: `bank_${Date.now()}`,
        accountHolderName,
        accountType,
        bankName,
        last4: accountNumber.slice(-4),
        isLinked: true,
        linkedAt: new Date().toISOString(),
      };

      const result = await connectBank(bankAccount);
      if (result.success) {
        router.push('/onboarding/complete' as any);
      } else {
        Alert.alert('Error', result.error || 'Failed to link bank account');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Bank Account',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <CreditCard size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Link Your Bank Account</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Securely connect your account to receive payouts
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Account Holder Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="John Doe"
              placeholderTextColor={colors.textLight}
              value={accountHolderName}
              onChangeText={setAccountHolderName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bank Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., Bank of America"
              placeholderTextColor={colors.textLight}
              value={bankName}
              onChangeText={setBankName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Account Type</Text>
            <View style={styles.accountTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  {
                    backgroundColor: accountType === 'checking' ? colors.primary : colors.card,
                    borderColor: accountType === 'checking' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAccountType('checking')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    { color: accountType === 'checking' ? '#1E1E1E' : colors.text },
                  ]}
                >
                  Checking
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.accountTypeButton,
                  {
                    backgroundColor: accountType === 'savings' ? colors.primary : colors.card,
                    borderColor: accountType === 'savings' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setAccountType('savings')}
              >
                <Text
                  style={[
                    styles.accountTypeText,
                    { color: accountType === 'savings' ? '#1E1E1E' : colors.text },
                  ]}
                >
                  Savings
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Account Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="••••••••••"
              placeholderTextColor={colors.textLight}
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Routing Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="9 digits"
              placeholderTextColor={colors.textLight}
              value={routingNumber}
              onChangeText={setRoutingNumber}
              keyboardType="number-pad"
              maxLength={9}
            />
          </View>
        </View>

        <View style={[styles.securityCard, { backgroundColor: `${colors.success}10` }]}>
          <Text style={[styles.securityTitle, { color: colors.text }]}>🔒 Bank-level Security</Text>
          <Text style={[styles.securityText, { color: colors.textSecondary }]}>
            Your banking information is encrypted and securely stored. We never store your full account details.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.continueButton, { opacity: accountHolderName && bankName && accountNumber && routingNumber && !saving ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={!accountHolderName || !bankName || !accountNumber || !routingNumber || saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Link Account</Text>
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
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  form: {
    gap: 20,
    marginBottom: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  accountTypeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  accountTypeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  accountTypeText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  securityCard: {
    padding: 20,
    borderRadius: 16,
    gap: 8,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  securityText: {
    fontSize: 14,
    fontWeight: '500' as const,
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
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
