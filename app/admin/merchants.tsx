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
import { Search, Store, Star, DollarSign, TrendingUp, AlertCircle, CheckCircle, Ban } from 'lucide-react-native';
import { useAdmin } from '@/contexts/AdminContext';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { suspendMerchant } from '@/services/firestore/admin';

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

type Merchant = {
  id: string;
  name: string;
  email: string;
  businessName?: string;
  status: string;
  kycStatus?: string;
  rating?: number;
  totalEarnings?: number;
  completedBookings?: number;
  island?: string;
};

const STATUS_FILTERS = ['all', 'active', 'pending', 'suspended', 'banned'] as const;

export default function AdminMerchantsScreen() {
  const { isAuthenticated, hasPermission, adminUser } = useAdmin();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filteredMerchants, setFilteredMerchants] = useState<Merchant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<typeof STATUS_FILTERS[number]>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/admin/login' as any);
      return;
    }
    loadMerchants();
  }, [isAuthenticated]);

  useEffect(() => {
    filterMerchants();
  }, [merchants, searchQuery, selectedStatus]);

  const loadMerchants = async () => {
    try {
      setIsLoading(true);
      const q = query(
        collection(db, 'users'),
        where('userType', '==', 'provider'),
        limit(100)
      );
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Merchant[];
      setMerchants(data);
    } catch (error) {
      console.error('[Admin] Failed to load merchants:', error);
      Alert.alert('Error', 'Failed to load merchants');
    } finally {
      setIsLoading(false);
    }
  };

  const filterMerchants = () => {
    let filtered = merchants;

    if (selectedStatus !== 'all') {
      filtered = filtered.filter(m => m.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        m =>
          m.name?.toLowerCase().includes(query) ||
          m.email?.toLowerCase().includes(query) ||
          m.businessName?.toLowerCase().includes(query) ||
          m.id.toLowerCase().includes(query)
      );
    }

    setFilteredMerchants(filtered);
  };

  const handleSuspendMerchant = async (merchantId: string, merchantName: string) => {
    if (!adminUser || !hasPermission('merchants', 'suspend')) {
      Alert.alert('Permission Denied', 'You do not have permission to suspend merchants');
      return;
    }

    Alert.alert(
      'Suspend Merchant',
      `Are you sure you want to suspend ${merchantName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Suspend',
          style: 'destructive',
          onPress: async () => {
            try {
              await suspendMerchant(merchantId, 'Suspended by admin', adminUser.id, adminUser.name);
              Alert.alert('Success', 'Merchant suspended successfully');
              loadMerchants();
            } catch (error) {
              console.error('[Admin] Failed to suspend merchant:', error);
              Alert.alert('Error', 'Failed to suspend merchant');
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
      case 'pending':
        return COLORS.warning;
      case 'suspended':
        return COLORS.error;
      case 'banned':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
  };

  const getKYCStatusColor = (kycStatus?: string) => {
    switch (kycStatus) {
      case 'approved':
        return COLORS.success;
      case 'pending':
        return COLORS.warning;
      case 'rejected':
        return COLORS.error;
      default:
        return COLORS.textSecondary;
    }
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
          title: 'Merchants',
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
              placeholder="Search merchants..."
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
              <Text style={styles.statValue}>{filteredMerchants.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>
                {filteredMerchants.filter(m => m.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>
                {filteredMerchants.filter(m => m.kycStatus === 'pending').length}
              </Text>
              <Text style={styles.statLabel}>Pending KYC</Text>
            </View>
          </View>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {filteredMerchants.length === 0 ? (
            <View style={styles.emptyState}>
              <Store size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery || selectedStatus !== 'all'
                  ? 'No merchants match your filters'
                  : 'No merchants to display'}
              </Text>
            </View>
          ) : (
            filteredMerchants.map(merchant => (
              <View key={merchant.id} style={styles.merchantCard}>
                <View style={styles.cardHeader}>
                  <View style={styles.merchantInfo}>
                    <View style={styles.merchantNameRow}>
                      <Store size={20} color={COLORS.primary} />
                      <Text style={styles.merchantName}>{merchant.businessName || merchant.name}</Text>
                    </View>
                    <Text style={styles.merchantEmail}>{merchant.email}</Text>
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(merchant.status)}20` }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(merchant.status) }]}>
                        {merchant.status}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.kpiRow}>
                  <View style={styles.kpi}>
                    <Star size={16} color={COLORS.primary} />
                    <Text style={styles.kpiValue}>{merchant.rating?.toFixed(1) || 'N/A'}</Text>
                  </View>
                  <View style={styles.kpi}>
                    <TrendingUp size={16} color={COLORS.success} />
                    <Text style={styles.kpiValue}>{merchant.completedBookings || 0} jobs</Text>
                  </View>
                  <View style={styles.kpi}>
                    <DollarSign size={16} color={COLORS.primary} />
                    <Text style={styles.kpiValue}>${merchant.totalEarnings?.toFixed(0) || 0}</Text>
                  </View>
                </View>

                {merchant.kycStatus && (
                  <View style={styles.kycRow}>
                    {merchant.kycStatus === 'approved' ? (
                      <CheckCircle size={16} color={COLORS.success} />
                    ) : merchant.kycStatus === 'rejected' ? (
                      <AlertCircle size={16} color={COLORS.error} />
                    ) : (
                      <AlertCircle size={16} color={COLORS.warning} />
                    )}
                    <Text style={[styles.kycText, { color: getKYCStatusColor(merchant.kycStatus) }]}>
                      KYC: {merchant.kycStatus}
                    </Text>
                  </View>
                )}

                <View style={styles.cardActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => Alert.alert('Merchant Details', `View details for ${merchant.name}`)}
                  >
                    <Text style={styles.actionButtonText}>View Details</Text>
                  </TouchableOpacity>
                  {hasPermission('merchants', 'suspend') && merchant.status === 'active' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.actionButtonDanger]}
                      onPress={() => handleSuspendMerchant(merchant.id, merchant.name)}
                    >
                      <Ban size={16} color={COLORS.error} />
                      <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Suspend</Text>
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
  merchantCard: {
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
  merchantInfo: {
    flex: 1,
  },
  merchantNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: COLORS.text,
  },
  merchantEmail: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  badges: {
    gap: 4,
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
  kpiRow: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 12,
  },
  kpi: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  kpiValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: COLORS.text,
  },
  kycRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  kycText: {
    fontSize: 13,
    fontWeight: '600' as const,
    textTransform: 'capitalize' as const,
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
