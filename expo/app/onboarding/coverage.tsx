import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { MapPin, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useProvider } from '@/contexts/ProviderContext';
import Slider from '@react-native-community/slider';

export default function CoverageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setCoverage } = useProvider();

  const [coverageKm, setCoverageKm] = useState(10);
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    setSaving(true);
    try {
      const result = await setCoverage(coverageKm);
      if (result.success) {
        router.push('/onboarding/bank' as any);
      } else {
        Alert.alert('Error', result.error || 'Failed to set coverage');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Service Coverage',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <MapPin size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Set Your Service Area</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            How far are you willing to travel for jobs?
          </Text>
        </View>

        <View style={[styles.rangeCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.rangeLabel, { color: colors.textSecondary }]}>Service Radius</Text>
          <Text style={[styles.rangeValue, { color: colors.primary }]}>{coverageKm} km</Text>
          
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={50}
            step={5}
            value={coverageKm}
            onValueChange={setCoverageKm}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
          />

          <View style={styles.rangeLabels}>
            <Text style={[styles.rangeLabelText, { color: colors.textLight }]}>5 km</Text>
            <Text style={[styles.rangeLabelText, { color: colors.textLight }]}>50 km</Text>
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            💡 You&apos;ll only receive booking requests from customers within this radius
          </Text>
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.continueButton, { opacity: saving ? 0.5 : 1 }]}
          onPress={handleContinue}
          disabled={saving}
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
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
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
  rangeCard: {
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 24,
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
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
  },
  rangeValue: {
    fontSize: 56,
    fontWeight: '800' as const,
    marginBottom: 32,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  rangeLabelText: {
    fontSize: 13,
    fontWeight: '600' as const,
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
