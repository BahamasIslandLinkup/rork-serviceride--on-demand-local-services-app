import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { Calendar, Clock, MapPin, X, Check } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';
import type { Booking } from '@/types';

export default function ProviderRequestsScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { bookings, acceptBooking, declineBooking, refreshBookings, isLoading } = useBooking();
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingBookings = bookings.filter(
    (b) => b.providerId === user?.id && b.status === 'pending'
  );

  const handleAccept = async (bookingId: string) => {
    try {
      setIsSubmitting(true);
      const result = await acceptBooking(bookingId);
      if (result.success) {
        Alert.alert('Success', 'Booking accepted successfully');
      } else {
        Alert.alert('Error', result.error || 'Failed to accept booking');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to accept booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeclinePress = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowDeclineModal(true);
  };

  const handleDeclineSubmit = async () => {
    if (!selectedBooking) return;
    
    if (!declineReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for declining');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await declineBooking(selectedBooking.id, declineReason);
      if (result.success) {
        Alert.alert('Success', 'Booking declined');
        setShowDeclineModal(false);
        setDeclineReason('');
        setSelectedBooking(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to decline booking');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to decline booking');
    } finally {
      setIsSubmitting(false);
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Booking Requests',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refreshBookings}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {isLoading && pendingBookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Loading requests...
            </Text>
          </View>
        ) : pendingBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No pending requests</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              New booking requests will appear here
            </Text>
          </View>
        ) : (
          pendingBookings.map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <Image
                  source={{ uri: booking.clientImage || 'https://via.placeholder.com/48' }}
                  style={styles.clientImage}
                />
                <View style={styles.clientInfo}>
                  <Text style={[styles.clientName, { color: colors.text }]}>
                    {booking.clientName}
                  </Text>
                  <Text style={[styles.service, { color: colors.textSecondary }]}>
                    {booking.service}
                  </Text>
                </View>
                <View style={[styles.priceBadge, { backgroundColor: colors.primary + '20' }]}>
                  <Text style={[styles.priceText, { color: colors.primary }]}>
                    {formatPrice(booking.price)}
                  </Text>
                </View>
              </View>

              <View style={[styles.divider, { backgroundColor: colors.border }]} />

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {booking.date}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Clock size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>
                    {booking.time} • {booking.hours || 2} hours
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <MapPin size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]} numberOfLines={2}>
                    {booking.address}
                  </Text>
                </View>
              </View>

              {booking.notes && (
                <>
                  <View style={[styles.divider, { backgroundColor: colors.border }]} />
                  <View style={styles.notesSection}>
                    <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Notes:</Text>
                    <Text style={[styles.notesText, { color: colors.text }]}>{booking.notes}</Text>
                  </View>
                </>
              )}

              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.declineButton, { borderColor: colors.error }]}
                  onPress={() => handleDeclinePress(booking)}
                  disabled={isSubmitting}
                >
                  <X size={20} color={colors.error} />
                  <Text style={[styles.declineButtonText, { color: colors.error }]}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.acceptButton, { backgroundColor: colors.success }]}
                  onPress={() => handleAccept(booking.id)}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Check size={20} color="#fff" />
                      <Text style={styles.acceptButtonText}>Accept</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={showDeclineModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDeclineModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Decline Booking</Text>
              <TouchableOpacity onPress={() => setShowDeclineModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Please provide a reason for declining this booking. The client will be notified.
            </Text>

            <TextInput
              style={[
                styles.reasonInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="e.g., Not available at this time, Outside service area..."
              placeholderTextColor={colors.textSecondary}
              value={declineReason}
              onChangeText={setDeclineReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowDeclineModal(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: colors.error }]}
                onPress={handleDeclineSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Decline Booking</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    padding: 16,
    paddingBottom: 100,
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
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  clientImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  clientInfo: {
    flex: 1,
  },
  clientName: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  service: {
    fontSize: 14,
  },
  priceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '700' as const,
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
  notesSection: {
    marginTop: 12,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600' as const,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  reasonInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 100,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  modalSubmitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSubmitText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: '#fff',
  },
});
