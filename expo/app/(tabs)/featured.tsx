import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Star, MapPin, Clock, Award } from 'lucide-react-native';
import { serviceProviders } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';

export default function FeaturedScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { location, calculateDistance } = useLocation();

  const featuredProviders = serviceProviders
    .filter(p => p.isFeatured)
    .sort((a, b) => (a.featuredPriority || 999) - (b.featuredPriority || 999));

  const getDistance = (lat: number, lon: number): number => {
    if (!location.coords) {
      return 0;
    }
    return calculateDistance(
      location.coords.latitude,
      location.coords.longitude,
      lat,
      lon
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Text style={[styles.title, { color: colors.text }]}>Featured Services</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Premium providers with verified excellence
          </Text>
        </View>

        <View style={styles.section}>
          {featuredProviders.map((provider, index) => {
            const distance = getDistance(provider.latitude, provider.longitude);
            
            return (
              <TouchableOpacity
                key={provider.id}
                style={[styles.providerCard, { backgroundColor: colors.card }]}
                onPress={() => router.push(`/provider/${provider.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.featuredBadge}>
                  <Award size={14} color="#fff" />
                  <Text style={styles.featuredText}>FEATURED #{index + 1}</Text>
                </View>

                {provider.image ? (
                  <Image
                    source={{ uri: provider.image }}
                    style={styles.providerImage}
                  />
                ) : (
                  <View style={[styles.providerImage, { backgroundColor: colors.border }]} />
                )}
                
                <View style={styles.providerInfo}>
                  <View style={styles.providerHeader}>
                    <Text style={[styles.providerName, { color: colors.text }]}>
                      {provider.name}
                    </Text>
                    {provider.verified && (
                      <View style={[styles.verifiedBadge, { backgroundColor: colors.primary }]}>
                        <Text style={styles.verifiedText}>✓</Text>
                      </View>
                    )}
                  </View>

                  <Text style={[styles.category, { color: colors.textSecondary }]}>
                    {provider.category}
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Star size={16} color="#fbbf24" fill="#fbbf24" />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {provider.rating}
                      </Text>
                      <Text style={[styles.statSubtext, { color: colors.textSecondary }]}>
                        ({provider.reviewCount})
                      </Text>
                    </View>

                    <View style={styles.stat}>
                      <MapPin size={16} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {distance.toFixed(1)} mi
                      </Text>
                    </View>

                    <View style={styles.stat}>
                      <Clock size={16} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {provider.responseTime}
                      </Text>
                    </View>
                  </View>

                  <Text 
                    style={[styles.description, { color: colors.textSecondary }]}
                    numberOfLines={2}
                  >
                    {provider.description}
                  </Text>

                  <View style={styles.footer}>
                    <View style={styles.skillsContainer}>
                      {provider.skills.slice(0, 2).map((skill, idx) => (
                        <View 
                          key={idx}
                          style={[styles.skillBadge, { backgroundColor: colors.background }]}
                        >
                          <Text style={[styles.skillText, { color: colors.primary }]}>
                            {skill}
                          </Text>
                        </View>
                      ))}
                      {provider.skills.length > 2 && (
                        <Text style={[styles.moreSkills, { color: colors.textSecondary }]}>
                          +{provider.skills.length - 2} more
                        </Text>
                      )}
                    </View>

                    <View style={styles.priceContainer}>
                      <Text style={[styles.price, { color: colors.primary }]}>
                        ${provider.hourlyRate}
                      </Text>
                      <Text style={[styles.priceUnit, { color: colors.textSecondary }]}>
                        /hr
                      </Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <Award size={24} color={colors.primary} />
          <Text style={[styles.infoTitle, { color: colors.text }]}>
            Why Featured?
          </Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            Featured providers have paid for premium placement and are verified professionals 
            with exceptional ratings, fast response times, and proven track records.
          </Text>
        </View>
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
    paddingBottom: 24,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 16,
  },
  providerCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  featuredBadge: {
    position: 'absolute' as const,
    top: 16,
    right: 16,
    backgroundColor: '#f59e0b',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700' as const,
    letterSpacing: 0.5,
  },
  providerImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#e5e7eb',
  },
  providerInfo: {
    padding: 16,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  providerName: {
    fontSize: 22,
    fontWeight: '700' as const,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700' as const,
  },
  category: {
    fontSize: 15,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  statSubtext: {
    fontSize: 14,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  skillBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  skillText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  moreSkills: {
    fontSize: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  price: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  priceUnit: {
    fontSize: 14,
    marginLeft: 2,
  },
  infoCard: {
    marginHorizontal: 20,
    marginTop: 24,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    marginTop: 12,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
