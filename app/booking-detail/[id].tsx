import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageCircle,
  CheckCircle,
  XCircle,
  Play,
  DollarSign,
  Star,
  HelpCircle,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { updateBookingStatus, subscribeToBooking } from '@/services/firestore/bookings';
import type { Booking } from '@/types';

const STATUS_CONFIG: Record<Booking['status'], { label: string; color: string; icon: any; description: string }> = {
  pending_confirmation: {
    label: 'Awaiting Confirmation',
    color: '#facc15',
    icon: Clock,
    description: 'Provider has received your request and will respond shortly',
  },
  pending: {
    label: 'Pending',
    color: '#f59e0b',
    icon: Clock,
    description: 'Waiting for provider confirmation',
  },
  accepted: {
    label: 'Accepted',
    color: '#3b82f6',
    icon: CheckCircle,
    description: 'Provider has confirmed your booking',
  },
  confirmed: {
    label: 'Confirmed',
    color: '#3b82f6',
    icon: CheckCircle,
    description: 'Provider has confirmed your booking',
  },
  declined: {
    label: 'Declined',
    color: '#ef4444',
    icon: XCircle,
    description: 'Provider has declined your booking',
  },
  'in-progress': {
    label: 'In Progress',
    color: '#8b5cf6',
    icon: Play,
    description: 'Service is currently being performed',
  },
  completed: {
    label: 'Completed',
    color: '#10b981',
    icon: CheckCircle,
    description: 'Service has been completed',
  },
  cancelled: {
    label: 'Cancelled',
    color: '#ef4444',
    icon: XCircle,
    description: 'Booking has been cancelled',
  },
};

const UNKNOWN_STATUS_CONFIG = {
  label: 'Status Unknown',
  color: '#6B7280',
  icon: HelpCircle,
  description: 'The booking status could not be determined.',
};

const getStatusConfig = (status: Booking['status'] | string) => {
  const normalizedStatus = typeof status === 'string' ? status : 'pending_confirmation';

  if (normalizedStatus in STATUS_CONFIG) {
    return STATUS_CONFIG[normalizedStatus as Booking['status']];
  }

  return UNKNOWN_STATUS_CONFIG;
};

