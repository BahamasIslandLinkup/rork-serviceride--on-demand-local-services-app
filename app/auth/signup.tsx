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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, Briefcase, ShoppingBag } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

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
    return (
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
  };

  const handleSignup = async () => {
    if (!isFormValid()) return;

    setLoading(true);
    setError('');

    try {
      const result = await signup(email, password, name, phone, role);
      if (result.success) {
        if (role === 'provider') {
          router.replace('/onboarding/verification' as any);
        } else {
          router.replace('/(tabs)');
        }
      } else {
        setError(result.error || 'Signup failed. Please try again.');
      }
    } catch {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
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
});
