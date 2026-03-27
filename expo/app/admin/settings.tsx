import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Settings,
  DollarSign,
  Clock,
  Shield,
  Database,
  Bell,
  Zap,
  ChevronRight,
} from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';

const COLORS = {
  background: '#0A0F1C',
  card: '#1A1F2E',
  primary: '#D4AF37',
  text: '#FFFFFF',
  textSecondary: '#A0A0A0',
  border: '#2A2F3E',
  success: '#4CAF50',
  warning: '#FF9800',
  error: '#FF4444',
  info: '#2196F3',
};

export default function AdminSettingsScreen() {
  const { isAuthenticated, hasPermission } = useAdmin();
  const [commissionRate, setCommissionRate] = useState('4');
  const [discoveryFee, setDiscoveryFee] = useState('7.50');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
    }
  }, [isAuthenticated]);

  const handleSaveSettings = () => {
    if (!hasPermission('settings', 'update')) {
      Alert.alert('Permission Denied', 'You do not have permission to update settings');
      return;
    }
    Alert.alert('Success', 'Settings saved successfully');
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Settings',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <DollarSign size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Platform Fees</Text>
            </View>
            <View style={styles.settingCard}>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Commission Rate (%)</Text>
                <TextInput
                  style={styles.settingInput}
                  value={commissionRate}
                  onChangeText={setCommissionRate}
                  keyboardType="numeric"
                  placeholder="4.0"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
              <View style={styles.settingRow}>
                <Text style={styles.settingLabel}>Discovery Fee ($)</Text>
                <TextInput
                  style={styles.settingInput}
                  value={discoveryFee}
                  onChangeText={setDiscoveryFee}
                  keyboardType="numeric"
                  placeholder="7.50"
                  placeholderTextColor={COLORS.textSecondary}
                />
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Clock size={24} color={COLORS.info} />
              <Text style={styles.sectionTitle}>SLA Settings</Text>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('SLA Settings', 'Configure SLA response times')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Response Time SLAs</Text>
                <Text style={styles.menuItemSubtitle}>Configure ticket response times</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Resolution SLAs', 'Configure resolution times')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Resolution Time SLAs</Text>
                <Text style={styles.menuItemSubtitle}>Configure ticket resolution times</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Shield size={24} color={COLORS.success} />
              <Text style={styles.sectionTitle}>Security</Text>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Role Permissions', 'Configure role permissions')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Role Permissions</Text>
                <Text style={styles.menuItemSubtitle}>Configure admin role permissions</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('IP Allowlist', 'Configure IP restrictions')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>IP Allowlist</Text>
                <Text style={styles.menuItemSubtitle}>Restrict admin access by IP</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('MFA Settings', 'Configure multi-factor authentication')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Multi-Factor Auth</Text>
                <Text style={styles.menuItemSubtitle}>Require MFA for admin accounts</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Database size={24} color={COLORS.warning} />
              <Text style={styles.sectionTitle}>Data Retention</Text>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Retention Policy', 'Configure data retention periods')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Retention Policies</Text>
                <Text style={styles.menuItemSubtitle}>Configure data retention periods</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Audit Logs', 'View audit log settings')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Audit Log Settings</Text>
                <Text style={styles.menuItemSubtitle}>Configure audit log retention</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Bell size={24} color={COLORS.info} />
              <Text style={styles.sectionTitle}>Notifications</Text>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Email Templates', 'Configure email templates')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Email Templates</Text>
                <Text style={styles.menuItemSubtitle}>Manage notification templates</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('SMS Settings', 'Configure SMS notifications')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>SMS Notifications</Text>
                <Text style={styles.menuItemSubtitle}>Configure SMS delivery</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Zap size={24} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Feature Flags</Text>
            </View>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => Alert.alert('Feature Flags', 'Manage feature flags')}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuItemTitle}>Manage Feature Flags</Text>
                <Text style={styles.menuItemSubtitle}>Toggle features on/off</Text>
              </View>
              <ChevronRight size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          {hasPermission('settings', 'update') && (
            <View style={styles.section}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveSettings}>
                <Settings size={20} color={COLORS.background} />
                <Text style={styles.saveButtonText}>Save Settings</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.dangerZone}>
            <Text style={styles.dangerZoneTitle}>Danger Zone</Text>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() => Alert.alert('Clear Cache', 'This will clear all cached data')}
            >
              <Text style={styles.dangerButtonText}>Clear Cache</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.dangerButton}
              onPress={() =>
                Alert.alert(
                  'Export Data',
                  'Export all platform data for backup',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Export', onPress: () => Alert.alert('Exporting...', 'This may take a while') },
                  ]
                )
              }
            >
              <Text style={styles.dangerButtonText}>Export All Data</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  settingCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '600' as const,
  },
  settingInput: {
    width: 100,
    padding: 10,
    backgroundColor: COLORS.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '600' as const,
    textAlign: 'right' as const,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 8,
  },
  menuItemLeft: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.background,
  },
  dangerZone: {
    padding: 16,
    marginTop: 16,
    borderTopWidth: 2,
    borderTopColor: COLORS.error,
  },
  dangerZoneTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.error,
    marginBottom: 16,
  },
  dangerButton: {
    padding: 16,
    backgroundColor: `${COLORS.error}20`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.error,
    marginBottom: 8,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: COLORS.error,
    textAlign: 'center' as const,
  },
});
