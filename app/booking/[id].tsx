import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Calendar, Clock, MapPin } from 'lucide-react-native';
import { serviceProviders } from '@/mocks/services';
import colors from '@/constants/colors';
import { useAuth } from '@/contexts/AuthContext';
import { useBooking } from '@/contexts/BookingContext';

const timeSlots = [
  '8:00 AM',
  '9:00 AM',
  '10:00 AM',
  '11:00 AM',
  '12:00 PM',
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
];

export default function BookingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { createBooking, isLoading: bookingLoading } = useBooking();
  const provider = serviceProviders.find((p) => p.id === id);

  const [selectedDate, setSelectedDate] = useState('2025-10-12');
  const [selectedTime, setSelectedTime] = useState('');
  const [hours, setHours] = useState('2');
  const [address, setAddress] = useState('123 Main St, Your City');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!provider) {
    return null;
  }

  const totalPrice = provider.hourlyRate * parseFloat(hours || '0');

  const handleBooking = async () => {
    if (!selectedTime) {
      Alert.alert('Missing Information', 'Please select a time slot');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to book a service');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('[Booking] Creating booking...');

      const scheduledAt = new Date(`${selectedDate}T${convertTo24Hour(selectedTime)}`);

      const result = await createBooking({
        clientId: user.id,
        clientName: user.name,
        clientImage: user.avatar,
        providerId: provider.id,
        providerName: provider.name,
        providerImage: provider.image,
        category: provider.category,
        service: provider.category,
        date: selectedDate,
        time: selectedTime,
        scheduledAt: scheduledAt.toISOString(),
        status: 'pending',
        price: totalPrice,
        hours: parseFloat(hours),
        address,
        notes,
      });

      if (result.success) {
        Alert.alert(
          'Booking Created!',
          `Your booking with ${provider.name} has been created for ${selectedDate} at ${selectedTime}`,
          [
            {
              text: 'View Bookings',
              onPress: () => router.push('/(tabs)/bookings'),
            },
            {
              text: 'OK',
              onPress: () => router.back(),
            },
          ]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to create booking');
      }
    } catch (error) {
      console.error('[Booking] Error creating booking:', error);
      Alert.alert('Error', 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const convertTo24Hour = (time12h: string): string => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    
    if (hours === '12') {
      hours = '00';
    }
    
    if (modifier === 'PM') {
      hours = String(parseInt(hours, 10) + 12);
    }
    
    return `${hours.padStart(2, '0')}:${minutes || '00'}:00`;
  };

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Book Service',
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
        <View style={styles.providerCard}>
          <Image source={{ uri: provider.image }} style={styles.providerImage} />
          <View style={styles.providerInfo}>
            <Text style={styles.providerName}>{provider.name}</Text>
            <Text style={styles.category}>{provider.category}</Text>
            <Text style={styles.rate}>${provider.hourlyRate}/hr</Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Calendar size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Select Date</Text>
          </View>
          <View style={styles.dateContainer}>
            {['2025-10-12', '2025-10-13', '2025-10-14', '2025-10-15'].map((date) => (
              <TouchableOpacity
                key={date}
                style={[styles.dateCard, selectedDate === date && styles.selectedDateCard]}
                onPress={() => setSelectedDate(date)}
              >
                <Text style={[styles.dateDay, selectedDate === date && styles.selectedDateText]}>
                  {new Date(date).toLocaleDateString('en-US', { weekday: 'short' })}
                </Text>
                <Text
                  style={[styles.dateNumber, selectedDate === date && styles.selectedDateText]}
                >
                  {new Date(date).getDate()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Select Time</Text>
          </View>
          <View style={styles.timeGrid}>
            {timeSlots.map((time) => (
              <TouchableOpacity
                key={time}
                style={[styles.timeSlot, selectedTime === time && styles.selectedTimeSlot]}
                onPress={() => setSelectedTime(time)}
              >
                <Text style={[styles.timeText, selectedTime === time && styles.selectedTimeText]}>
                  {time}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Clock size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Estimated Hours</Text>
          </View>
          <TextInput
            style={styles.input}
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            placeholder="Enter hours"
            placeholderTextColor={colors.textSecondary}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <MapPin size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Service Address</Text>
          </View>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter your address"
            placeholderTextColor={colors.textSecondary}
            multiline
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            value={notes}
            onChangeText={setNotes}
            placeholder="Any special instructions or requirements..."
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Service Provider</Text>
            <Text style={styles.summaryValue}>{provider.name}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date & Time</Text>
            <Text style={styles.summaryValue}>
              {selectedDate} {selectedTime}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Estimated Hours</Text>
            <Text style={styles.summaryValue}>{hours} hrs</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>${totalPrice.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Total</Text>
          <Text style={styles.priceValue}>${totalPrice.toFixed(2)}</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, (isSubmitting || bookingLoading) && styles.bookButtonDisabled]}
          onPress={handleBooking}
          activeOpacity={0.8}
          disabled={isSubmitting || bookingLoading}
        >
          {isSubmitting || bookingLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.bookButtonText}>Confirm Booking</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  providerCard: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    padding: 16,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  providerImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginRight: 16,
  },
  providerInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  providerName: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
    marginBottom: 4,
  },
  category: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rate: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: colors.text,
  },
  dateContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCard: {
    flex: 1,
    backgroundColor: colors.card,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedDateCard: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDay: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  dateNumber: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.text,
  },
  selectedDateText: {
    color: '#fff',
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeSlot: {
    backgroundColor: colors.card,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
  },
  selectedTimeSlot: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  selectedTimeText: {
    color: '#fff',
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  notesInput: {
    minHeight: 100,
    paddingTop: 16,
  },
  summaryCard: {
    backgroundColor: colors.card,
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: colors.text,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  priceValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: colors.primary,
  },
  bookButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
  },
  bookButtonDisabled: {
    opacity: 0.6,
  },
});
