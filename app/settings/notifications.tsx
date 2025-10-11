import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Bell, MessageCircle, Calendar, AlertCircle, DollarSign, Tag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useNotifications } from '@/contexts/NotificationContext';
import type { NotificationCategory } from '@/types';

const categoryInfo: Record<NotificationCategory, { icon: any; label: string; description: string }> = {
  booking: {
    icon: Calendar,
    label: 'Bookings',
    description: 'Updates about your bookings and appointments',
  },
  message: {
    icon: MessageCircle,
    label: 'Messages',
    description: 'New messages from providers or customers',
  },
  dispute: {
    icon: AlertCircle,
    label: 'Disputes',
    description: 'Updates on dispute cases and resolutions',
  },
  payment: {
    icon: DollarSign,
    label: 'Payments',
    description: 'Payment confirmations and receipts',
  },
  promotion: {
    icon: Tag,
    label: 'Promotions',
    description: 'Special offers and promotional content',
  },
  system: {
    icon: Bell,
    label: 'System',
    description: 'Important system updates and announcements',
  },
};

export default function NotificationSettingsScreen() {
  const { colors } = useTheme();
  const { settings, updateSettings, updateCategorySettings } = useNotifications();

  const handleTogglePush = async (value: boolean) => {
    await updateSettings({ pushEnabled: value });
  };

  const handleToggleCategory = async (category: NotificationCategory, value: boolean) => {
    await updateCategorySettings(category, value);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Bell size={24} color={colors.primary} />
            <View style={styles.sectionHeaderText}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Push Notifications</Text>
              <Text style={[styles.sectionDescription, { color: colors.textSecondary }]}>
                Enable or disable all push notifications
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={handleTogglePush}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={settings.pushEnabled ? colors.primary : colors.textSecondary}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        <View style={styles.categoriesSection}>
          <Text style={[styles.categoriesTitle, { color: colors.text }]}>Notification Categories</Text>
          <Text style={[styles.categoriesDescription, { color: colors.textSecondary }]}>
            Choose which types of notifications you want to receive
          </Text>

          {(Object.keys(categoryInfo) as NotificationCategory[]).map((category) => {
            const info = categoryInfo[category];
            const Icon = info.icon;
            const isEnabled = settings.categories[category];

            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryItem,
                  { backgroundColor: colors.card },
                  !settings.pushEnabled && styles.categoryItemDisabled,
                ]}
                onPress={() => settings.pushEnabled && handleToggleCategory(category, !isEnabled)}
                disabled={!settings.pushEnabled}
                activeOpacity={0.7}
                accessibilityRole="switch"
                accessibilityState={{ checked: isEnabled, disabled: !settings.pushEnabled }}
                accessibilityLabel={`${info.label} notifications`}
              >
                <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
                  <Icon size={20} color={colors.primary} />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={[styles.categoryLabel, { color: colors.text }]}>{info.label}</Text>
                  <Text style={[styles.categoryDescription, { color: colors.textSecondary }]}>
                    {info.description}
                  </Text>
                </View>
                <Switch
                  value={isEnabled}
                  onValueChange={(value) => handleToggleCategory(category, value)}
                  disabled={!settings.pushEnabled}
                  trackColor={{ false: colors.border, true: colors.primary + '60' }}
                  thumbColor={isEnabled ? colors.primary : colors.textSecondary}
                  ios_backgroundColor={colors.border}
                />
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <AlertCircle size={20} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            You can change these settings at any time. Critical notifications like security alerts will always be sent.
          </Text>
        </View>
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
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  sectionDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  categoriesTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  categoriesDescription: {
    fontSize: 13,
    marginBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  categoryItemDisabled: {
    opacity: 0.5,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
  },
  categoryLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  categoryDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});
