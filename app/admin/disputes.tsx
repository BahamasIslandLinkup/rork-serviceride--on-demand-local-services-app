import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/contexts/AdminContext';
import { getDisputes } from '@/services/firestore/admin';
import type { AdminDispute } from '@/types/admin';

const COLORS = {
  background: '#0A0F1C',
  card: '#1A1F2E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

export default function AdminDisputesScreen() {
  const { isAuthenticated } = useAdmin();
  const [disputes, setDisputes] = useState<AdminDispute[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadDisputes();
  }, [isAuthenticated]);

  const loadDisputes = async () => {
    try {
      const data = await getDisputes({ limitCount: 50 });
      setDisputes(data);
    } catch (error) {
      console.error('[Admin] Failed to load disputes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Disputes' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.text}>Disputes Management</Text>
            <Text style={styles.subtext}>Total: {disputes.length}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 24 },
  text: { fontSize: 18, color: COLORS.text, fontWeight: '700' as const },
  subtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
});