export default function BookingDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuth();
  
  const [booking, setBooking] = useState<Booking | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || typeof id !== 'string') return;

    console.log('[BookingDetail] Setting up real-time booking listener');
    const unsubscribe = subscribeToBooking(id, (bookingData) => {
      console.log('[BookingDetail] Received booking update:', bookingData);
      setBooking(bookingData);
      setLoading(false);
    });

    return () => {
      console.log('[BookingDetail] Cleaning up booking listener');
      unsubscribe();
    };
  }, [id]);



  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Booking Details' }} />
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  if (!booking) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen options={{ title: 'Booking Details' }} />
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Booking not found
          </Text>
        </View>
      </View>
    );
  }

  const statusConfig = getStatusConfig(booking.status);
  const StatusIcon = statusConfig.icon;
  const isProvider = user?.role === 'provider';

  const handleAccept = async () => {
    if (!booking?.id) return;
    
    try {
      setActionLoading('accept');
      console.log('[BookingDetail] Accepting booking:', booking.id);
      await updateBookingStatus(booking.id, 'accepted');
      Alert.alert('Success', 'Booking accepted successfully');
      console.log('[BookingDetail] Booking accepted');
    } catch (error) {
      console.error('[BookingDetail] Error accepting booking:', error);
      Alert.alert('Error', 'Failed to accept booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async () => {
    if (!booking?.id) return;
    
    Alert.alert(
      'Decline Booking',
      'Are you sure you want to decline this booking?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('decline');
              console.log('[BookingDetail] Declining booking:', booking.id);
              await updateBookingStatus(booking.id, 'declined');
              Alert.alert('Declined', 'Booking has been declined');
              console.log('[BookingDetail] Booking declined');
            } catch (error) {
              console.error('[BookingDetail] Error declining booking:', error);
              Alert.alert('Error', 'Failed to decline booking. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleStartWork = async () => {
    if (!booking?.id) return;
    
    try {
      setActionLoading('start');
      console.log('[BookingDetail] Starting work:', booking.id);
      await updateBookingStatus(booking.id, 'in-progress');
      Alert.alert('Started', 'Work has been started');
      console.log('[BookingDetail] Work started');
    } catch (error) {
      console.error('[BookingDetail] Error starting work:', error);
      Alert.alert('Error', 'Failed to start work. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async () => {
    if (!booking?.id) return;
    
    try {
      setActionLoading('complete');
      console.log('[BookingDetail] Completing booking:', booking.id);
      await updateBookingStatus(booking.id, 'completed');
      Alert.alert('Completed', 'Service has been marked as completed');
      console.log('[BookingDetail] Booking completed');
    } catch (error) {
      console.error('[BookingDetail] Error completing booking:', error);
      Alert.alert('Error', 'Failed to complete booking. Please try again.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!booking?.id) return;
    
    Alert.alert(
      'Cancel Booking',
      'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading('cancel');
              console.log('[BookingDetail] Cancelling booking:', booking.id);
              await updateBookingStatus(booking.id, 'cancelled');
              Alert.alert('Cancelled', 'Booking has been cancelled');
              console.log('[BookingDetail] Booking cancelled');
            } catch (error) {
              console.error('[BookingDetail] Error cancelling booking:', error);
              Alert.alert('Error', 'Failed to cancel booking. Please try again.');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleAddTip = () => {
    Alert.prompt(
      'Add Tip',
      'Enter tip amount',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add',
          onPress: async (amount) => {
            if (amount && parseFloat(amount) > 0) {
              setActionLoading('tip');
              await new Promise(resolve => setTimeout(resolve, 800));
              setActionLoading(null);
              Alert.alert('Success', `Tip of $${amount} added successfully`);
            }
          },
        },
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleRateReview = () => {
    router.push(`/review/${booking.id}` as any);
  };

  const renderProviderActions = () => {
    if (booking.status === 'pending' || booking.status === 'pending_confirmation') {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.error, flex: 1 }]}
            onPress={handleDecline}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'decline' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <XCircle size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Decline</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success, flex: 1 }]}
            onPress={handleAccept}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'accept' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <CheckCircle size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    if (booking.status === 'accepted' || booking.status === 'confirmed') {
      return (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.primary }]}
          onPress={handleStartWork}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'start' ? (
            <ActivityIndicator color="#1E1E1E" />
          ) : (
            <>
              <Play size={20} color="#1E1E1E" />
              <Text style={[styles.primaryButtonText, { color: '#1E1E1E' }]}>Start Work</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (booking.status === 'in-progress') {
      return (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.success }]}
          onPress={handleComplete}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'complete' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <CheckCircle size={20} color="#fff" />
              <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Mark as Complete</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderCustomerActions = () => {
    if (
      booking.status === 'pending' ||
      booking.status === 'pending_confirmation' ||
      booking.status === 'accepted' ||
      booking.status === 'confirmed'
    ) {
      return (
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: colors.error }]}
          onPress={handleCancel}
          disabled={actionLoading !== null}
        >
          {actionLoading === 'cancel' ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <XCircle size={20} color="#fff" />
              <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Cancel Booking</Text>
            </>
          )}
        </TouchableOpacity>
      );
    }

    if (booking.status === 'completed') {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary, flex: 1 }]}
            onPress={handleAddTip}
            disabled={actionLoading !== null}
          >
            {actionLoading === 'tip' ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <DollarSign size={20} color="#1E1E1E" />
                <Text style={[styles.actionButtonText, { color: '#1E1E1E' }]}>Add Tip</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.secondary, flex: 1 }]}
            onPress={handleRateReview}
            disabled={actionLoading !== null}
          >
            <Star size={20} color="#1E1E1E" />
            <Text style={[styles.actionButtonText, { color: '#1E1E1E' }]}>Rate & Review</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Booking Details',
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
          <View style={[styles.statusIconContainer, { backgroundColor: `${statusConfig.color}20` }]}>
            <StatusIcon size={32} color={statusConfig.color} strokeWidth={2.5} />
          </View>
          <Text style={[styles.statusLabel, { color: statusConfig.color }]}>
            {statusConfig.label}
          </Text>
          <Text style={[styles.statusDescription, { color: colors.textSecondary }]}>
            {statusConfig.description}
          </Text>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.providerHeader}>
            <Image source={{ uri: booking.providerImage }} style={styles.providerImage} />
            <View style={styles.providerInfo}>
              <Text style={[styles.providerName, { color: colors.text }]}>
                {booking.providerName}
              </Text>
              <Text style={[styles.category, { color: colors.textSecondary }]}>
                {booking.category}
              </Text>
            </View>
            <View style={styles.contactButtons}>
              <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.primary }]}>
                <Phone size={18} color="#1E1E1E" />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.contactButton, { backgroundColor: colors.secondary }]}>
                <MessageCircle size={18} color="#1E1E1E" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Service Details</Text>
          
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{booking.date}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Clock size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Time</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{booking.time}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <MapPin size={20} color={colors.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>Address</Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>{booking.address}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Payment Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Service Fee</Text>
            <Text style={[styles.summaryValue, { color: colors.text }]}>
              ${booking.price.toFixed(2)}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.summaryRow}>
            <Text style={[styles.totalLabel, { color: colors.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: colors.primary }]}>
              ${booking.price.toFixed(2)}
            </Text>
          </View>
        </View>

        {booking.vehicleInfo && (
          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Vehicle Information</Text>
            
            <View style={styles.vehicleInfo}>
              <Text style={[styles.vehicleText, { color: colors.text }]}>
                {booking.vehicleInfo.year} {booking.vehicleInfo.make} {booking.vehicleInfo.model}
              </Text>
              <Text style={[styles.vehicleText, { color: colors.textSecondary }]}>
                {booking.vehicleInfo.color} • {booking.vehicleInfo.licensePlate}
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        {isProvider ? renderProviderActions() : renderCustomerActions()}
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
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statusCard: {
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  statusIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusLabel: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  statusDescription: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 20,
    marginBottom: 16,
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
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  providerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  contactButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  contactButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  vehicleInfo: {
    gap: 8,
  },
  vehicleText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    minHeight: 52,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
