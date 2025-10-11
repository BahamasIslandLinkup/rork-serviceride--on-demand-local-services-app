import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Stack } from 'expo-router';
import {
  Briefcase,
  Calendar,
  Star,
  DollarSign,
  TrendingUp,
  CheckCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { mockBusinessStats, mockBookings } from '@/mocks/services';

export default function BusinessDashboardScreen() {
  const { colors } = useTheme();

  const upcomingBookings = mockBookings.filter(
    (b) => b.status === 'confirmed' || b.status === 'pending'
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Business Dashboard',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>
            Your Business Performance
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Track your success and manage appointments
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
              <Briefcase size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mockBusinessStats.totalJobs}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Jobs
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10b981' + '15' }]}>
              <Calendar size={24} color="#10b981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mockBusinessStats.activeBookings}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Active Bookings
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: '#fbbf24' + '15' }]}>
              <Star size={24} color="#fbbf24" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {mockBusinessStats.rating.toFixed(1)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Rating
            </Text>
          </View>

          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <View style={[styles.statIcon, { backgroundColor: '#10b981' + '15' }]}>
              <DollarSign size={24} color="#10b981" />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>
              ${mockBusinessStats.totalEarnings.toLocaleString()}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              Total Earnings
            </Text>
          </View>
        </View>

        <View style={[styles.performanceCard, { backgroundColor: colors.card }]}>
          <View style={styles.performanceHeader}>
            <TrendingUp size={24} color={colors.primary} />
            <Text style={[styles.performanceTitle, { color: colors.text }]}>
              Performance Metrics
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Completion Rate
            </Text>
            <View style={styles.metricValue}>
              <View style={[styles.progressBar, { backgroundColor: colors.background }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: colors.primary,
                      width: `${mockBusinessStats.completionRate}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.metricText, { color: colors.text }]}>
                {mockBusinessStats.completionRate}%
              </Text>
            </View>
          </View>

          <View style={styles.metricRow}>
            <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
              Average Rating
            </Text>
            <View style={styles.ratingContainer}>
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  color={i < Math.floor(mockBusinessStats.rating) ? '#fbbf24' : colors.border}
                  fill={i < Math.floor(mockBusinessStats.rating) ? '#fbbf24' : 'transparent'}
                />
              ))}
              <Text style={[styles.ratingText, { color: colors.text }]}>
                {mockBusinessStats.rating.toFixed(1)}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Upcoming Appointments
          </Text>
          
          {upcomingBookings.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Calendar size={48} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming appointments
              </Text>
            </View>
          ) : (
            upcomingBookings.map((booking) => (
              <View
                key={booking.id}
                style={[styles.bookingCard, { backgroundColor: colors.card }]}
              >
                <View style={styles.bookingHeader}>
                  <View>
                    <Text style={[styles.bookingService, { color: colors.text }]}>
                      {booking.service}
                    </Text>
                    <Text style={[styles.bookingCategory, { color: colors.textSecondary }]}>
                      {booking.category}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          booking.status === 'confirmed'
                            ? '#10b981' + '15'
                            : colors.primary + '15',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        {
                          color: booking.status === 'confirmed' ? '#10b981' : colors.primary,
                        },
                      ]}
                    >
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </Text>
                  </View>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.bookingDetail}>
                    <Calendar size={16} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>
                      {new Date(booking.date).toLocaleDateString()} at {booking.time}
                    </Text>
                  </View>
                  <View style={styles.bookingDetail}>
                    <DollarSign size={16} color={colors.textSecondary} />
                    <Text style={[styles.bookingDetailText, { color: colors.textSecondary }]}>
                      ${booking.price}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: colors.primary }]}
                  activeOpacity={0.8}
                >
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.completeButtonText}>Mark as Complete</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
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
    paddingBottom: 24,
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 12,
  },
  statCard: {
    width: '48%',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    textAlign: 'center' as const,
  },
  performanceCard: {
    marginHorizontal: 20,
    marginBottom: 24,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  metricRow: {
    marginBottom: 16,
  },
  metricLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  metricValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricText: {
    fontSize: 14,
    fontWeight: '600' as const,
    minWidth: 40,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginLeft: 8,
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 16,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 15,
    marginTop: 12,
  },
  bookingCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingService: {
    fontSize: 17,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  bookingCategory: {
    fontSize: 14,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  bookingDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bookingDetailText: {
    fontSize: 14,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
});
