import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { TrendingUp, Calendar, DollarSign, Star, Clock, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvider } from '@/contexts/ProviderContext';
import { useBooking } from '@/contexts/BookingContext';

export default function ProviderDashboardScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { profile, canGoOnline, toggleOnline } = useProvider();
  const { bookings } = useBooking();

  const myBookings = bookings.filter(b => b.providerId === profile?.userId);
  const activeBookings = myBookings.filter(b => 
    ['accepted', 'in-progress'].includes(b.status)
  );
  const completedBookings = myBookings.filter(b => b.status === 'completed');

  const handleToggleOnline = async () => {
    const result = await toggleOnline();
    if (!result.success) {
      console.error('Failed to toggle online:', result.error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Provider Dashboard',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.statusCard, { backgroundColor: colors.card }]}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={[styles.statusLabel, { color: colors.textSecondary }]}>
                You&apos;re {profile?.isOnline ? 'Online' : 'Offline'}
              </Text>
              <Text style={[styles.statusTitle, { color: colors.text }]}>
                {profile?.isOnline ? 'Accepting Bookings' : 'Not Accepting Bookings'}
              </Text>
            </View>
            <Switch
              value={profile?.isOnline}
              onValueChange={handleToggleOnline}
              disabled={!canGoOnline}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={profile?.isOnline ? '#fff' : '#f4f3f4'}
            />
          </View>
          {!canGoOnline && (
            <View style={[styles.warningBox, { backgroundColor: `${colors.error}10` }]}>
              <Text style={[styles.warningText, { color: colors.error }]}>
                Complete onboarding to go online
              </Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.earningsCard}
          onPress={() => router.push('/provider/earnings' as any)}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.earningsGradient}
          >
            <View style={styles.earningsHeader}>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <DollarSign size={24} color="#1E1E1E" strokeWidth={2.5} />
            </View>
            <Text style={styles.earningsAmount}>$0.00</Text>
            <View style={styles.earningsTrend}>
              <TrendingUp size={16} color="#1E1E1E" strokeWidth={2.5} />
              <Text style={styles.earningsTrendText}>View Details</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Calendar size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {activeBookings.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Jobs
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Star size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {profile?.metrics?.averageRating?.toFixed(1) || '0.0'}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Rating
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Clock size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.statValue, { color: colors.text }]}>
              {completedBookings.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Completed
            </Text>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>

          <TouchableOpacity
            style={[styles.actionItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/provider/requests' as any)}
          >
            <Calendar size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.actionText, { color: colors.text }]}>View Requests</Text>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionItem, { borderBottomColor: colors.border }]}
            onPress={() => router.push('/provider/earnings' as any)}
          >
            <DollarSign size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.actionText, { color: colors.text }]}>Manage Earnings</Text>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionItem}
            onPress={() => router.push('/settings/edit-profile' as any)}
          >
            <Star size={20} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.actionText, { color: colors.text }]}>Edit Services</Text>
            <ChevronRight size={20} color={colors.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </ScrollView>
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
    paddingBottom: 40,
  },
  statusCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
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
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  warningBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  earningsCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  earningsGradient: {
    padding: 24,
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  earningsLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1E1E1E',
  },
  earningsAmount: {
    fontSize: 48,
    fontWeight: '800' as const,
    color: '#1E1E1E',
    marginBottom: 12,
  },
  earningsTrend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  earningsTrendText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1E1E1E',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
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
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  section: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
  },
});
