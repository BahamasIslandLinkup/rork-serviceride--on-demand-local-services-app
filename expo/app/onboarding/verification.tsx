import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { 
  Upload, 
  FileText, 
  IdCard, 
  Building2, 

  CheckCircle,
  AlertCircle 
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { StorageService } from '@/services/storage';
import type { GovernmentID, BusinessLicense } from '@/types';

export default function VerificationScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [govId, setGovId] = useState<Partial<GovernmentID>>({
    idNumber: user?.governmentId?.idNumber || '',
    frontImageUri: user?.governmentId?.frontImageUri || '',
    backImageUri: user?.governmentId?.backImageUri || '',
    expiryDate: user?.governmentId?.expiryDate || '',
  });
  
  const [businessLic, setBusinessLic] = useState<Partial<BusinessLicense>>({
    licenseNumber: user?.businessLicense?.licenseNumber || '',
    businessName: user?.businessLicense?.businessName || '',
    imageUri: user?.businessLicense?.imageUri || '',
    expiryDate: user?.businessLicense?.expiryDate || '',
  });

  const handleUploadImage = async (field: 'govIdFront' | 'govIdBack' | 'businessLic') => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in again.');
      return;
    }

    try {
      setUploadingField(field);
      const result = await StorageService.pickAndUploadImage(
        `verification/${user.id}/${field}`,
        {
          allowsEditing: true,
          aspect: [4, 3],
          quality: 0.9,
        }
      );

      if (!result) {
        setUploadingField(null);
        return;
      }

      if (field === 'govIdFront') {
        setGovId(prev => ({ ...prev, frontImageUri: result.url }));
      } else if (field === 'govIdBack') {
        setGovId(prev => ({ ...prev, backImageUri: result.url }));
      } else if (field === 'businessLic') {
        setBusinessLic(prev => ({ ...prev, imageUri: result.url }));
      }
    } catch (error) {
      console.error('[Verification] Upload failed:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const validateForm = () => {
    if (!govId.idNumber?.trim()) {
      Alert.alert('Missing Info', 'Please enter your ID number');
      return false;
    }
    if (!govId.frontImageUri) {
      Alert.alert('Missing Info', 'Please upload front of ID');
      return false;
    }
    if (!govId.backImageUri) {
      Alert.alert('Missing Info', 'Please upload back of ID');
      return false;
    }
    if (!govId.expiryDate) {
      Alert.alert('Missing Info', 'Please enter ID expiry date');
      return false;
    }
    if (!businessLic.licenseNumber?.trim()) {
      Alert.alert('Missing Info', 'Please enter business license number');
      return false;
    }
    if (!businessLic.businessName?.trim()) {
      Alert.alert('Missing Info', 'Please enter business name');
      return false;
    }
    if (!businessLic.imageUri) {
      Alert.alert('Missing Info', 'Please upload business license');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const governmentId: GovernmentID = {
        idNumber: govId.idNumber!,
        frontImageUri: govId.frontImageUri!,
        backImageUri: govId.backImageUri!,
        expiryDate: govId.expiryDate!,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      const businessLicense: BusinessLicense = {
        licenseNumber: businessLic.licenseNumber!,
        businessName: businessLic.businessName!,
        imageUri: businessLic.imageUri!,
        expiryDate: businessLic.expiryDate,
        uploadedAt: new Date().toISOString(),
        status: 'pending',
      };

      await updateProfile({
        governmentId,
        businessLicense,
        businessName: businessLic.businessName,
        kycStatus: 'pending',
      });

      router.push('/onboarding/profile' as any);
    } catch (error) {
      console.error('[Verification] Submit failed:', error);
      Alert.alert('Error', 'Failed to submit documents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Verification',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
          <AlertCircle size={24} color={colors.primary} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Your documents will be reviewed by our team. You'll be notified once approved. Only approved providers can accept bookings.
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <IdCard size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Government ID
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>ID Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter your ID number"
              placeholderTextColor={colors.textSecondary}
              value={govId.idNumber}
              onChangeText={(text) => setGovId(prev => ({ ...prev, idNumber: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Expiry Date</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={govId.expiryDate}
              onChangeText={(text) => setGovId(prev => ({ ...prev, expiryDate: text }))}
            />
          </View>

          <View style={styles.uploadRow}>
            <View style={styles.uploadItem}>
              <Text style={[styles.label, { color: colors.text }]}>Front of ID</Text>
              <TouchableOpacity
                style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleUploadImage('govIdFront')}
                disabled={uploadingField === 'govIdFront'}
              >
                {uploadingField === 'govIdFront' ? (
                  <ActivityIndicator color={colors.primary} />
                ) : govId.frontImageUri ? (
                  <>
                    <Image source={{ uri: govId.frontImageUri }} style={styles.uploadedImage} />
                    <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                      <CheckCircle size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <>
                    <Upload size={32} color={colors.textSecondary} />
                    <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                      Tap to upload
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            <View style={styles.uploadItem}>
              <Text style={[styles.label, { color: colors.text }]}>Back of ID</Text>
              <TouchableOpacity
                style={[styles.uploadBox, { backgroundColor: colors.background, borderColor: colors.border }]}
                onPress={() => handleUploadImage('govIdBack')}
                disabled={uploadingField === 'govIdBack'}
              >
                {uploadingField === 'govIdBack' ? (
                  <ActivityIndicator color={colors.primary} />
                ) : govId.backImageUri ? (
                  <>
                    <Image source={{ uri: govId.backImageUri }} style={styles.uploadedImage} />
                    <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                      <CheckCircle size={16} color="#fff" />
                    </View>
                  </>
                ) : (
                  <>
                    <Upload size={32} color={colors.textSecondary} />
                    <Text style={[styles.uploadText, { color: colors.textSecondary }]}>
                      Tap to upload
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Building2 size={24} color={colors.secondary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business License
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>License Number</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter license number"
              placeholderTextColor={colors.textSecondary}
              value={businessLic.licenseNumber}
              onChangeText={(text) => setBusinessLic(prev => ({ ...prev, licenseNumber: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Enter business name"
              placeholderTextColor={colors.textSecondary}
              value={businessLic.businessName}
              onChangeText={(text) => setBusinessLic(prev => ({ ...prev, businessName: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Expiry Date (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textSecondary}
              value={businessLic.expiryDate}
              onChangeText={(text) => setBusinessLic(prev => ({ ...prev, expiryDate: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>License Document</Text>
            <TouchableOpacity
              style={[styles.uploadBoxLarge, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => handleUploadImage('businessLic')}
              disabled={uploadingField === 'businessLic'}
            >
              {uploadingField === 'businessLic' ? (
                <ActivityIndicator color={colors.primary} size="large" />
              ) : businessLic.imageUri ? (
                <>
                  <Image source={{ uri: businessLic.imageUri }} style={styles.uploadedImageLarge} />
                  <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                    <CheckCircle size={20} color="#fff" />
                  </View>
                </>
              ) : (
                <>
                  <FileText size={48} color={colors.textSecondary} />
                  <Text style={[styles.uploadTextLarge, { color: colors.textSecondary }]}>
                    Tap to upload business license
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitButton, { backgroundColor: colors.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1E1E1E" />
          ) : (
            <Text style={styles.submitButtonText}>Submit for Review</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
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
    paddingBottom: 40,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
  },
  section: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadItem: {
    flex: 1,
  },
  uploadBox: {
    aspectRatio: 1.5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadBoxLarge: {
    aspectRatio: 1.5,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
  },
  uploadedImageLarge: {
    width: '100%',
    height: '100%',
  },
  uploadBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 8,
    textAlign: 'center',
  },
  uploadTextLarge: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginTop: 12,
    textAlign: 'center',
  },
  submitButton: {
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
