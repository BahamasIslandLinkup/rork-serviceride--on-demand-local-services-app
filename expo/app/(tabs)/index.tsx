import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Search, MapPin, Wrench, Home, Droplet, Zap, Leaf, Paintbrush, Wind, Hammer, Plus } from 'lucide-react-native';
import { serviceCategories } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import { useAuth } from '@/contexts/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48 - 16) / 2;

const categoryIcons: Record<string, any> = {
  'Auto Repair': Wrench,
  'House Cleaning': Home,
  'Plumbing': Droplet,
  'Electrical': Zap,
  'Landscaping': Leaf,
  'Painting': Paintbrush,
  'HVAC': Wind,
  'Carpentry': Hammer,
};

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { location } = useLocation();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <LinearGradient
        colors={[colors.backgroundGradientStart, colors.backgroundGradientEnd]}
        style={styles.gradientBackground}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.headerLeft}>
                <Text style={[styles.greeting, { color: colors.text }]}>Discover</Text>
                <View style={styles.locationRow}>
                  <MapPin size={18} color={colors.primary} strokeWidth={2.5} />
                  <Text style={[styles.location, { color: colors.textSecondary }]}>
                    {location.address || location.city || 'Nassau, Bahamas'}
                  </Text>
                </View>
              </View>
              <View style={styles.headerRight}>
                <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>Welcome,</Text>
                <Text style={[styles.userName, { color: colors.text }]}>{user?.name || 'Guest'}</Text>
              </View>
            </View>

            <View style={[styles.searchContainer, { 
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
                  elevation: 4,
                },
                web: {
                  boxShadow: `0 4px 12px ${colors.shadow}`,
                },
              }),
            }]}>
              <Search size={22} color={colors.textLight} style={styles.searchIcon} strokeWidth={2} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search services..."
                placeholderTextColor={colors.textLight}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Popular Services</Text>
            <View style={styles.categoriesGrid}>
              {serviceCategories.map((category) => {
                const IconComponent = categoryIcons[category.name] || Wrench;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, { 
                      backgroundColor: colors.card,
                      borderColor: colors.borderLight,
                      ...Platform.select({
                        ios: {
                          shadowColor: colors.shadow,
                          shadowOffset: { width: 0, height: 6 },
                          shadowOpacity: 1,
                          shadowRadius: 16,
                        },
                        android: {
                          elevation: 6,
                        },
                        web: {
                          boxShadow: `0 6px 16px ${colors.shadow}`,
                        },
                      }),
                    }]}
                    onPress={() => router.push(`/category/${category.id}`)}
                    activeOpacity={0.8}
                  >
                    {category.image ? (
                      <Image
                        source={{ uri: category.image }}
                        style={styles.categoryImage}
                      />
                    ) : (
                      <View style={[styles.categoryImage, { backgroundColor: colors.border }]} />
                    )}
                    <LinearGradient
                      colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.5)']}
                      style={styles.categoryOverlay}
                    />
                    <View style={styles.categoryContent}>
                      <View style={[styles.categoryIconBg, { 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        ...Platform.select({
                          ios: {
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.15,
                            shadowRadius: 8,
                          },
                          android: {
                            elevation: 3,
                          },
                          web: {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          },
                        }),
                      }]}>
                        <IconComponent size={24} color={category.color} strokeWidth={2.5} />
                      </View>
                      <Text style={styles.categoryName}>{category.name}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>How it works</Text>
            </View>
            <View style={styles.stepsGrid}>
              <View style={[styles.stepCard, { 
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
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>1</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Choose Service</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Browse and select from our wide range of professional services
                </Text>
              </View>
              <View style={[styles.stepCard, { 
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
                <View style={[styles.stepNumber, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.stepNumberText, { color: '#1E1E1E' }]}>2</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Book Provider</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Pick a verified professional and schedule your appointment
                </Text>
              </View>
              <View style={[styles.stepCard, { 
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
                <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.stepNumberText, { color: '#FFFFFF' }]}>3</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Get it Done</Text>
                <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                  Relax while our expert completes your service professionally
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <TouchableOpacity 
          style={[styles.fab, { 
            ...Platform.select({
              ios: {
                shadowColor: colors.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.5,
                shadowRadius: 20,
              },
              android: {
                elevation: 12,
              },
              web: {
                boxShadow: `0 8px 32px ${colors.primary}80, 0 4px 16px ${colors.secondary}40`,
              },
            }),
          }]}
          activeOpacity={0.8}
          onPress={() => router.push('/search')}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <Plus size={28} color="#1E1E1E" strokeWidth={3} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
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
    paddingBottom: 100,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
    marginLeft: 16,
  },
  welcomeText: {
    fontSize: 13,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700' as const,
    letterSpacing: 0.2,
  },
  greeting: {
    fontSize: 34,
    fontWeight: '700' as const,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  location: {
    fontSize: 15,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500' as const,
  },
  section: {
    marginTop: 32,
    paddingHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '700' as const,
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
    position: 'absolute' as const,
  },
  categoryOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  categoryContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  categoryIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIconText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#fff',
  },
  categoryName: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stepCard: {
    width: CARD_WIDTH,
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
  },
  stepNumber: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepNumberText: {
    fontSize: 18,
    fontWeight: '800' as const,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  stepDescription: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500' as const,
  },
  fab: {
    position: 'absolute' as const,
    bottom: 90,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
