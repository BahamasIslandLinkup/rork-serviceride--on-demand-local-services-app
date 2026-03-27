import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { X, Paperclip, Video } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/contexts/ThemeContext';
import { mockBookings } from '@/mocks/services';
import type { DisputeEvidence } from '@/types';

const disputeCategories = [
  { id: 'service_quality', label: 'Service Quality' },
  { id: 'payment', label: 'Payment Issue' },
  { id: 'cancellation', label: 'Cancellation' },
  { id: 'no_show', label: 'No Show' },
  { id: 'other', label: 'Other' },
] as const;

export default function NewDisputeScreen() {
  const { colors } = useTheme();
  const [selectedBooking, setSelectedBooking] = useState<string>('');
  const [category, setCategory] = useState<string>('');
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [evidence, setEvidence] = useState<DisputeEvidence[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeBookings = mockBookings.filter(b => 
    b.status === 'confirmed' || b.status === 'in-progress' || b.status === 'completed'
  );

  const pickEvidence = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions to attach evidence.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets) {
        const newEvidence: DisputeEvidence[] = result.assets.map((asset) => ({
          id: Date.now().toString() + Math.random(),
          type: asset.type === 'video' ? 'video' : 'image',
          uri: asset.uri,
          uploadedAt: new Date().toISOString(),
        }));
        setEvidence([...evidence, ...newEvidence]);
      }
    } catch (error) {
      console.error('Error picking evidence:', error);
      Alert.alert('Error', 'Failed to pick evidence');
    }
  };

  const removeEvidence = (evidenceId: string) => {
    setEvidence(evidence.filter(e => e.id !== evidenceId));
  };

  const handleSubmit = async () => {
    if (!selectedBooking) {
      Alert.alert('Required', 'Please select a booking');
      return;
    }
    if (!category) {
      Alert.alert('Required', 'Please select a category');
      return;
    }
    if (!reason.trim()) {
      Alert.alert('Required', 'Please provide a reason');
      return;
    }
    if (!description.trim()) {
      Alert.alert('Required', 'Please provide a description');
      return;
    }

    setIsSubmitting(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Dispute Created',
        'Your dispute has been submitted. The merchant will be notified and has 24 hours to respond.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error submitting dispute:', error);
      Alert.alert('Error', 'Failed to submit dispute. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'New Dispute',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Select Booking *</Text>
          <View style={styles.bookingList}>
            {activeBookings.map((booking) => (
              <TouchableOpacity
                key={booking.id}
                style={[
                  styles.bookingOption,
                  { 
                    backgroundColor: colors.card,
                    borderColor: selectedBooking === booking.id ? colors.primary : colors.border,
                    borderWidth: selectedBooking === booking.id ? 2 : 1,
                  }
                ]}
                onPress={() => setSelectedBooking(booking.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: selectedBooking === booking.id }}
              >
                <View style={styles.bookingInfo}>
                  <Text style={[styles.bookingProvider, { color: colors.text }]}>{booking.providerName}</Text>
                  <Text style={[styles.bookingService, { color: colors.textSecondary }]}>{booking.service}</Text>
                  <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>
                    {booking.date} • {booking.time}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Category *</Text>
          <View style={styles.categoryGrid}>
            {disputeCategories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryOption,
                  {
                    backgroundColor: category === cat.id ? colors.primary : colors.card,
                    borderColor: category === cat.id ? colors.primary : colors.border,
                  }
                ]}
                onPress={() => setCategory(cat.id)}
                accessibilityRole="radio"
                accessibilityState={{ checked: category === cat.id }}
              >
                <Text style={[styles.categoryText, { color: category === cat.id ? '#fff' : colors.text }]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Reason *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
            placeholder="Brief summary of the issue"
            placeholderTextColor={colors.textSecondary}
            value={reason}
            onChangeText={setReason}
            maxLength={100}
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{reason.length}/100</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Description *</Text>
          <TextInput
            style={[
              styles.input,
              styles.textArea,
              { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }
            ]}
            placeholder="Provide detailed information about the issue"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={[styles.charCount, { color: colors.textSecondary }]}>{description.length}/1000</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: colors.text }]}>Evidence (Optional)</Text>
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Attach photos or videos to support your case
          </Text>

          {evidence.length > 0 && (
            <ScrollView
              horizontal
              style={styles.evidenceList}
              showsHorizontalScrollIndicator={false}
            >
              {evidence.map((item) => (
                <View key={item.id} style={styles.evidenceItem}>
                  {item.type === 'image' ? (
                    <Image source={{ uri: item.uri }} style={styles.evidenceImage} />
                  ) : (
                    <View style={[styles.evidenceImage, styles.videoPlaceholder]}>
                      <Video size={32} color="#fff" />
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeEvidence}
                    onPress={() => removeEvidence(item.id)}
                    accessibilityLabel="Remove evidence"
                    accessibilityRole="button"
                  >
                    <X size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickEvidence}
            accessibilityLabel="Attach evidence"
            accessibilityRole="button"
          >
            <Paperclip size={20} color={colors.primary} />
            <Text style={[styles.attachButtonText, { color: colors.primary }]}>Attach Photos or Videos</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={isSubmitting}
          accessibilityRole="button"
          accessibilityLabel="Submit dispute"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.submitButtonText}>Submit Dispute</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
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
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  hint: {
    fontSize: 13,
    marginBottom: 12,
  },
  bookingList: {
    gap: 12,
  },
  bookingOption: {
    borderRadius: 12,
    padding: 16,
  },
  bookingInfo: {
    gap: 4,
  },
  bookingProvider: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  bookingService: {
    fontSize: 14,
  },
  bookingDate: {
    fontSize: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right' as const,
    marginTop: 4,
  },
  evidenceList: {
    marginBottom: 12,
  },
  evidenceItem: {
    marginRight: 12,
    position: 'relative' as const,
  },
  evidenceImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  videoPlaceholder: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeEvidence: {
    position: 'absolute' as const,
    top: -6,
    right: -6,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
  },
  attachButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  submitButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
