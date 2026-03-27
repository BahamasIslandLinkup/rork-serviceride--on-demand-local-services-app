import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  Shield, 
  User, 
  UserCog, 
  CheckCircle, 
  AlertCircle,
  Database,
  ArrowLeft
} from 'lucide-react-native';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/config/firebase';

const COLORS = {
  background: '#0A0F1C',
  card: '#1A1F2E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2F3E',
  success: '#4CAF50',
  error: '#FF4444',
};

const TEST_ACCOUNTS = {
  admin: {
    email: 'admin@servicerideondemand.com',
    password: 'Admin123!',
    name: 'Super Admin',
    role: 'super_admin',
  },
  customer: {
    email: 'test.customer@example.com',
    password: 'Test123!',
    name: 'Test Customer',
  },
  provider: {
    email: 'test.provider@example.com',
    password: 'Test123!',
    name: 'Test Provider',
  },
};

export default function FirebaseSetupScreen() {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, { success: boolean; message: string }>>({});

  const createAdminUser = async () => {
    setIsLoading('admin');
    try {
      const { email, password, name, role } = TEST_ACCOUNTS.admin;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await setDoc(doc(db, 'admins', userCredential.user.uid), {
        email,
        name,
        role,
        status: 'active',
        mfaEnabled: false,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });

      setResults(prev => ({
        ...prev,
        admin: { success: true, message: `Admin created: ${email}` }
      }));
      Alert.alert('Success', `Admin account created:\n${email}\nPassword: ${password}`);
    } catch (error: any) {
      const message = error.code === 'auth/email-already-in-use' 
        ? 'Admin already exists'
        : error.message;
      setResults(prev => ({
        ...prev,
        admin: { success: false, message }
      }));
    } finally {
      setIsLoading(null);
    }
  };

  const createCustomerUser = async () => {
    setIsLoading('customer');
    try {
      const { email, password, name } = TEST_ACCOUNTS.customer;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const timestamp = new Date().toISOString();
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        name,
        phone: '+1234567890',
        role: 'customer',
        verified: true,
        createdAt: timestamp,
      });

      setResults(prev => ({
        ...prev,
        customer: { success: true, message: `Customer created: ${email}` }
      }));
      Alert.alert('Success', `Customer account created:\n${email}\nPassword: ${password}`);
    } catch (error: any) {
      const message = error.code === 'auth/email-already-in-use' 
        ? 'Customer already exists'
        : error.message;
      setResults(prev => ({
        ...prev,
        customer: { success: false, message }
      }));
    } finally {
      setIsLoading(null);
    }
  };

  const createProviderUser = async () => {
    setIsLoading('provider');
    try {
      const { email, password, name } = TEST_ACCOUNTS.provider;
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const timestamp = new Date().toISOString();
      
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email,
        name,
        phone: '+1234567891',
        role: 'provider',
        verified: true,
        kycStatus: 'pending',
        createdAt: timestamp,
      });

      await setDoc(doc(db, 'providerProfiles', userCredential.user.uid), {
        id: userCredential.user.uid,
        userId: userCredential.user.uid,
        kycStatus: 'pending',
        services: [],
        availability: { slots: [], timezone: 'UTC' },
        coverageKm: 10,
        isOnline: false,
        isBusy: false,
        metrics: {
          totalJobs: 0,
          completedJobs: 0,
          cancelledJobs: 0,
          averageRating: 0,
          totalReviews: 0,
          responseTimeMinutes: 0,
          completionRate: 0,
          onTimeRate: 0,
        },
        createdAt: timestamp,
        updatedAt: timestamp,
      });

      setResults(prev => ({
        ...prev,
        provider: { success: true, message: `Provider created: ${email}` }
      }));
      Alert.alert('Success', `Provider account created:\n${email}\nPassword: ${password}`);
    } catch (error: any) {
      const message = error.code === 'auth/email-already-in-use' 
        ? 'Provider already exists'
        : error.message;
      setResults(prev => ({
        ...prev,
        provider: { success: false, message }
      }));
    } finally {
      setIsLoading(null);
    }
  };

  const SetupCard = ({ 
    title, 
    description, 
    icon: Icon, 
    type,
    onPress 
  }: { 
    title: string; 
    description: string; 
    icon: any; 
    type: string;
    onPress: () => void;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.iconContainer}>
          <Icon size={24} color={COLORS.primary} />
        </View>
        <View style={styles.cardTitleContainer}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
      </View>
      
      {results[type] && (
        <View style={[
          styles.resultBanner,
          { backgroundColor: results[type].success ? `${COLORS.success}15` : `${COLORS.error}15` }
        ]}>
          {results[type].success ? (
            <CheckCircle size={16} color={COLORS.success} />
          ) : (
            <AlertCircle size={16} color={COLORS.error} />
          )}
          <Text style={[
            styles.resultText,
            { color: results[type].success ? COLORS.success : COLORS.error }
          ]}>
            {results[type].message}
          </Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, isLoading === type && styles.buttonDisabled]}
        onPress={onPress}
        disabled={isLoading !== null}
      >
        {isLoading === type ? (
          <ActivityIndicator color={COLORS.background} />
        ) : (
          <Text style={styles.buttonText}>Create Account</Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Database size={32} color={COLORS.primary} />
        </View>
        <Text style={styles.headerTitle}>Firebase Setup</Text>
        <Text style={styles.headerSubtitle}>Create test accounts for development</Text>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SetupCard
          title="Admin Account"
          description="admin@servicerideondemand.com / Admin123!"
          icon={Shield}
          type="admin"
          onPress={createAdminUser}
        />

        <SetupCard
          title="Test Customer"
          description="test.customer@example.com / Test123!"
          icon={User}
          type="customer"
          onPress={createCustomerUser}
        />

        <SetupCard
          title="Test Provider"
          description="test.provider@example.com / Test123!"
          icon={UserCog}
          type="provider"
          onPress={createProviderUser}
        />

        <View style={styles.infoCard}>
          <AlertCircle size={20} color={COLORS.primary} />
          <Text style={styles.infoText}>
            These accounts are for development testing only. 
            Use the Sign Up flow to create real accounts.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 20,
    top: 24,
    padding: 8,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  resultBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  resultText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  button: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${COLORS.primary}10`,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
});
