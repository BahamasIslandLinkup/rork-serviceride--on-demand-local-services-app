import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Calendar, Clock, ChevronRight, CheckCircle } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';

interface TimeSlot {
  start: string;
  end: string;
}

interface DayAvailability {
  day: string;
  enabled: boolean;
  slots: TimeSlot[];
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const DEFAULT_SLOT: TimeSlot = { start: '09:00', end: '17:00' };

export default function AvailabilityScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [availability, setAvailability] = useState<DayAvailability[]>(
    DAYS.map(day => ({
      day,
      enabled: day !== 'Sunday',
      slots: [DEFAULT_SLOT],
    }))
  );
  const [saving, setSaving] = useState(false);

  const toggleDay = (index: number) => {
    setAvailability(prev =>
      prev.map((item, i) =>
        i === index ? { ...item, enabled: !item.enabled } : item
      )
    );
  };

  const handleContinue = async () => {
    const enabledDays = availability.filter(d => d.enabled);
    if (enabledDays.length === 0) {
      Alert.alert('No Availability', 'Please select at least one day');
      return;
    }

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/onboarding/complete' as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Availability',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Calendar size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Set Your Availability</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Choose the days and times you're available to work
          </Text>
        </View>

        <View style={styles.daysContainer}>
          {availability.map((item, index) => (
            <View
              key={item.day}
              style={[
                styles.dayCard,
                {
                  backgroundColor: colors.card,
                  borderColor: item.enabled ? colors.primary : colors.border,
                  borderWidth: item.enabled ? 2 : 1,
                },
              ]}
            >
              <TouchableOpacity
                style={styles.dayHeader}
                onPress={() => toggleDay(index)}
                activeOpacity={0.7}
              >
                <View style={styles.dayInfo}>
                  <Text style={[styles.dayName, { color: colors.text }]}>{item.day}</Text>
                  {item.enabled && (
                    <View style={styles.timeRange}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={[styles.timeText, { color: colors.textSecondary }]}>
                        {item.slots[0].start} - {item.slots[0].end}
                      </Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.checkbox,
                    {
                      backgroundColor: item.enabled ? colors.primary : colors.background,
                      borderColor: item.enabled ? colors.primary : colors.border,
                    },
                  ]}
                >
                  {item.enabled && <CheckCircle size={20} color="#1E1E1E" strokeWidth={3} />}
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            You can customize your hours for each day later in your profile settings
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            { opacity: availability.some(d => d.enabled) && !saving ? 1 : 0.5 },
          ]}
          onPress={handleContinue}
          disabled={!availability.some(d => d.enabled) || saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <ChevronRight size={20} color="#1E1E1E" strokeWidth={3} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
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
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  daysContainer: {
    gap: 12,
    marginBottom: 24,
  },
  dayCard: {
    borderRadius: 16,
    overflow: 'hidden',
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
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 17,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  timeRange: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 20,
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
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
