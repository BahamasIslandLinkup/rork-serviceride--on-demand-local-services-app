import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { Stack, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, User, MapPin, Calendar, ShoppingBag, DollarSign, Ban, AlertCircle } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { banUser } from '@/services/firestore/admin';

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

type Customer = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  island?: string;
  status: string;
  totalBookings?: number;
  totalSpent?: number;
  createdAt?: any;
  lastBookingAt?: any;
};

const STATUS_FILTERS = ['all', 'active', 'suspended', 'banned'] as const;

export default function AdminUsersScreen() {
  const { isAuthenticated, hasPermission, adminUser } = useAdmin();
  const [users, setUsers] = useState<Customer[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<typeof STATUS_FILTERS[number]>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadUsers();
  }, [isAuthenticated]);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, selectedStatus]);

  const loadUsers = async () => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'customer'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        status: 'active',
        ...doc.data(),
      })) as Customer[];
      setUsers(data);
    } catch (error) {
      console.error('[Admin] Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(u => u.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.name?.toLowerCase().includes(query) ||
          u.email?.toLowerCase().includes(query) ||
          u.phone?.toLowerCase().includes(query) ||
          u.id.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const handleBanUser = async (userId: string, userName: string) => {
    if (!adminUser || !hasPermission('users', 'ban')) {
      Alert.alert('Permission Denied', 'You do not have permission to ban users');
      return;
    }

    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Ban',
          style: 'destructive',
          onPress: async () => {
            try {
              await banUser(userId, 'Banned by admin', adminUser.id, adminUser.name);
              Alert.alert('Success', 'User banned successfully');
              loadUsers();
            } catch (error) {
              console.error('[Admin] Failed to ban user:', error);
              Alert.alert('Error', 'Failed to ban user');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return COLORS.success;
      case 'suspended':
        return COLORS.warning;
      case 'banned':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Users',
          headerStyle: { backgroundColor: COLORS.card },
          headerTintColor: COLORS.text,
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.header}>
          <View style={styles.searchContainer}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
            {STATUS_FILTERS.map(status => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.filterButtonActive,
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text
                  style={[
                    styles.filterButtonText,
                    selectedStatus === status && styles.filterButtonTextActive,
                  ]}
                >
                  {status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{filteredUsers.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {filteredUsers.filter(u => u.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.error }]}>
                {filteredUsers.filter(u => u.status === 'banned').length}
              </Text>
              <Text style={styles.statLabel}>Banned</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <User size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'No users match your filters'
                  : 'No users to display'}
              </Text>
            </View>
          ) : (
            filteredUsers.map(user => (
              <View key={user.id} style={styles.userCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.userInfo}>
                    <View style={styles.userNameRow}>
                      <User size={20} color={COLORS.primary} />
                      <Text style={styles.userName}>{user.name}</Text>
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(user.status)}20` }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                      {user.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.infoGrid}>
                  {user.island && (
                    <View style={styles.infoItem}>
                      <MapPin size={14} color={COLORS.textSecondary} />
                      <Text style={styles.infoText}>{user.island}</Text>
                    </View>
                  )}
                  <View style={styles.infoItem}>
                    <ShoppingBag size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>{user.totalBookings || 0} bookings</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <DollarSign size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>${user.totalSpent?.toFixed(0) || 0}</Text>
                  </View>
                  <View style={styles.infoItem}>
                    <Calendar size={14} color={COLORS.textSecondary} />
                    <Text style={styles.infoText}>Joined {formatDate(user.createdAt)}</Text>
                  </View>
                </View>

                {user.lastBookingAt && (
                  <View style={styles.lastActivity}>
                    <AlertCircle size={14} color={COLORS.info} />
                    <Text style={styles.lastActivityText}>Last booking: {formatDate(user.lastBookingAt)}</Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('User Details', `View details for ${user.name}`)}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  {hasPermission('users', 'ban') && user.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleBanUser(user.id, user.name)}
                    >
                      <Ban size={16} color={COLORS.error} />
                      <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Ban</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))
          )}
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
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.text,
  },
  filtersScroll: {
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.background,
    marginRight: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterButtonActive: {
    backgroundColor: `${COLORS.primary}20`,
    borderColor: COLORS.primary,
  },
  filterButtonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
  },
  filterButtonTextActive: {
    color: COLORS.primary,
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500' as const,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  userCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  userInfo: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    backgroundColor: `${COLORS.info}15`,
    borderRadius: 8,
    marginBottom: 12,
  },
  lastActivityText: {
    fontSize: 12,
    color: COLORS.info,
    fontWeight: '500' as const,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: `${COLORS.primary}20`,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  actionButtonDanger: {
    backgroundColor: `${COLORS.error}20`,
    borderColor: COLORS.error,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.primary,
  },
});
