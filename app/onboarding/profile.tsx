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
  User, 
  Upload, 
  CheckCircle,
  ChevronRight,
  Camera,
  Briefcase
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { StorageService } from '@/services/storage';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  const [profileData, setProfileData] = useState({
    avatar: user?.avatar || '',
    bio: user?.bio || '',
    businessName: user?.businessName || '',
    businessDescription: user?.businessDescription || '',
  });

  const handleUploadAvatar = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in again.');
      return;
    }

    Alert.alert('Upload Photo', 'Choose an option', [
      {
        text: 'Take Photo',
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant camera permissions');
            return;
          }

          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri);
          }
        },
      },
      {
        text: 'Choose from Library',
        onPress: async () => {
          const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please grant photo library permissions');
            return;
          }

          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });

          if (!result.canceled && result.assets[0]) {
            await uploadImage(result.assets[0].uri);
          }
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadImage = async (uri: string) => {
    if (!user?.id) return;

    try {
      setUploadingAvatar(true);
      const result = await StorageService.uploadImage(
        uri,
        `avatars/${user.id}`,
        'profile.jpg'
      );

      if (result) {
        setProfileData(prev => ({ ...prev, avatar: result.url }));
      }
    } catch (error) {
      console.error('[Profile] Upload failed:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const validateForm = () => {
    if (!profileData.businessName.trim()) {
      Alert.alert('Missing Info', 'Please enter your business name');
      return false;
    }
    if (!profileData.businessDescription.trim()) {
      Alert.alert('Missing Info', 'Please enter a business description');
      return false;
    }
    if (profileData.businessDescription.length < 20) {
      Alert.alert('Too Short', 'Business description should be at least 20 characters');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      await updateProfile({
        avatar: profileData.avatar,
        bio: profileData.bio,
        businessName: profileData.businessName,
        businessDescription: profileData.businessDescription,
      });

      router.replace('/(tabs)');
    } catch (error) {
      console.error('[Profile] Submit failed:', error);
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Complete Your Profile',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerBackVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <User size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Complete Your Profile</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Set up your business profile to attract customers
          </Text>
        </View>

        <View style={styles.avatarSection}>
          <Text style={[styles.sectionLabel, { color: colors.text }]}>Profile Photo</Text>
          <TouchableOpacity
            style={[styles.avatarContainer, { borderColor: colors.border }]}
            onPress={handleUploadAvatar}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <ActivityIndicator color={colors.primary} size="large" />
            ) : profileData.avatar ? (
              <>
                <Image source={{ uri: profileData.avatar }} style={styles.avatar} />
                <View style={[styles.avatarBadge, { backgroundColor: colors.primary }]}>
                  <Camera size={16} color="#1E1E1E" strokeWidth={2.5} />
                </View>
              </>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Upload size={32} color={colors.textSecondary} />
                <Text style={[styles.avatarPlaceholderText, { color: colors.textSecondary }]}>
                  Upload Photo
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <View style={styles.sectionHeader}>
            <Briefcase size={24} color={colors.secondary} strokeWidth={2.5} />
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Business Information
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Business Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="e.g., John's Plumbing Services"
              placeholderTextColor={colors.textSecondary}
              value={profileData.businessName}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, businessName: text }))}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Business Description *</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Describe your services, experience, and what makes your business unique..."
              placeholderTextColor={colors.textSecondary}
              value={profileData.businessDescription}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, businessDescription: text }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
            <Text style={[styles.charCount, { color: colors.textSecondary }]}>
              {profileData.businessDescription.length} / 500 characters
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Personal Bio (Optional)</Text>
            <TextInput
              style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Tell customers about yourself..."
              placeholderTextColor={colors.textSecondary}
              value={profileData.bio}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, bio: text }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <View style={[styles.infoCard, { backgroundColor: `${colors.success}15` }]}>
          <CheckCircle size={20} color={colors.success} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            Your profile will be visible to customers once your verification is approved
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.submitButtonGradient}
          >
            {loading ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Complete Setup</Text>
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
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 16,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarBadge: {
    position: 'absolute' as const,
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  avatarPlaceholderText: {
    fontSize: 14,
    fontWeight: '600' as const,
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
  textArea: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontWeight: '500' as const,
    minHeight: 120,
  },
  charCount: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 6,
    textAlign: 'right',
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500' as const,
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
