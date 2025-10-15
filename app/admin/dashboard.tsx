import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  LayoutDashboard,
  Users,
  Store,
  Calendar,
  DollarSign,
  MessageSquare,
  AlertTriangle,
  TrendingUp,
  Settings,
  LogOut,
} from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { getDashboardKPIs } from '@/services/firestore/admin';
import type { DashboardKPI } from '@/types/admin';

const COLORS = {
  background: '#0A0F1C',
  card: '#1A1F2E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2F3E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF4444',
};

export default function AdminDashboardScreen() {
  const { adminUser, isAuthenticated, logout } = useAdmin();
  const [kpis, setKpis] = useState<DashboardKPI | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadKPIs();
  }, [isAuthenticated]);

  const loadKPIs = async () => {
    try {
      const data = await getDashboardKPIs();
      setKpis(data);
    } catch (error) {
      console.error('[Admin] Failed to load KPIs:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadKPIs();
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/admin/login' as any);
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
      <Stack.Screen
        options={{
          title: 'Admin Dashboard',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
          headerRight: () => (
            <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
              <LogOut size={20} color={COLORS.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.name}>{adminUser?.name}</Text>
            <Text style={styles.role}>{adminUser?.role.replace('_', ' ').toUpperCase()}</Text>
          </View>

          {kpis && (
            <>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Metrics</Text>
                <View style={styles.kpiGrid}>
                  <View style={styles.kpiCard}>
                    <View style={styles.kpiIconContainer}>
                      <Calendar size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.kpiValue}>{kpis.totalBookings}</Text>
                    <Text style={styles.kpiLabel}>Total Bookings</Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={styles.kpiIconContainer}>
                      <TrendingUp size={24} color={COLORS.success} />
                    </View>
                    <Text style={styles.kpiValue}>{kpis.activeBookings}</Text>
                    <Text style={styles.kpiLabel}>Active</Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={styles.kpiIconContainer}>
                      <DollarSign size={24} color={COLORS.primary} />
                    </View>
                    <Text style={styles.kpiValue}>${kpis.totalRevenue.toFixed(0)}</Text>
                    <Text style={styles.kpiLabel}>Revenue</Text>
                  </View>

                  <View style={styles.kpiCard}>
                    <View style={styles.kpiIconContainer}>
                      <AlertTriangle size={24} color={COLORS.warning} />
                    </View>
                    <Text style={styles.kpiValue}>{kpis.openDisputes}</Text>
                    <Text style={styles.kpiLabel}>Open Disputes</Text>
                  </View>
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Quick Stats</Text>
                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Completion Rate</Text>
                    <Text style={styles.statValue}>{kpis.bookingCompletionRate.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Dispute Rate</Text>
                    <Text style={styles.statValue}>{kpis.disputeRate.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>SLA Compliance</Text>
                    <Text style={styles.statValue}>{kpis.slaCompliance.toFixed(1)}%</Text>
                  </View>
                  <View style={styles.statRow}>
                    <Text style={styles.statLabel}>Open Tickets</Text>
                    <Text style={styles.statValue}>{kpis.openTickets}</Text>
                  </View>
                </View>
              </View>
            </>
          )}

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/tickets' as any)}>
                <MessageSquare size={28} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Tickets</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/disputes' as any)}>
                <AlertTriangle size={28} color={COLORS.warning} />
                <Text style={styles.actionLabel}>Disputes</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/merchants' as any)}>
                <Store size={28} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Merchants</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/bookings' as any)}>
                <Calendar size={28} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/users' as any)}>
                <Users size={28} color={COLORS.primary} />
                <Text style={styles.actionLabel}>Users</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/admin/settings' as any)}>
                <Settings size={28} color={COLORS.textSecondary} />
                <Text style={styles.actionLabel}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    padding: 8,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  name: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginTop: 4,
  },
  role: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600' as const,
    marginTop: 4,
  },
  section: {
    padding: 24,
    paddingTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 16,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  kpiCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  kpiValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  kpiLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  statsContainer: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  statValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '700' as const,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    flex: 1,
    minWidth: 100,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '600' as const,
    marginTop: 12,
  },
});
