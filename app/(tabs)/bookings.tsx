import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Clock, MapPin, Calendar, Navigation, ArrowRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBookings } from '@/hooks/useFirestoreBookings';
import type { Booking } from '@/types';

const { width } = Dimensions.get('window');

function PulsingDot() {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#D4AF37',
        transform: [{ scale: pulseAnim }],
        marginLeft: 6,
      }}
    />
  );
}

export default function BookingsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'awaiting' | 'active' | 'past'>('awaiting');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const userRole = user?.role === 'admin' ? 'customer' : (user?.role || 'customer');
  const { data: bookings = [], isLoading, refetch } = useUserBookings(
    user?.id || '',
    userRole
  );

  const awaitingBookings = bookings.filter(
    (b) => b.status === 'pending_confirmation'
  );
  const activeBookings = bookings.filter(
    (b) => b.status === 'pending' || b.status === 'accepted' || b.status === 'in-progress'
  );
  const pastBookings = bookings.filter(
    (b) => b.status === 'completed' || b.status === 'cancelled'
  );

  const displayBookings = activeTab === 'awaiting' ? awaitingBookings : activeTab === 'active' ? activeBookings : pastBookings;

  useEffect(() => {
    const tabIndex = activeTab === 'awaiting' ? 0 : activeTab === 'active' ? 1 : 2;
    Animated.spring(slideAnim, {
      toValue: tabIndex,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab, slideAnim]);

  const getStatusText = (status: Booking['status']) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, ' ').replace(/-/g, ' ');
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
        <Text style={[styles.headerTitle, { color: '#D4AF37' }]}>Bookings</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>Manage your service bookings</Text>
      </View>

      <View style={[styles.tabContainer, { backgroundColor: colors.background }]}>
        <View style={styles.tabWrapper}>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('awaiting')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'awaiting' ? '#D4AF37' : colors.textSecondary }]}>
              Awaiting
            </Text>
            {awaitingBookings.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#D4AF37' }]}>
                <Text style={styles.badgeText}>{awaitingBookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('active')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'active' ? '#D4AF37' : colors.textSecondary }]}>
              Active
            </Text>
            {activeBookings.length > 0 && (
              <View style={[styles.badge, { backgroundColor: '#10b981' }]}>
                <Text style={styles.badgeText}>{activeBookings.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.tab}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: activeTab === 'past' ? '#D4AF37' : colors.textSecondary }]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>
        <Animated.View
          style={[
            styles.tabIndicator,
            {
              backgroundColor: '#D4AF37',
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, (width - 48) / 3, ((width - 48) / 3) * 2],
                  }),
                },
              ],
              width: (width - 48) / 3,
            },
          ]}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor="#D4AF37"
            colors={['#D4AF37']}
          />
        }
      >
        {isLoading && bookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#D4AF37" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading bookings...</Text>
          </View>
        ) : displayBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}15` }]}>
              <Calendar size={48} color="#D4AF37" strokeWidth={1.5} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {activeTab === 'awaiting'
                ? 'No pending bookings'
                : activeTab === 'active'
                ? 'No active bookings'
                : 'No past bookings'}
            </Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {activeTab === 'awaiting'
                ? 'Orders awaiting merchant confirmation will appear here'
                : activeTab === 'active'
                ? 'Your next experience awaits!'
                : 'Your completed bookings will appear here'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity
                style={[styles.ctaButton, { backgroundColor: '#D4AF37' }]}
                onPress={() => router.push('/(tabs)/search')}
                activeOpacity={0.8}
              >
                <Text style={styles.ctaButtonText}>Book Now</Text>
                <ArrowRight size={18} color="#1E1E1E" strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          displayBookings.map((booking) => (
            <TouchableOpacity
              key={booking.id}
              style={[styles.bookingCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/booking-detail/${booking.id}` as any)}
              activeOpacity={0.95}
            >
              <LinearGradient
                colors={[
                  booking.status === 'pending_confirmation' ? '#D4AF3708' : 'transparent',
                  'transparent',
                ]}
                style={styles.cardGradient}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.providerSection}>
                    <Image
                      source={{ uri: booking.providerImage }}
                      style={styles.providerImage}
                    />
                    <View style={styles.providerInfo}>
                      <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
                        {booking.providerName}
                      </Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                booking.status === 'pending_confirmation'
                                  ? '#D4AF3720'
                                  : booking.status === 'accepted' || booking.status === 'in-progress'
                                  ? '#10b98120'
                                  : '#64748b20',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  booking.status === 'pending_confirmation'
                                    ? '#D4AF37'
                                    : booking.status === 'accepted' || booking.status === 'in-progress'
                                    ? '#10b981'
                                    : '#64748b',
                              },
                            ]}
                          >
                            {getStatusText(booking.status)}
                          </Text>
                        </View>
                        {booking.status === 'pending_confirmation' && <PulsingDot />}
                      </View>
                    </View>
                  </View>
                  <Text style={[styles.price, { color: '#D4AF37' }]}>{formatPrice(booking.price)}</Text>
                </View>

                <View style={styles.serviceSection}>
                  <Text style={[styles.service, { color: colors.text }]} numberOfLines={1}>
                    {booking.service}
                  </Text>
                  <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
                    {booking.category}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.detailsGrid}>
                  <View style={styles.detailItem}>
                    <Calendar size={14} color="#D4AF37" strokeWidth={2} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {booking.date}
                    </Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Clock size={14} color="#D4AF37" strokeWidth={2} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {booking.time}
                    </Text>
                  </View>
                </View>

                <View style={styles.locationRow}>
                  <MapPin size={14} color="#D4AF37" strokeWidth={2} />
                  <Text style={[styles.locationText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {booking.address}
                  </Text>
                </View>

                {(activeTab === 'active' || activeTab === 'awaiting') && (
                  <View style={styles.actionRow}>
                    {booking.status === 'accepted' && booking.providerLocation && (
                      <TouchableOpacity
                        style={[styles.trackButton, { borderColor: '#10b981' }]}
                        onPress={(e) => {
                          e.stopPropagation();
                          router.push(`/tracking/${booking.id}` as any);
                        }}
                        activeOpacity={0.7}
                      >
                        <Navigation size={16} color="#10b981" strokeWidth={2.5} />
                        <Text style={[styles.trackButtonText, { color: '#10b981' }]}>Track</Text>
                      </TouchableOpacity>
                    )}
                    <View style={styles.viewDetailsButton}>
                      <Text style={[styles.viewDetailsText, { color: '#D4AF37' }]}>View Details</Text>
                      <ArrowRight size={16} color="#D4AF37" strokeWidth={2.5} />
                    </View>
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
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
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700' as const,
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '400' as const,
    letterSpacing: 0.2,
  },
  tabContainer: {
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  tabWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 8,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  tabIndicator: {
    height: 3,
    borderRadius: 1.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    paddingHorizontal: 32,
  },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  bookingCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  cardGradient: {
    padding: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  providerSection: {
    flexDirection: 'row',
    flex: 1,
    marginRight: 12,
  },
  providerImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#D4AF3720',
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  price: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  serviceSection: {
    marginBottom: 16,
  },
  service: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
    letterSpacing: -0.1,
  },
  category: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  divider: {
    height: 1,
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  detailText: {
    fontSize: 13,
    flex: 1,
    color: '#64748b',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  locationText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 2,
    backgroundColor: '#fff',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
});
