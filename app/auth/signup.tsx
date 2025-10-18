import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, Briefcase, ShoppingBag, Upload, CheckCircle, Car, IdCard, Building2, FileText } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import type { VehicleInfo, GovernmentID, BusinessLicense, ProviderSignupPayload } from '@/types';

export default function SignupScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { signup } = useAuth();
  const insets = useSafeAreaInsets();
  
  const [role, setRole] = useState<'customer' | 'provider'>('customer');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    make: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    licensePlate: '',
  });
  
  const [govId, setGovId] = useState<Partial<GovernmentID> & {
    frontImageMimeType?: string;
    backImageMimeType?: string;
  }>({
    idNumber: '',
    frontImageUri: '',
    backImageUri: '',
    expiryDate: '',
  });

  const [businessLic, setBusinessLic] = useState<Partial<BusinessLicense> & {
    imageMimeType?: string;
  }>({
    licenseNumber: '',
    businessName: '',
    imageUri: '',
    expiryDate: '',
  });
  
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const validateName = (text: string) => {
    setName(text);
    setNameError('');
    if (text && text.length < 2) {
      setNameError('Name must be at least 2 characters');
    }
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    setEmailError('');
    if (text && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      setEmailError('Please enter a valid email address');
    }
  };

  const validatePhone = (text: string) => {
    setPhone(text);
    setPhoneError('');
    if (text && !/^\+?[\d\s()-]{10,}$/.test(text)) {
      setPhoneError('Please enter a valid phone number');
    }
  };

  const validatePassword = (text: string) => {
    setPassword(text);
    setPasswordError('');
    if (text && text.length < 8) {
      setPasswordError('Password must be at least 8 characters');
    }
    if (confirmPassword && text !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const validateConfirmPassword = (text: string) => {
    setConfirmPassword(text);
    setConfirmPasswordError('');
    if (text && text !== password) {
      setConfirmPasswordError('Passwords do not match');
    }
  };

  const isFormValid = () => {
    const basicValid = (
      name.length >= 2 &&
      email.length > 0 &&
      phone.length >= 10 &&
      password.length >= 8 &&
      confirmPassword === password &&
      !nameError &&
      !emailError &&
      !phoneError &&
      !passwordError &&
      !confirmPasswordError &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    );

    if (role === 'customer') {
      return basicValid;
    }

    return (
      basicValid &&
      vehicleInfo.make.trim().length > 0 &&
      vehicleInfo.model.trim().length > 0 &&
      vehicleInfo.color.trim().length > 0 &&
      vehicleInfo.licensePlate.trim().length > 0 &&
      govId.idNumber &&
      govId.frontImageUri &&
      govId.backImageUri &&
      govId.expiryDate &&
      businessLic.licenseNumber?.trim() &&
      businessLic.businessName?.trim() &&
      businessLic.imageUri
    );
  };

  const handleUploadImage = async (field: 'govIdFront' | 'govIdBack' | 'businessLic') => {
    try {
      setUploadingField(field);
      if (Platform.OS !== 'web') {
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permissionResult.granted) {
          Alert.alert('Permission required', 'Please allow access to your photo library to upload documents.');
          setUploadingField(null);
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.9,
      });

      if (result.canceled || !result.assets || !result.assets[0]?.uri) {
        setUploadingField(null);
        return;
      }

      const asset = result.assets[0];
      const uri = asset.uri;
      const mimeType = asset.mimeType || 'image/jpeg';

      if (field === 'govIdFront') {
        setGovId(prev => ({ ...prev, frontImageUri: uri, frontImageMimeType: mimeType }));
      } else if (field === 'govIdBack') {
        setGovId(prev => ({ ...prev, backImageUri: uri, backImageMimeType: mimeType }));
      } else if (field === 'businessLic') {
        setBusinessLic(prev => ({ ...prev, imageUri: uri, imageMimeType: mimeType }));
      }
    } catch (error) {
      console.error('[Signup] Image selection failed:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    } finally {
      setUploadingField(null);
    }
  };

  const handleSignup = async () => {
    if (!isFormValid()) {
      if (role === 'provider') {
        Alert.alert('Incomplete Information', 'Please fill in all required fields and upload all documents.');
      }
      return;
    }

    setLoading(true);
    setError('');

    try {
      const providerSignupData = role === 'provider' ? buildProviderSignupData() : undefined;

      if (role === 'provider' && !providerSignupData) {
        throw new Error('Provider data could not be prepared');
      }

      const result = await signup(
        email,
        password,
        name,
        phone,
        role,
        providerSignupData
      );

      if (result.success) {
        if (role === 'provider') {
          Alert.alert(
            'Application Submitted',
            'Your provider application has been submitted for review. You will be notified once approved.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/auth/login' as any),
              },
            ]
          );
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('[Signup] Error:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildProviderSignupData = (): ProviderSignupPayload | undefined => {
    if (role !== 'provider') {
      return undefined;
    }

    const vehicleData: VehicleInfo = {
      ...vehicleInfo,
      make: vehicleInfo.make.trim(),
      model: vehicleInfo.model.trim(),
      color: vehicleInfo.color.trim(),
      licensePlate: vehicleInfo.licensePlate.trim(),
    };

    if (!govId.frontImageUri || !govId.backImageUri) {
      throw new Error('Government ID images are required');
    }
    if (!businessLic.imageUri) {
      throw new Error('Business license document is required');
    }

    const governmentId: GovernmentID = {
      idNumber: govId.idNumber!.trim(),
      frontImageUri: govId.frontImageUri!,
      backImageUri: govId.backImageUri!,
      expiryDate: govId.expiryDate!.trim(),
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    };

    const businessLicense: BusinessLicense = {
      licenseNumber: businessLic.licenseNumber!.trim(),
      businessName: businessLic.businessName!.trim(),
      imageUri: businessLic.imageUri!,
      expiryDate: businessLic.expiryDate?.trim() || undefined,
      uploadedAt: new Date().toISOString(),
      status: 'pending',
    };

    console.log('[Signup] Provider data prepared:', {
      vehicleInfo: vehicleData,
      governmentId: { idNumber: governmentId.idNumber, status: governmentId.status },
      businessLicense: { businessName: businessLicense.businessName, status: businessLicense.status },
    });

    const businessName = businessLicense.businessName;

    return {
      vehicleInfo: vehicleData,
      governmentId,
      businessLicense,
      businessName,
      uploadSources: {
        governmentIdFront: {
          uri: govId.frontImageUri!,
          mimeType: govId.frontImageMimeType || 'image/jpeg',
        },
        governmentIdBack: {
          uri: govId.backImageUri!,
          mimeType: govId.backImageMimeType || 'image/jpeg',
        },
        businessLicense: {
          uri: businessLicense.imageUri,
          mimeType: businessLic.imageMimeType || 'image/jpeg',
        },
      },
    };
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingTop: 60 + insets.top }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <LinearGradient
              colors={[colors.primary, colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.logoGradient}
            >
              <Text style={styles.logoText}>S</Text>
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Join our community today
            </Text>
          </View>

          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${colors.error}15` }]}>
                <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={styles.roleSelector}>
              <Text style={[styles.label, { color: colors.text }]}>I am a</Text>
              <View style={styles.roleButtons}>
                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === 'customer' ? colors.primary : colors.card,
                      borderColor: role === 'customer' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRole('customer')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <ShoppingBag
                    size={24}
                    color={role === 'customer' ? '#1E1E1E' : colors.textLight}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      { color: role === 'customer' ? '#1E1E1E' : colors.text },
                    ]}
                  >
                    Customer
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleButton,
                    {
                      backgroundColor: role === 'provider' ? colors.primary : colors.card,
                      borderColor: role === 'provider' ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setRole('provider')}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Briefcase
                    size={24}
                    color={role === 'provider' ? '#1E1E1E' : colors.textLight}
                    strokeWidth={2.5}
                  />
                  <Text
                    style={[
                      styles.roleButtonText,
                      { color: role === 'provider' ? '#1E1E1E' : colors.text },
                    ]}
                  >
                    Provider
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Full Name</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: nameError ? colors.error : colors.border },
                ]}
              >
                <User size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textLight}
                  value={name}
                  onChangeText={validateName}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {nameError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{nameError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Email</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: emailError ? colors.error : colors.border },
                ]}
              >
                <Mail size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textLight}
                  value={email}
                  onChangeText={validateEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {emailError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{emailError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Phone Number</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: phoneError ? colors.error : colors.border },
                ]}
              >
                <Phone size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Enter your phone number"
                  placeholderTextColor={colors.textLight}
                  value={phone}
                  onChangeText={validatePhone}
                  keyboardType="phone-pad"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
              </View>
              {phoneError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{phoneError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: passwordError ? colors.error : colors.border },
                ]}
              >
                <Lock size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Create a password"
                  placeholderTextColor={colors.textLight}
                  value={password}
                  onChangeText={validatePassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={colors.textLight} />
                  ) : (
                    <Eye size={20} color={colors.textLight} />
                  )}
                </TouchableOpacity>
              </View>
              {passwordError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{passwordError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Confirm Password</Text>
              <View
                style={[
                  styles.inputContainer,
                  { backgroundColor: colors.card, borderColor: confirmPasswordError ? colors.error : colors.border },
                ]}
              >
                <Lock size={20} color={colors.textLight} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.textLight}
                  value={confirmPassword}
                  onChangeText={validateConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!loading}
                />
                <TouchableOpacity
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={colors.textLight} />
                  ) : (
                    <Eye size={20} color={colors.textLight} />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={[styles.fieldError, { color: colors.error }]}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {role === 'provider' && (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.providerSection}>
                  <View style={styles.sectionHeader}>
                    <Car size={24} color={colors.primary} strokeWidth={2.5} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Vehicle Information</Text>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Required for customer tracking</Text>

                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleField}>
                      <Text style={[styles.label, { color: colors.text }]}>Make *</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Toyota"
                        placeholderTextColor={colors.textLight}
                        value={vehicleInfo.make}
                        onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, make: text }))}
                        editable={!loading}
                      />
                    </View>
                    <View style={styles.vehicleField}>
                      <Text style={[styles.label, { color: colors.text }]}>Model *</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Camry"
                        placeholderTextColor={colors.textLight}
                        value={vehicleInfo.model}
                        onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, model: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.vehicleRow}>
                    <View style={styles.vehicleField}>
                      <Text style={[styles.label, { color: colors.text }]}>Year *</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="2024"
                        placeholderTextColor={colors.textLight}
                        value={String(vehicleInfo.year)}
                        onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, year: parseInt(text) || new Date().getFullYear() }))}
                        keyboardType="numeric"
                        editable={!loading}
                      />
                    </View>
                    <View style={styles.vehicleField}>
                      <Text style={[styles.label, { color: colors.text }]}>Color *</Text>
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Black"
                        placeholderTextColor={colors.textLight}
                        value={vehicleInfo.color}
                        onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, color: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>License Plate *</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="ABC-1234"
                        placeholderTextColor={colors.textLight}
                        value={vehicleInfo.licensePlate}
                        onChangeText={(text) => setVehicleInfo(prev => ({ ...prev, licensePlate: text.toUpperCase() }))}
                        autoCapitalize="characters"
                        editable={!loading}
                      />
                    </View>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.providerSection}>
                  <View style={styles.sectionHeader}>
                    <IdCard size={24} color={colors.primary} strokeWidth={2.5} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Government ID</Text>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Required for identity verification</Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>ID Number *</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter ID number"
                        placeholderTextColor={colors.textLight}
                        value={govId.idNumber}
                        onChangeText={(text) => setGovId(prev => ({ ...prev, idNumber: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Expiry Date *</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textLight}
                        value={govId.expiryDate}
                        onChangeText={(text) => setGovId(prev => ({ ...prev, expiryDate: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.uploadRow}>
                    <View style={styles.uploadItem}>
                      <Text style={[styles.label, { color: colors.text }]}>Front of ID *</Text>
                      <TouchableOpacity
                        style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => handleUploadImage('govIdFront')}
                        disabled={uploadingField === 'govIdFront' || loading}
                      >
                        {uploadingField === 'govIdFront' ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : govId.frontImageUri ? (
                          <>
                            <Image source={{ uri: govId.frontImageUri }} style={styles.uploadedImage} />
                            <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                              <CheckCircle size={14} color="#fff" />
                            </View>
                          </>
                        ) : (
                          <>
                            <Upload size={24} color={colors.textLight} />
                            <Text style={[styles.uploadText, { color: colors.textLight }]}>Upload</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>

                    <View style={styles.uploadItem}>
                      <Text style={[styles.label, { color: colors.text }]}>Back of ID *</Text>
                      <TouchableOpacity
                        style={[styles.uploadBox, { backgroundColor: colors.card, borderColor: colors.border }]}
                        onPress={() => handleUploadImage('govIdBack')}
                        disabled={uploadingField === 'govIdBack' || loading}
                      >
                        {uploadingField === 'govIdBack' ? (
                          <ActivityIndicator color={colors.primary} />
                        ) : govId.backImageUri ? (
                          <>
                            <Image source={{ uri: govId.backImageUri }} style={styles.uploadedImage} />
                            <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                              <CheckCircle size={14} color="#fff" />
                            </View>
                          </>
                        ) : (
                          <>
                            <Upload size={24} color={colors.textLight} />
                            <Text style={[styles.uploadText, { color: colors.textLight }]}>Upload</Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />

                <View style={styles.providerSection}>
                  <View style={styles.sectionHeader}>
                    <Building2 size={24} color={colors.secondary} strokeWidth={2.5} />
                    <Text style={[styles.sectionTitle, { color: colors.text }]}>Business License (Optional)</Text>
                  </View>
                  <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>Earn a &quot;Verified Business&quot; badge when approved</Text>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>License Number</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter license number"
                        placeholderTextColor={colors.textLight}
                        value={businessLic.licenseNumber}
                        onChangeText={(text) => setBusinessLic(prev => ({ ...prev, licenseNumber: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Business Name</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="Enter business name"
                        placeholderTextColor={colors.textLight}
                        value={businessLic.businessName}
                        onChangeText={(text) => setBusinessLic(prev => ({ ...prev, businessName: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>Expiry Date (Optional)</Text>
                    <View
                      style={[
                        styles.inputContainer,
                        { backgroundColor: colors.card, borderColor: colors.border },
                      ]}
                    >
                      <TextInput
                        style={[styles.input, { color: colors.text }]}
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor={colors.textLight}
                        value={businessLic.expiryDate}
                        onChangeText={(text) => setBusinessLic(prev => ({ ...prev, expiryDate: text }))}
                        editable={!loading}
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={[styles.label, { color: colors.text }]}>License Document</Text>
                    <TouchableOpacity
                      style={[styles.uploadBoxLarge, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => handleUploadImage('businessLic')}
                      disabled={uploadingField === 'businessLic' || loading}
                    >
                      {uploadingField === 'businessLic' ? (
                        <ActivityIndicator color={colors.primary} size="large" />
                      ) : businessLic.imageUri ? (
                        <>
                          <Image source={{ uri: businessLic.imageUri }} style={styles.uploadedImageLarge} />
                          <View style={[styles.uploadBadge, { backgroundColor: colors.success }]}>
                            <CheckCircle size={18} color="#fff" />
                          </View>
                        </>
                      ) : (
                        <>
                          <FileText size={40} color={colors.textLight} />
                          <Text style={[styles.uploadTextLarge, { color: colors.textLight }]}>Tap to upload</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <TouchableOpacity
              style={[
                styles.signupButton,
                { opacity: isFormValid() && !loading ? 1 : 0.5 },
              ]}
              onPress={handleSignup}
              disabled={!isFormValid() || loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.signupButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#1E1E1E" />
                ) : (
                  <Text style={styles.signupButtonText}>Create Account</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={[styles.loginText, { color: colors.textSecondary }]}>
                Already have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={[styles.loginLink, { color: colors.primary }]}>Sign In</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '800' as const,
    color: '#1E1E1E',
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  form: {
    flex: 1,
  },
  errorContainer: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '600' as const,
    textAlign: 'center',
  },
  roleSelector: {
    marginBottom: 24,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  roleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  roleButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  eyeIcon: {
    padding: 4,
  },
  fieldError: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginTop: 6,
    marginLeft: 4,
  },
  signupButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 20,
  },
  signupButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  signupButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: '700' as const,
  },
  divider: {
    height: 1,
    marginVertical: 24,
  },
  providerSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 16,
  },
  vehicleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  vehicleField: {
    flex: 1,
  },
  uploadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  uploadItem: {
    flex: 1,
  },
  uploadBox: {
    aspectRatio: 1.2,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadBoxLarge: {
    aspectRatio: 1.8,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  uploadedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadedImageLarge: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  uploadBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    fontSize: 11,
    fontWeight: '500' as const,
    marginTop: 6,
  },
  uploadTextLarge: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginTop: 10,
  },
});
