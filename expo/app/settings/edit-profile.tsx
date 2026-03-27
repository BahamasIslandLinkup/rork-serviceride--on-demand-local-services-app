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
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Camera, User, Phone, Mail, Briefcase, MapPin, Save, Car } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProvider } from '@/contexts/ProviderContext';
import { StorageService } from '@/services/storage';

export default function EditProfileScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user, updateProfile } = useAuth();
  const { setVehicleInfo } = useProvider();
  
  const [loading, setLoading] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    bio: user?.bio || '',
    businessName: user?.businessName || '',
    serviceCategories: user?.serviceCategories || [],
    serviceRadius: user?.serviceRadius || 10,
    avatar: user?.avatar || '',
  });
  
  const [vehicleData, setVehicleData] = useState({
    make: user?.vehicleInfo?.make || '',
    model: user?.vehicleInfo?.model || '',
    year: user?.vehicleInfo?.year || new Date().getFullYear(),
    color: user?.vehicleInfo?.color || '',
    licensePlate: user?.vehicleInfo?.licensePlate || '',
  });

  const handlePickImage = async () => {
    if (!user?.id) {
      Alert.alert('Error', 'Please sign in again to update your profile photo.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const result = await StorageService.pickAndUploadImage(`profiles/${user.id}`, {
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result) {
        return;
      }

      setFormData((prev) => ({
        ...prev,
        avatar: result.url,
      }));
      Alert.alert('Success', 'Profile photo updated. Don\'t forget to save your changes.');
    } catch (error) {
      console.error('[EditProfile] Photo update failed:', error);
      Alert.alert('Error', 'Failed to update profile photo. Please try again.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    if (isProvider) {
      if (!vehicleData.make || !vehicleData.model || !vehicleData.color || !vehicleData.licensePlate) {
        Alert.alert('Error', 'All vehicle information is required for providers');
        return;
      }
    }

    try {
      setLoading(true);
      console.log('[EditProfile] Updating profile:', formData);
      
      await updateProfile(formData);
      
      if (isProvider && setVehicleInfo) {
        await setVehicleInfo(vehicleData);
      }
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('[EditProfile] Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isProvider = user?.role === 'provider';

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  formData.avatar ||
                  user?.avatar ||
                  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80',
              }}
              style={styles.avatar}
            />
            <TouchableOpacity
              style={[styles.cameraButton, { backgroundColor: colors.primary }]}
              onPress={handlePickImage}
              disabled={isUploadingPhoto}
            >
              {isUploadingPhoto ? (
                <ActivityIndicator size="small" color="#1E1E1E" />
              ) : (
                <Camera size={20} color="#1E1E1E" />
              )}
            </TouchableOpacity>
          </View>
          <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
            Tap to change photo
          </Text>
        </View>

        <View style={[styles.section, { backgroundColor: colors.card }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <User size={20} color={colors.primary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <Mail size={20} color={colors.primary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
              <TextInput
                style={[styles.input, { color: colors.textSecondary }]}
                placeholder="Enter your email"
                placeholderTextColor={colors.textSecondary}
                value={formData.email}
                editable={false}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <Phone size={20} color={colors.primary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Phone</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Enter your phone"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData(prev => ({ ...prev, phone: text }))}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={[styles.inputIcon, { backgroundColor: colors.primary + '15' }]}>
              <User size={20} color={colors.primary} />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea, { color: colors.text }]}
                placeholder="Tell us about yourself"
                placeholderTextColor={colors.textSecondary}
                value={formData.bio}
                onChangeText={(text) => setFormData(prev => ({ ...prev, bio: text }))}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {isProvider && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Business Information</Text>
            
            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Briefcase size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Business Name</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter business name"
                  placeholderTextColor={colors.textSecondary}
                  value={formData.businessName}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, businessName: text }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <MapPin size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Service Radius (miles)</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="10"
                  placeholderTextColor={colors.textSecondary}
                  value={String(formData.serviceRadius)}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, serviceRadius: parseInt(text) || 10 }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}

        {isProvider && (
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Information</Text>
            
            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Car size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Make</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., Toyota"
                  placeholderTextColor={colors.textSecondary}
                  value={vehicleData.make}
                  onChangeText={(text) => setVehicleData(prev => ({ ...prev, make: text }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Car size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Model</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., Camry"
                  placeholderTextColor={colors.textSecondary}
                  value={vehicleData.model}
                  onChangeText={(text) => setVehicleData(prev => ({ ...prev, model: text }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Car size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Year</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="2024"
                  placeholderTextColor={colors.textSecondary}
                  value={String(vehicleData.year)}
                  onChangeText={(text) => setVehicleData(prev => ({ ...prev, year: parseInt(text) || new Date().getFullYear() }))}
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Car size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Color</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g., Black"
                  placeholderTextColor={colors.textSecondary}
                  value={vehicleData.color}
                  onChangeText={(text) => setVehicleData(prev => ({ ...prev, color: text }))}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={[styles.inputIcon, { backgroundColor: colors.secondary + '15' }]}>
                <Car size={20} color={colors.secondary} />
              </View>
              <View style={styles.inputWrapper}>
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>License Plate</Text>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="ABC-1234"
                  placeholderTextColor={colors.textSecondary}
                  value={vehicleData.licensePlate}
                  onChangeText={(text) => setVehicleData(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
                  autoCapitalize="characters"
                />
              </View>
            </View>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: colors.primary + '10' }]}>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Your profile information is visible to other users. Make sure to keep it up to date.
          </Text>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#1E1E1E" />
          ) : (
            <>
              <Save size={20} color="#1E1E1E" />
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    paddingBottom: 140,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  avatarHint: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    borderRadius: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    gap: 12,
  },
  inputIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  inputWrapper: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    fontWeight: '500' as const,
    paddingVertical: 12,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  infoCard: {
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 20,
    textAlign: 'center',
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
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 18,
    borderRadius: 12,
    minHeight: 56,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
