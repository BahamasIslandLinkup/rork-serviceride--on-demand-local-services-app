import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CheckCircle2, Circle, AlertCircle, Rocket } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { LinearGradient } from 'expo-linear-gradient';

type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  category: 'setup' | 'auth' | 'core' | 'realtime';
  priority: 'critical' | 'high' | 'medium';
};

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: 'firebase-auth-enabled',
    title: 'Enable Firebase Authentication',
    description: 'Email/Password enabled in Firebase Console',
    category: 'setup',
    priority: 'critical',
  },
  {
    id: 'firestore-created',
    title: 'Create Firestore Database',
    description: 'Database created in test mode',
    category: 'setup',
    priority: 'critical',
  },
  {
    id: 'security-rules',
    title: 'Update Security Rules',
    description: 'Firestore rules configured',
    category: 'setup',
    priority: 'critical',
  },
  {
    id: 'signup-test',
    title: 'Test Sign Up',
    description: 'Create new account successfully',
    category: 'auth',
    priority: 'critical',
  },
  {
    id: 'login-test',
    title: 'Test Login',
    description: 'Login with existing account',
    category: 'auth',
    priority: 'critical',
  },
  {
    id: 'logout-test',
    title: 'Test Logout',
    description: 'Logout and return to login screen',
    category: 'auth',
    priority: 'critical',
  },
  {
    id: 'browse-services',
    title: 'Browse Services',
    description: 'View and navigate service categories',
    category: 'core',
    priority: 'high',
  },
  {
    id: 'search-test',
    title: 'Test Search',
    description: 'Search for services and apply filters',
    category: 'core',
    priority: 'high',
  },
  {
    id: 'create-booking',
    title: 'Create Booking',
    description: 'Complete booking flow',
    category: 'core',
    priority: 'high',
  },
  {
    id: 'view-bookings',
    title: 'View Bookings',
    description: 'Check bookings list',
    category: 'core',
    priority: 'high',
  },
  {
    id: 'send-message',
    title: 'Send Message',
    description: 'Test messaging functionality',
    category: 'realtime',
    priority: 'medium',
  },
  {
    id: 'notifications',
    title: 'Check Notifications',
    description: 'View and interact with notifications',
    category: 'realtime',
    priority: 'medium',
  },
];

