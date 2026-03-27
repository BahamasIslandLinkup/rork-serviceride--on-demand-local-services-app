import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Play, Check, X, Camera } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useProviderBookings } from '@/hooks/useProviderBookings';
import { StorageService } from '@/services/storage';
import * as ImagePicker from 'expo-image-picker';
import type { Booking } from '@/types';

export default function ProviderJobsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { pendingBookings, activeBookings, completedBookings, isLoading, startWork, completeWork } =
    useProviderBookings();
  const [activeTab, setActiveTab] = useState<'pending' | 'active' | 'completed'>('active');
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [completionNotes, setCompletionNotes] = useState('');
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs = [
    { key: 'pending' as const, label: 'Pending', count: pendingBookings.length },
    { key: 'active' as const, label: 'Active', count: activeBookings.length },
    { key: 'completed' as const, label: 'Completed', count: completedBookings.length },
  ];

  const currentBookings =
    activeTab === 'pending'
      ? pendingBookings
      : activeTab === 'active'
      ? activeBookings
      : completedBookings;

  const handleStartWork = async (bookingId: string) => {
    Alert.alert('Start Work', 'Are you ready to start this job?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Start',
        onPress: async () => {
          const result = await startWork(bookingId);
          if (result.success) {
            Alert.alert('Success', 'Work started successfully');
          } else {
            Alert.alert('Error', result.error || 'Failed to start work');
          }
        },
      },
    ]);
  };

  const handleCompletePress = (booking: Booking) => {
    setSelectedBooking(booking);
    setShowCompleteModal(true);
  };

  const handleAddProofImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const uris = result.assets.map((asset) => asset.uri);
        setProofImages([...proofImages, ...uris]);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to select images');
    }
  };

  const handleCompleteSubmit = async () => {
    if (!selectedBooking) return;

    try {
      setIsSubmitting(true);

      let uploadedMedia: any[] = [];
      if (proofImages.length > 0) {
        const media = proofImages.map((uri) => ({ uri, type: 'image' as const }));
        uploadedMedia = await StorageService.uploadProofMedia(
          selectedBooking.id,
          selectedBooking.providerId,
          media
        );
      }

      const result = await completeWork(selectedBooking.id, uploadedMedia);

      if (result.success) {
        Alert.alert('Success', 'Job completed successfully');
        setShowCompleteModal(false);
        setCompletionNotes('');
        setProofImages([]);
        setSelectedBooking(null);
      } else {
        Alert.alert('Error', result.error || 'Failed to complete job');
      }
    } catch (error: any) {
      console.error('Error completing work:', error);
      Alert.alert('Error', error.message || 'Failed to complete job');
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
          title: 'My Jobs',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <View style={[styles.tabsContainer, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              activeTab === tab.key && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.textSecondary }]}>
              {tab.label}
            </Text>
            {tab.count > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{tab.count}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isLoading} tintColor={colors.primary} colors={[colors.primary]} />
        }
      >
        {isLoading && currentBookings.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading jobs...</Text>
          </View>
        ) : currentBookings.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No {activeTab} jobs</Text>
            <Text style={[styles.emptyDescription, { color: colors.textSecondary }]}>
              {activeTab === 'pending'
                ? 'New booking requests will appear here'
                : activeTab === 'active'
                ? 'Accepted jobs will appear here'
                : 'Completed jobs will appear here'}
            </Text>
          </View>
        ) : (
          currentBookings.map((booking) => (
            <View key={booking.id} style={[styles.jobCard, { backgroundColor: colors.card }]}>
              <View style={styles.cardHeader}>
                <View style={styles.clientInfo}>
                  <Text style={[styles.clientName, { color: colors.text }]}>{booking.clientName}</Text>
                  <Text style={[styles.service, { color: colors.textSecondary }]}>{booking.service}</Text>
                </View>
                <View style={[styles.priceBadge, { backgroundColor: `${colors.primary}20` }]}>
                  <Text style={[styles.priceText, { color: colors.primary }]}>{formatPrice(booking.price)}</Text>
                </View>
              </View>

              <View style={styles.jobDetails}>
                <View style={styles.detailRow}>
                  <Calendar size={16} color={colors.textSecondary} />
                  <Text style={[styles.detailText, { color: colors.textSecondary }]}>{booking.date}</Text>
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

              {activeTab === 'active' && (
                <View style={styles.actionButtons}>
                  {booking.status === 'accepted' || booking.status === 'confirmed' ? (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.success }]}
                      onPress={() => handleStartWork(booking.id)}
                    >
                      <Play size={20} color="#fff" fill="#fff" />
                      <Text style={styles.primaryButtonText}>Start Work</Text>
                    </TouchableOpacity>
                  ) : booking.status === 'in-progress' ? (
                    <TouchableOpacity
                      style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                      onPress={() => handleCompletePress(booking)}
                    >
                      <Check size={20} color="#fff" />
                      <Text style={styles.primaryButtonText}>Complete Job</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Modal visible={showCompleteModal} animationType="slide" transparent={true} onRequestClose={() => setShowCompleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Complete Job</Text>
              <TouchableOpacity onPress={() => setShowCompleteModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
              Add completion notes and proof images (optional)
            </Text>

            <TextInput
              style={[
                styles.notesInput,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Add any completion notes..."
              placeholderTextColor={colors.textSecondary}
              value={completionNotes}
              onChangeText={setCompletionNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.addImageButton, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={handleAddProofImage}
            >
              <Camera size={24} color={colors.primary} />
              <Text style={[styles.addImageText, { color: colors.primary }]}>Add Proof Images ({proofImages.length})</Text>
            </TouchableOpacity>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalCancelButton, { borderColor: colors.border }]}
                onPress={() => setShowCompleteModal(false)}
                disabled={isSubmitting}
              >
                <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitButton, { backgroundColor: colors.success }]}
                onPress={handleCompleteSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.modalSubmitText}>Complete Job</Text>
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
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  tabLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700' as const,
    color: '#fff',
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
  jobCard: {
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
    justifyContent: 'space-between',
    marginBottom: 16,
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
  jobDetails: {
    gap: 8,
    marginBottom: 16,
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
  actionButtons: {
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  primaryButtonText: {
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
  notesInput: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
    minHeight: 100,
    marginBottom: 16,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 24,
  },
  addImageText: {
    fontSize: 15,
    fontWeight: '600' as const,
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
