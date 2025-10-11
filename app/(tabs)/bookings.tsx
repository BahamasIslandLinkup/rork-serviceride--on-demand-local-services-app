import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Clock, MapPin, Calendar, Navigation } from 'lucide-react-native';
import { mockBookings } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import type { Booking } from '@/types';

export default function BookingsScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'active' | 'past'>('active');

  const activeBookings = mockBookings.filter(
    (b) => b.status === 'pending' || b.status === 'confirmed' || b.status === 'in-progress'
  );
  const pastBookings = mockBookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const displayBookings = activeTab === 'active' ? activeBookings : pastBookings;

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return colors.success;
      case 'pending':
        return colors.warning;
      case 'in-progress':
        return colors.primary;
      case 'completed':
        return colors.textSecondary;
      case 'cancelled':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getStatusText = (status: Booking['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ');
  };

  const getStatusIcon = (status: Booking['status']) => {
    switch (status) {
      case 'confirmed':
        return '✓';
      case 'pending':
        return '⋯';
      case 'in-progress':
        return '▶';
      case 'completed':
        return '✓';
      case 'cancelled':
        return '✕';
      default:
        return '';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Bookings</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'active' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('active')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'active' ? '#fff' : colors.textSecondary }]}>
            Active ({activeBookings.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'past' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('past')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'past' ? '#fff' : colors.textSecondary }]}>
            Past ({pastBookings.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        {displayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No bookings yet</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {activeTab === 'active'
                ? 'Book a service to get started'
                : 'Your completed bookings will appear here'}
            </Text>
          </View>
        ) : (
          displayBookings.map((booking) => (
            <View
              key={booking.id}
              style={[styles.bookingCard, { backgroundColor: colors.card }]}
            >
              <View style={styles.cardContent}>
                <View style={styles.leftColumn}>
                  <Image
                    source={{ uri: booking.providerImage }}
                    style={styles.providerImage}
                  />
                  <View style={styles.bookingInfo}>
                    <Text style={[styles.providerName, { color: colors.text }]}>{booking.providerName}</Text>
                    <Text style={[styles.service, { color: colors.text }]}>{booking.service}</Text>
                    <Text style={[styles.category, { color: colors.textSecondary }]}>{booking.category}</Text>
                  </View>
                </View>
                
                <View style={styles.rightColumn}>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(booking.status) }]}>
                      {getStatusText(booking.status)} {getStatusIcon(booking.status)}
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: colors.text }]}>{formatPrice(booking.price)}</Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>{booking.date}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>{booking.time}</Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>{booking.address}</Text>
                </View>
              </View>

              {activeTab === 'active' && (
                <View style={styles.actionButtons}>
                  {booking.status === 'confirmed' && booking.providerLocation && (
                    <TouchableOpacity 
                      style={[styles.trackButton, { backgroundColor: colors.secondary, borderColor: colors.secondary }]}
                      onPress={() => router.push(`/tracking/${booking.id}` as any)}
                      accessibilityRole="button"
                      accessibilityLabel="Track provider"
                    >
                      <Navigation size={18} color="#fff" />
                      <Text style={styles.trackButtonText}>Track</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: colors.primary }]}
                    accessibilityRole="button"
                    accessibilityLabel="View booking details"
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    textAlign: 'center' as const,
  },
  bookingCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    width: '100%',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  leftColumn: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  rightColumn: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 56,
  },
  providerImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  category: {
    fontSize: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
  },
  price: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    minHeight: 44,
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    minHeight: 44,
    borderWidth: 2,
  },
  trackButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
    letterSpacing: 0.2,
  },
});