export default function TestingChecklistScreen() {
  const { colors } = useTheme();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setCompleted((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getCategoryItems = (category: ChecklistItem['category']) => {
    return CHECKLIST_ITEMS.filter((item) => item.category === category);
  };

  const getCategoryProgress = (category: ChecklistItem['category']) => {
    const items = getCategoryItems(category);
    const completedItems = items.filter((item) => completed.has(item.id));
    return {
      completed: completedItems.length,
      total: items.length,
      percentage: Math.round((completedItems.length / items.length) * 100),
    };
  };

  const totalProgress = {
    completed: completed.size,
    total: CHECKLIST_ITEMS.length,
    percentage: Math.round((completed.size / CHECKLIST_ITEMS.length) * 100),
  };

  const getPriorityColor = (priority: ChecklistItem['priority']) => {
    switch (priority) {
      case 'critical':
        return colors.error;
      case 'high':
        return colors.warning || '#FF9500';
      case 'medium':
        return colors.primary;
      default:
        return colors.textSecondary;
    }
  };

  const renderCategory = (
    category: ChecklistItem['category'],
    title: string,
    icon: string
  ) => {
    const items = getCategoryItems(category);
    const progress = getCategoryProgress(category);

    return (
      <View key={category} style={styles.categoryContainer}>
        <View style={styles.categoryHeader}>
          <Text style={[styles.categoryTitle, { color: colors.text }]}>
            {icon} {title}
          </Text>
          <View
            style={[
              styles.progressBadge,
              { backgroundColor: `${colors.primary}20` },
            ]}
          >
            <Text style={[styles.progressText, { color: colors.primary }]}>
              {progress.completed}/{progress.total}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.progressBarContainer,
            { backgroundColor: colors.border },
          ]}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFill,
              { width: `${progress.percentage}%` },
            ]}
          />
        </View>

        {items.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={[
              styles.checklistItem,
              {
                backgroundColor: colors.card,
                borderColor: completed.has(item.id)
                  ? colors.primary
                  : colors.border,
              },
            ]}
            onPress={() => toggleItem(item.id)}
            activeOpacity={0.7}
          >
            <View style={styles.checklistItemLeft}>
              {completed.has(item.id) ? (
                <CheckCircle2 size={24} color={colors.primary} />
              ) : (
                <Circle size={24} color={colors.textLight} />
              )}
              <View style={styles.checklistItemText}>
                <Text
                  style={[
                    styles.checklistItemTitle,
                    {
                      color: completed.has(item.id)
                        ? colors.textSecondary
                        : colors.text,
                      textDecorationLine: completed.has(item.id)
                        ? 'line-through'
                        : 'none',
                    },
                  ]}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.checklistItemDescription, { color: colors.textLight }]}
                >
                  {item.description}
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.priorityDot,
                { backgroundColor: getPriorityColor(item.priority) },
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  const handleComplete = () => {
    if (totalProgress.percentage === 100) {
      Alert.alert(
        '🎉 Congratulations!',
        'You have completed all testing tasks! Your app is ready for production.',
        [{ text: 'Awesome!', style: 'default' }]
      );
    } else {
      Alert.alert(
        '⚠️ Not Complete',
        `You have completed ${totalProgress.completed} out of ${totalProgress.total} tasks (${totalProgress.percentage}%). Keep going!`,
        [{ text: 'OK', style: 'default' }]
      );
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top', 'bottom']}
    >
      <Stack.Screen
        options={{
          title: 'Testing Checklist',
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
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerGradient}
          >
            <Rocket size={32} color="#1E1E1E" />
          </LinearGradient>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Live Testing Progress
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Complete all tasks to ensure app quality
          </Text>
        </View>

        <View
          style={[
            styles.overallProgress,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.overallProgressHeader}>
            <Text style={[styles.overallProgressTitle, { color: colors.text }]}>
              Overall Progress
            </Text>
            <Text
              style={[styles.overallProgressPercentage, { color: colors.primary }]}
            >
              {totalProgress.percentage}%
            </Text>
          </View>
          <View
            style={[
              styles.overallProgressBarContainer,
              { backgroundColor: colors.border },
            ]}
          >
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.overallProgressBarFill,
                { width: `${totalProgress.percentage}%` },
              ]}
            />
          </View>
          <Text style={[styles.overallProgressText, { color: colors.textLight }]}>
            {totalProgress.completed} of {totalProgress.total} tasks completed
          </Text>
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.error }]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Critical
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                { backgroundColor: colors.warning || '#FF9500' },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              High
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[styles.legendDot, { backgroundColor: colors.primary }]}
            />
            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
              Medium
            </Text>
          </View>
        </View>

        {renderCategory('setup', 'Firebase Setup', '🔥')}
        {renderCategory('auth', 'Authentication', '🔐')}
        {renderCategory('core', 'Core Features', '⚡')}
        {renderCategory('realtime', 'Real-time Features', '🔄')}

        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleComplete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.completeButtonGradient}
          >
            <AlertCircle size={20} color="#1E1E1E" />
            <Text style={styles.completeButtonText}>Check Progress</Text>
          </LinearGradient>
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
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    textAlign: 'center',
  },
  overallProgress: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  overallProgressTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  overallProgressPercentage: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  overallProgressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  overallProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  overallProgressText: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 24,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  categoryContainer: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  progressBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700' as const,
  },
  progressBarContainer: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  checklistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  checklistItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  checklistItemText: {
    flex: 1,
  },
  checklistItemTitle: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 2,
  },
  checklistItemDescription: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  completeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  completeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
