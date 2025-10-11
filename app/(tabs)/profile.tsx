import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Switch,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import {
  User,
  MapPin,
  CreditCard,
  Bell,
  HelpCircle,
  Settings,
  LogOut,
  ChevronRight,
  Moon,
  Sun,
  Briefcase,
  Plus,
  X,
  Navigation,
} from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

type SavedAddress = {
  id: string;
  label: string;
  address: string;
  latitude: number;
  longitude: number;
  instructions?: string;
};

export default function ProfileScreen() {
  const { colors, isDark, toggleTheme } = useTheme();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [newAddress, setNewAddress] = useState({
    label: '',
    address: '',
    latitude: 0,
    longitude: 0,
    instructions: '',
  });
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  const getCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if (Platform.OS === 'web') {
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setNewAddress(prev => ({
                ...prev,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                address: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`,
              }));
              setIsLoadingLocation(false);
            },
            (error) => {
              console.error('Geolocation error:', error);
              Alert.alert('Error', 'Failed to get current location');
              setIsLoadingLocation(false);
            }
          );
        }
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Location permission is required');
          setIsLoadingLocation(false);
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        const [geocode] = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        const addressString = geocode
          ? `${geocode.street || ''} ${geocode.name || ''}, ${geocode.city || ''}, ${geocode.region || ''}`.trim()
          : `${location.coords.latitude.toFixed(6)}, ${location.coords.longitude.toFixed(6)}`;

        setNewAddress(prev => ({
          ...prev,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          address: addressString,
        }));
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get current location');
    } finally {
      setIsLoadingLocation(false);
    }
  };

  const saveAddress = () => {
    if (!newAddress.label || !newAddress.address) {
      Alert.alert('Error', 'Please fill in label and address');
      return;
    }

    const address: SavedAddress = {
      id: Date.now().toString(),
      ...newAddress,
    };

    setSavedAddresses(prev => [...prev, address]);
    setShowAddressModal(false);
    setNewAddress({
      label: '',
      address: '',
      latitude: 0,
      longitude: 0,
      instructions: '',
    });
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoggingOut(true);
              console.log('[Profile] Logging out...');
              await logout();
              console.log('[Profile] Logout successful, redirecting to login');
              router.replace('/auth/login');
            } catch (error) {
              console.error('[Profile] Logout error:', error);
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoggingOut(false);
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
  
  const menuItems = [
    { icon: Briefcase, label: 'Business Dashboard', onPress: () => router.push('/business-dashboard' as any) },
    { icon: User, label: 'Edit Profile', onPress: () => router.push('/settings/edit-profile' as any) },
    { icon: MapPin, label: 'Saved Addresses', onPress: () => setShowAddressModal(true) },
    { icon: CreditCard, label: 'Payment Methods', onPress: () => router.push('/payment-methods' as any) },
    { icon: Bell, label: 'Notifications', onPress: () => router.push('/settings/notifications' as any) },
    { icon: HelpCircle, label: 'Help & Support', onPress: () => router.push('/settings/support' as any) },
    { icon: Settings, label: 'Settings', onPress: () => router.push('/settings/account' as any) },
  ];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Profile',
          headerStyle: { backgroundColor: colors.card },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 18,
          },
        }}
      />

      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.gradientBackground}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.profileHeader, { 
            backgroundColor: colors.card,
            ...Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
              },
              android: {
                elevation: 4,
              },
              web: {
                boxShadow: `0 4px 12px ${colors.shadow}`,
              },
            }),
          }]}>
            <View style={[styles.avatarContainer, {
              ...Platform.select({
                ios: {
                  shadowColor: colors.primary,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 6,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.primary}4D`,
                },
              }),
            }]}>
              <Image
                source={{ uri: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&q=80' }}
                style={[styles.avatar, { borderColor: colors.primary }]}
              />
            </View>
            <Text style={[styles.name, { color: colors.text }]}>{user?.name || 'User'}</Text>
            <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email || 'email@example.com'}</Text>
            <Text style={[styles.phone, { color: colors.textSecondary }]}>{user?.phone || 'No phone'}</Text>
          </View>

          <View style={styles.statsContainer}>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              ...Platform.select({
                ios: {
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 3,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.shadow}`,
                },
              }),
            }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>12</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Bookings</Text>
            </View>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              ...Platform.select({
                ios: {
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 3,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.shadow}`,
                },
              }),
            }]}>
              <Text style={[styles.statValue, { color: colors.primary }]}>8</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
            </View>
            <View style={[styles.statCard, { 
              backgroundColor: colors.card,
              borderColor: colors.borderLight,
              ...Platform.select({
                ios: {
                  shadowColor: colors.shadow,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 1,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 3,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.shadow}`,
                },
              }),
            }]}>
              <Text style={[styles.statValue, { color: colors.secondary }]}>$1,240</Text>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Spent</Text>
            </View>
          </View>

          <View style={[styles.themeToggle, { 
            backgroundColor: colors.card, 
            borderColor: colors.borderLight,
            ...Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
              },
              android: {
                elevation: 3,
              },
              web: {
                boxShadow: `0 4px 12px ${colors.shadow}`,
              },
            }),
          }]}>
            <View style={styles.menuItemLeft}>
              <View style={[styles.menuIconContainer, { 
                backgroundColor: isDark ? colors.primary + '20' : colors.secondary + '20',
              }]}>
                {isDark ? (
                  <Moon size={22} color={colors.primary} strokeWidth={2.5} />
                ) : (
                  <Sun size={22} color={colors.secondary} strokeWidth={2.5} />
                )}
              </View>
              <Text style={[styles.menuItemText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor="#FFFFFF"
              ios_backgroundColor={colors.borderLight}
            />
          </View>

          <View style={[styles.menuSection, { 
            backgroundColor: colors.card, 
            borderColor: colors.borderLight,
            ...Platform.select({
              ios: {
                shadowColor: colors.shadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1,
                shadowRadius: 12,
              },
              android: {
                elevation: 3,
              },
              web: {
                boxShadow: `0 4px 12px ${colors.shadow}`,
              },
            }),
          }]}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.menuItem, { 
                  borderBottomColor: colors.borderLight,
                  borderBottomWidth: index < menuItems.length - 1 ? 1 : 0,
                }]}
                onPress={item.onPress}
                activeOpacity={0.8}
              >
                <View style={styles.menuItemLeft}>
                  <View style={[styles.menuIconContainer, { 
                    backgroundColor: colors.primary + '15',
                  }]}>
                    <item.icon size={22} color={colors.primary} strokeWidth={2.5} />
                  </View>
                  <Text style={[styles.menuItemText, { color: colors.text }]}>{item.label}</Text>
                </View>
                <ChevronRight size={22} color={colors.textLight} strokeWidth={2} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[styles.logoutButton, { 
              backgroundColor: colors.card, 
              borderColor: colors.error + '30',
              ...Platform.select({
                ios: {
                  shadowColor: colors.error,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.15,
                  shadowRadius: 12,
                },
                android: {
                  elevation: 3,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.error}26`,
                },
              }),
            }]} 
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <>
                <LogOut size={22} color={colors.error} strokeWidth={2.5} />
                <Text style={[styles.logoutText, { color: colors.error }]}>Log Out</Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={[styles.version, { color: colors.textLight }]}>Island Linkup v1.0.0</Text>
        </ScrollView>
      </LinearGradient>

      <Modal
        visible={showAddressModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddressModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Add Address</Text>
              <TouchableOpacity onPress={() => setShowAddressModal(false)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Label</Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.borderLight,
                }]}
                placeholder="e.g., Home, Work, Office"
                placeholderTextColor={colors.textLight}
                value={newAddress.label}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, label: text }))}
              />

              <View style={styles.locationSection}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>Location</Text>
                <TouchableOpacity
                  style={[styles.locationButton, { 
                    backgroundColor: colors.primary,
                  }]}
                  onPress={getCurrentLocation}
                  disabled={isLoadingLocation}
                >
                  <Navigation size={20} color="#FFFFFF" />
                  <Text style={styles.locationButtonText}>
                    {isLoadingLocation ? 'Getting Location...' : 'Use Current Location'}
                  </Text>
                </TouchableOpacity>
              </View>

              <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.borderLight,
                }]}
                placeholder="Enter address"
                placeholderTextColor={colors.textLight}
                value={newAddress.address}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, address: text }))}
                multiline
                numberOfLines={3}
              />

              {newAddress.latitude !== 0 && newAddress.longitude !== 0 && (
                <Text style={[styles.coordsText, { color: colors.textSecondary }]}>
                  Coordinates: {newAddress.latitude.toFixed(6)}, {newAddress.longitude.toFixed(6)}
                </Text>
              )}

              <Text style={[styles.inputLabel, { color: colors.text }]}>Directions / Instructions (Optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { 
                  backgroundColor: colors.background, 
                  color: colors.text,
                  borderColor: colors.borderLight,
                }]}
                placeholder="e.g., Ring doorbell twice, Gate code: 1234"
                placeholderTextColor={colors.textLight}
                value={newAddress.instructions}
                onChangeText={(text) => setNewAddress(prev => ({ ...prev, instructions: text }))}
                multiline
                numberOfLines={3}
              />

              {savedAddresses.length > 0 && (
                <View style={styles.savedAddressesSection}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>Saved Addresses</Text>
                  {savedAddresses.map((addr) => (
                    <View key={addr.id} style={[styles.savedAddressCard, { 
                      backgroundColor: colors.background,
                      borderColor: colors.borderLight,
                    }]}>
                      <View style={styles.savedAddressHeader}>
                        <Text style={[styles.savedAddressLabel, { color: colors.text }]}>{addr.label}</Text>
                        <TouchableOpacity onPress={() => setSavedAddresses(prev => prev.filter(a => a.id !== addr.id))}>
                          <X size={18} color={colors.error} />
                        </TouchableOpacity>
                      </View>
                      <Text style={[styles.savedAddressText, { color: colors.textSecondary }]}>{addr.address}</Text>
                      {addr.instructions && (
                        <Text style={[styles.savedAddressInstructions, { color: colors.textLight }]}>
                          {addr.instructions}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.saveButton, { backgroundColor: colors.primary }]}
                onPress={saveAddress}
              >
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.saveButtonText}>Save Address</Text>
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
  gradientBackground: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 24,
    borderRadius: 24,
  },
  avatarContainer: {
    marginBottom: 20,
  },
  avatar: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 4,
  },
  name: {
    fontSize: 26,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  email: {
    fontSize: 15,
    marginBottom: 4,
    fontWeight: '500' as const,
  },
  phone: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  themeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  menuSection: {
    marginHorizontal: 24,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  menuIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginHorizontal: 24,
    marginTop: 24,
    padding: 20,
    borderRadius: 20,
    borderWidth: 2,
  },
  logoutText: {
    fontSize: 17,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  version: {
    textAlign: 'center' as const,
    fontSize: 13,
    marginTop: 32,
    fontWeight: '600' as const,
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: Platform.select({ ios: 34, default: 20 }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  modalBody: {
    paddingHorizontal: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top' as const,
  },
  locationSection: {
    marginBottom: 8,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  locationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  coordsText: {
    fontSize: 13,
    marginTop: 8,
    fontWeight: '500' as const,
  },
  savedAddressesSection: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  savedAddressCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 12,
    borderWidth: 1,
  },
  savedAddressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  savedAddressLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  savedAddressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  savedAddressInstructions: {
    fontSize: 13,
    marginTop: 6,
    fontStyle: 'italic' as const,
  },
  modalFooter: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 18,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700' as const,
  },
});
