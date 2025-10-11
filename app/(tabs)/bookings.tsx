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
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Clock, MapPin, Calendar, Navigation, ArrowRight, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useUserBookings } from '@/hooks/useFirestoreBookings';
import type { Booking } from '@/types';

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
      style={[
        styles.pulsingDot,
        {
          transform: [{ scale: pulseAnim }],
        },
      ]}
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
    Animated.spring(slideAnim, {
      toValue: activeTab === 'awaiting' ? 0 : activeTab === 'active' ? 1 : 2,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab, slideAnim]);

  const getStatusColor = (status: Booking['status']) => {
    switch (status) {
      case 'pending_confirmation':
        return colors.warning;
      case 'accepted':
        return colors.success;
      case 'declined':
        return colors.error;
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
      case 'pending_confirmation':
        return '⏳';
      case 'accepted':
        return '✓';
      case 'declined':
        return '✕';
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
    <View style={[styles.container, { backgroundColor: '#0A0E27' }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <LinearGradient
        colors={['#0A0E27', '#1A1F3A', '#0A0E27']}
        style={styles.gradientBackground}
      >
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: colors.primary }]}>Bookings</Text>
            <Text style={[styles.headerSubtitle, { color: '#8B92B0' }]}>Manage your experiences</Text>
          </View>

          <View style={styles.tabWrapper}>
            <View style={[styles.tabContainer, { backgroundColor: '#1A1F3A' }]}>
              <Animated.View
                style={[
                  styles.tabIndicator,
                  {
                    backgroundColor: colors.primary,
                    transform: [
                      {
                        translateX: slideAnim.interpolate({
                          inputRange: [0, 1, 2],
                          outputRange: [0, 120, 240],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Pressable
                style={styles.tab}
                onPress={() => setActiveTab('awaiting')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'awaiting' ? colors.primary : '#6B7199' },
                  ]}
                >
                  Awaiting
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: activeTab === 'awaiting' ? `${colors.primary}30` : '#2A2F4A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: activeTab === 'awaiting' ? colors.primary : '#6B7199' },
                    ]}
                  >
                    {awaitingBookings.length}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.tab}
                onPress={() => setActiveTab('active')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'active' ? colors.primary : '#6B7199' },
                  ]}
                >
                  Active
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: activeTab === 'active' ? `${colors.primary}30` : '#2A2F4A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: activeTab === 'active' ? colors.primary : '#6B7199' },
                    ]}
                  >
                    {activeBookings.length}
                  </Text>
                </View>
              </Pressable>
              <Pressable
                style={styles.tab}
                onPress={() => setActiveTab('past')}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: activeTab === 'past' ? colors.primary : '#6B7199' },
                  ]}
                >
                  Past
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: activeTab === 'past' ? `${colors.primary}30` : '#2A2F4A',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.badgeText,
                      { color: activeTab === 'past' ? colors.primary : '#6B7199' },
                    ]}
                  >
                    {pastBookings.length}
                  </Text>
                </View>
              </Pressable>
            </View>
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
                tintColor={colors.primary}
                colors={[colors.primary]}
              />
            }
          >
            {isLoading && bookings.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={[styles.loadingText, { color: '#8B92B0' }]}>Loading bookings...</Text>
              </View>
            ) : displayBookings.length === 0 ? (
              <View style={styles.emptyState}>
                <View style={[styles.emptyIconContainer, { backgroundColor: `${colors.primary}15` }]}>
                  <Calendar size={48} color={colors.primary} strokeWidth={1.5} />
                </View>
                <Text style={[styles.emptyTitle, { color: '#FFFFFF' }]}>
                  {activeTab === 'awaiting'
                    ? 'No pending bookings'
                    : activeTab === 'active'
                    ? 'No active bookings'
                    : 'No past bookings'}
                </Text>
                <Text style={[styles.emptyDescription, { color: '#8B92B0' }]}>
                  {activeTab === 'awaiting'
                    ? 'Orders awaiting merchant confirmation will appear here'
                    : activeTab === 'active'
                    ? 'Your next experience awaits!'
                    : 'Your completed bookings will appear here'}
                </Text>
                {activeTab !== 'past' && (
                  <TouchableOpacity
                    style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                    onPress={() => router.push('/(tabs)/search')}
                  >
                    <Sparkles size={18} color="#0A0E27" strokeWidth={2.5} />
                    <Text style={styles.emptyButtonText}>Book Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              displayBookings.map((booking) => (
                <Pressable
                  key={booking.id}
                  style={({ pressed }) => [
                    styles.bookingCard,
                    { backgroundColor: '#1A1F3A' },
                    pressed && styles.cardPressed,
                  ]}
                  onPress={() => router.push(`/booking-detail/${booking.id}` as any)}
                >
                  <LinearGradient
                    colors={['#1A1F3A', '#151933']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.providerSection}>
                        <View style={styles.imageWrapper}>
                          <Image
                            source={{ uri: booking.providerImage }}
                            style={styles.providerImage}
                          />
                          {booking.status === 'pending_confirmation' && (
                            <View style={styles.pulsingDotContainer}>
                              <PulsingDot />
                            </View>
                          )}
                        </View>
                        <View style={styles.bookingInfo}>
                          <Text style={[styles.providerName, { color: '#FFFFFF' }]} numberOfLines={1}>
                            {booking.providerName}
                          </Text>
                          <Text style={[styles.service, { color: colors.primary }]} numberOfLines={1}>
                            {booking.service}
                          </Text>
                          <Text style={[styles.category, { color: '#6B7199' }]} numberOfLines={1}>
                            {booking.category}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.priceSection}>
                        <Text style={[styles.price, { color: colors.primary }]}>
                          {formatPrice(booking.price)}
                        </Text>
                        <View
                          style={[
                            styles.statusBadge,
                            {
                              backgroundColor:
                                booking.status === 'pending_confirmation'
                                  ? `${colors.warning}20`
                                  : booking.status === 'accepted' || booking.status === 'in-progress'
                                  ? `${colors.success}20`
                                  : `${colors.textSecondary}20`,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              {
                                color:
                                  booking.status === 'pending_confirmation'
                                    ? colors.warning
                                    : booking.status === 'accepted' || booking.status === 'in-progress'
                                    ? colors.success
                                    : '#8B92B0',
                              },
                            ]}
                          >
                            {getStatusText(booking.status)}
                          </Text>
                        </View>
                      </View>
                    </View>

                    {booking.status === 'pending_confirmation' && (
                      <View style={[styles.awaitingBanner, { backgroundColor: `${colors.warning}15` }]}>
                        <Clock size={14} color={colors.warning} strokeWidth={2} />
                        <Text style={[styles.awaitingText, { color: colors.warning }]}>
                          Awaiting merchant confirmation...
                        </Text>
                      </View>
                    )}

                    <View style={[styles.divider, { backgroundColor: '#2A2F4A' }]} />

                    <View style={styles.bookingDetails}>
                      <View style={styles.detailRow}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                          <Calendar size={14} color={colors.primary} strokeWidth={2} />
                        </View>
                        <Text style={[styles.detailText, { color: '#8B92B0' }]}>{booking.date}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                          <Clock size={14} color={colors.primary} strokeWidth={2} />
                        </View>
                        <Text style={[styles.detailText, { color: '#8B92B0' }]}>{booking.time}</Text>
                      </View>
                      <View style={styles.detailRow}>
                        <View style={[styles.iconCircle, { backgroundColor: `${colors.primary}15` }]}>
                          <MapPin size={14} color={colors.primary} strokeWidth={2} />
                        </View>
                        <Text style={[styles.detailText, { color: '#8B92B0' }]} numberOfLines={1}>
                          {booking.address}
                        </Text>
                      </View>
                    </View>

                    {(activeTab === 'active' || activeTab === 'awaiting') && (
                      <View style={styles.actionButtons}>
                        {booking.status === 'accepted' && booking.providerLocation && (
                          <TouchableOpacity
                            style={[styles.trackButton, { borderColor: colors.primary }]}
                            onPress={(e) => {
                              e.stopPropagation();
                              router.push(`/tracking/${booking.id}` as any);
                            }}
                          >
                            <Navigation size={16} color={colors.primary} strokeWidth={2.5} />
                            <Text style={[styles.trackButtonText, { color: colors.primary }]}>Track</Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          style={[styles.viewDetailsButton, { backgroundColor: colors.primary }]}
                          onPress={(e) => {
                            e.stopPropagation();
                            router.push(`/booking-detail/${booking.id}` as any);
                          }}
                        >
                          <Text style={styles.viewDetailsText}>View Details</Text>
                          <ArrowRight size={16} color="#0A0E27" strokeWidth={2.5} />
                        </TouchableOpacity>
                      </View>
                    )}
                  </LinearGradient>
                </Pressable>
              ))
            )}
          </ScrollView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800' as const,
    letterSpacing: -1,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    letterSpacing: 0.2,
  },
  tabWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 4,
    position: 'relative' as const,
  },
  tabIndicator: {
    position: 'absolute' as const,
    top: 4,
    left: 4,
    width: 112,
    height: 44,
    borderRadius: 12,
    opacity: 0.15,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
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
    letterSpacing: -0.5,
  },
  emptyDescription: {
    fontSize: 15,
    textAlign: 'center' as const,
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#0A0E27',
    letterSpacing: 0.3,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: 16,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  bookingCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
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
    marginRight: 16,
  },
  imageWrapper: {
    position: 'relative' as const,
    marginRight: 12,
  },
  providerImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#2A2F4A',
  },
  pulsingDotContainer: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
  },
  pulsingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f59e0b',
  },
  bookingInfo: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: -0.3,
  },
  service: {
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  category: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  priceSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  price: {
    fontSize: 20,
    fontWeight: '800' as const,
    letterSpacing: -0.5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  awaitingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  awaitingText: {
    fontSize: 13,
    fontWeight: '600' as const,
    fontStyle: 'italic' as const,
    flex: 1,
  },
  divider: {
    height: 1,
    marginBottom: 16,
  },
  bookingDetails: {
    gap: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailText: {
    fontSize: 14,
    fontWeight: '500' as const,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  trackButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  trackButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    letterSpacing: 0.3,
  },
  viewDetailsButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#0A0E27',
    letterSpacing: 0.3,
  },
});
