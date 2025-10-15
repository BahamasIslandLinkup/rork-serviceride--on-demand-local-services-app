import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAdmin } from '@/contexts/AdminContext';

const COLORS = {
  background: '#0A0F1C',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
};

export default function AdminBookingsScreen() {
  const { isAuthenticated } = useAdmin();

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
    }
  }, [isAuthenticated]);

  return (
    <>
      <Stack.Screen options={{ title: 'Bookings' }} />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <Text style={styles.text}>Booking Management</Text>
            <Text style={styles.subtext}>Timeline, tracking, price adjustments</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24 },
  text: { fontSize: 18, color: COLORS.text, fontWeight: '700' as const },
  subtext: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
});
