import React, { useState } from 'react';
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
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Camera, Upload, CheckCircle, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProvider } from '@/contexts/ProviderContext';
import type { KYCDocument } from '@/types';

type DocumentType = 'id_front' | 'id_back' | 'selfie';

interface Document {
  type: DocumentType;
  uri: string;
  uploaded: boolean;
}

export default function KYCScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { updateUser } = useAuth();
  const { submitKYC } = useProvider();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [uploading, setUploading] = useState(false);

  const documentTypes = [
    { type: 'id_front' as DocumentType, label: 'ID Front', icon: Upload },
    { type: 'id_back' as DocumentType, label: 'ID Back', icon: Upload },
    { type: 'selfie' as DocumentType, label: 'Selfie', icon: Camera },
  ];

  const pickImage = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newDoc: Document = {
        type,
        uri: result.assets[0].uri,
        uploaded: false,
      };
      setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    }
  };

  const takePhoto = async (type: DocumentType) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera permissions');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const newDoc: Document = {
        type,
        uri: result.assets[0].uri,
        uploaded: false,
      };
      setDocuments(prev => [...prev.filter(d => d.type !== type), newDoc]);
    }
  };

  const handleDocumentAction = (type: DocumentType) => {
    Alert.alert('Upload Document', 'Choose an option', [
      { text: 'Take Photo', onPress: () => takePhoto(type) },
      { text: 'Choose from Library', onPress: () => pickImage(type) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleSubmit = async () => {
    if (documents.length < 3) {
      Alert.alert('Incomplete', 'Please upload all required documents');
      return;
    }

    setUploading(true);

    try {
      const kycDocs: KYCDocument[] = documents.map((doc, index) => ({
        id: `kyc_${Date.now()}_${index}`,
        type: doc.type === 'selfie' ? 'id' : 'id',
        uri: doc.uri,
        status: 'pending' as const,
        uploadedAt: new Date().toISOString(),
      }));

      const result = await submitKYC(kycDocs);
      
      if (result.success) {
        await updateUser({ kycStatus: 'pending' });
        Alert.alert(
          'KYC Submitted',
          'Your documents have been submitted for review. This usually takes 1-2 business days.',
          [{ text: 'Continue', onPress: () => router.push('/onboarding/services' as any) }]
        );
      } else {
        Alert.alert('Error', result.error || 'Failed to submit documents');
      }
    } catch (error) {
      console.error('[KYC] Submit error:', error);
      Alert.alert('Error', 'Failed to submit documents. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const isComplete = documents.length === 3;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Identity Verification',
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
            <CheckCircle size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Verify Your Identity</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Upload clear photos of your ID and a selfie to verify your identity
          </Text>
        </View>

        <View style={styles.documentsContainer}>
          {documentTypes.map(({ type, label, icon: Icon }) => {
            const doc = documents.find(d => d.type === type);
            const isUploaded = !!doc;

            return (
              <TouchableOpacity
                key={type}
                style={[
                  styles.documentCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: isUploaded ? colors.success : colors.border,
                    borderWidth: isUploaded ? 2 : 1,
                  },
                ]}
                onPress={() => handleDocumentAction(type)}
                activeOpacity={0.7}
              >
                {doc ? (
                  <View style={styles.uploadedContainer}>
                    <Image source={{ uri: doc.uri }} style={styles.documentImage} />
                    <View style={[styles.uploadedBadge, { backgroundColor: colors.success }]}>
                      <CheckCircle size={16} color="#fff" strokeWidth={3} />
                      <Text style={styles.uploadedText}>Uploaded</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.uploadPlaceholder}>
                    <View
                      style={[styles.uploadIconContainer, { backgroundColor: `${colors.primary}10` }]}
                    >
                      <Icon size={32} color={colors.primary} strokeWidth={2} />
                    </View>
                    <Text style={[styles.documentLabel, { color: colors.text }]}>{label}</Text>
                    <Text style={[styles.uploadHint, { color: colors.textSecondary }]}>
                      Tap to upload
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${colors.primary}10` }]}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Requirements</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            • Clear, well-lit photos{'\n'}
            • All text must be readable{'\n'}
            • No glare or shadows{'\n'}
            • Government-issued ID only{'\n'}
            • Selfie should match ID photo
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.submitButton, { opacity: isComplete && !uploading ? 1 : 0.5 }]}
          onPress={handleSubmit}
          disabled={!isComplete || uploading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {uploading ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit for Review</Text>
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
  documentsContainer: {
    gap: 16,
    marginBottom: 24,
  },
  documentCard: {
    borderRadius: 16,
    overflow: 'hidden',
    minHeight: 200,
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
  uploadedContainer: {
    position: 'relative' as const,
  },
  documentImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  uploadedBadge: {
    position: 'absolute' as const,
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  uploadedText: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  uploadPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 200,
  },
  uploadIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  documentLabel: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 6,
  },
  uploadHint: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  infoCard: {
    padding: 20,
    borderRadius: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 22,
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
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
