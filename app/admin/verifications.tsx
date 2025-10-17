import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
  TextInput,
  Modal,
} from 'react-native';
import { Stack } from 'expo-router';
import { CheckCircle, XCircle, Eye, X } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { collection, query, where, getDocs, doc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import type { User, GovernmentID, BusinessLicense, VerificationBadge } from '@/types';

type PendingProvider = User & {
  pendingSince: string;
};

export default function AdminVerificationsScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [pendingProviders, setPendingProviders] = useState<PendingProvider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<PendingProvider | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    loadPendingProviders();
  }, []);

  const loadPendingProviders = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('role', '==', 'provider'),
        where('kycStatus', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const providers: PendingProvider[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          pendingSince: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        } as PendingProvider;
      });

      setPendingProviders(providers);
    } catch (error) {
      console.error('[Admin] Failed to load pending providers:', error);
      Alert.alert('Error', 'Failed to load pending verifications');
    } finally {
      setLoading(false);
    }
  };

  const approveProvider = async (provider: PendingProvider) => {
    try {
      setActionLoading(true);

      const badges: VerificationBadge[] = [];
      
      if (provider.businessLicense) {
        badges.push({
          type: 'verified_business',
          awardedAt: new Date().toISOString(),
        });
      }
      
      badges.push({
        type: 'identity_verified',
        awardedAt: new Date().toISOString(),
      });
      
      badges.push({
        type: 'approved_technician',
        awardedAt: new Date().toISOString(),
      });

      const userRef = doc(db, 'users', provider.id);
      await updateDoc(userRef, {
        kycStatus: 'approved',
        verified: true,
        verificationBadges: badges,
        approvedAt: Timestamp.now(),
        verificationRejectionReason: null,
      });

      Alert.alert('Success', `${provider.name} has been approved`, [
        { text: 'OK', onPress: () => {
          setSelectedProvider(null);
          loadPendingProviders();
        }}
      ]);
    } catch (error) {
      console.error('[Admin] Failed to approve provider:', error);
      Alert.alert('Error', 'Failed to approve provider');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectProvider = async () => {
    if (!selectedProvider || !rejectionReason.trim()) {
      Alert.alert('Error', 'Please provide a rejection reason');
      return;
    }

    try {
      setActionLoading(true);

      const userRef = doc(db, 'users', selectedProvider.id);
      await updateDoc(userRef, {
        kycStatus: 'rejected',
        verified: false,
        verificationBadges: [],
        verificationRejectionReason: rejectionReason,
      });

      Alert.alert('Rejected', `${selectedProvider.name} has been rejected`, [
        { text: 'OK', onPress: () => {
          setSelectedProvider(null);
          setShowRejectModal(false);
          setRejectionReason('');
          loadPendingProviders();
        }}
      ]);
    } catch (error) {
      console.error('[Admin] Failed to reject provider:', error);
      Alert.alert('Error', 'Failed to reject provider');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Stack.Screen
          options={{
            title: 'Verifications',
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Loading pending verifications...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Verifications',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {pendingProviders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No pending verifications
            </Text>
          </View>
        ) : (
          pendingProviders.map((provider) => (
            <View key={provider.id} style={[styles.providerCard, { backgroundColor: colors.card }]}>
              <View style={styles.providerHeader}>
                <Image
                  source={{
                    uri: provider.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80'
                  }}
                  style={styles.avatar}
                />
                <View style={styles.providerInfo}>
                  <Text style={[styles.providerName, { color: colors.text }]}>
                    {provider.name}
                  </Text>
                  <Text style={[styles.providerEmail, { color: colors.textSecondary }]}>
                    {provider.email}
                  </Text>
                  <Text style={[styles.providerDate, { color: colors.textLight }]}>
                    Submitted {new Date(provider.pendingSince).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.providerActions}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.viewButton, { backgroundColor: colors.primary }]}
                  onPress={() => setSelectedProvider(provider)}
                >
                  <Eye size={18} color="#1E1E1E" />
                  <Text style={styles.viewButtonText}>Review</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <Modal
        visible={selectedProvider !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedProvider(null)}
      >
        {selectedProvider && (
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Review Application</Text>
              <TouchableOpacity onPress={() => setSelectedProvider(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Provider Information</Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Name: {selectedProvider.name}
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Email: {selectedProvider.email}
                </Text>
                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                  Phone: {selectedProvider.phone}
                </Text>
                {selectedProvider.businessName && (
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Business: {selectedProvider.businessName}
                  </Text>
                )}
              </View>

              {selectedProvider.governmentId && (
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Government ID</Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    ID Number: {selectedProvider.governmentId.idNumber}
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Expiry: {selectedProvider.governmentId.expiryDate}
                  </Text>
                  <View style={styles.documentImages}>
                    <Image
                      source={{ uri: selectedProvider.governmentId.frontImageUri }}
                      style={styles.documentImage}
                    />
                    <Image
                      source={{ uri: selectedProvider.governmentId.backImageUri }}
                      style={styles.documentImage}
                    />
                  </View>
                </View>
              )}

              {selectedProvider.businessLicense && (
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Business License</Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    License #: {selectedProvider.businessLicense.licenseNumber}
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Business: {selectedProvider.businessLicense.businessName}
                  </Text>
                  <Image
                    source={{ uri: selectedProvider.businessLicense.imageUri }}
                    style={styles.licenseImage}
                  />
                </View>
              )}

              {selectedProvider.vehicleInfo && (
                <View style={[styles.section, { backgroundColor: colors.card }]}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Information</Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    {selectedProvider.vehicleInfo.year} {selectedProvider.vehicleInfo.make} {selectedProvider.vehicleInfo.model}
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Color: {selectedProvider.vehicleInfo.color}
                  </Text>
                  <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                    Plate: {selectedProvider.vehicleInfo.licensePlate}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.rejectButton, { backgroundColor: colors.error }]}
                onPress={() => setShowRejectModal(true)}
                disabled={actionLoading}
              >
                <XCircle size={20} color="#fff" />
                <Text style={styles.modalButtonText}>Reject</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.approveButton, { backgroundColor: colors.success }]}
                onPress={() => approveProvider(selectedProvider)}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.modalButtonText}>Approve</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>

      <Modal
        visible={showRejectModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.rejectModalOverlay}>
          <View style={[styles.rejectModalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.rejectModalTitle, { color: colors.text }]}>Rejection Reason</Text>
            <Text style={[styles.rejectModalSubtitle, { color: colors.textSecondary }]}>
              Please provide a reason for rejecting this application
            </Text>
            <TextInput
              style={[styles.rejectInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter reason..."
              placeholderTextColor={colors.textSecondary}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <View style={styles.rejectModalActions}>
              <TouchableOpacity
                style={[styles.rejectModalButton, { backgroundColor: colors.border }]}
                onPress={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                }}
              >
                <Text style={[styles.rejectModalButtonText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rejectModalButton, { backgroundColor: colors.error }]}
                onPress={rejectProvider}
                disabled={actionLoading || !rejectionReason.trim()}
              >
                {actionLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={[styles.rejectModalButtonText, { color: '#fff' }]}>Reject</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500' as const,
    marginTop: 16,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  providerCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 16,
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
  providerHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  providerInfo: {
    flex: 1,
  },
  providerName: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  providerEmail: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  providerDate: {
    fontSize: 12,
    fontWeight: '500' as const,
  },
  providerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 10,
  },
  viewButton: {
  },
  viewButtonText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 8,
  },
  documentImages: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  documentImage: {
    width: 150,
    height: 100,
    borderRadius: 8,
  },
  licenseImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 12,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
  },
  rejectButton: {
  },
  approveButton: {
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
  rejectModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  rejectModalContent: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    borderRadius: 16,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  rejectModalSubtitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  rejectInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500' as const,
    minHeight: 100,
    marginBottom: 16,
  },
  rejectModalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  rejectModalButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
