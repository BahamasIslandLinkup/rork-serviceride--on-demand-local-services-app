import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, Clock, CheckCircle } from 'lucide-react-native';
import { serviceCategories, serviceProviders } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export default function CategoryScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  
  const category = serviceCategories.find((c) => c.id === id);
  const providers = serviceProviders.filter((p) => p.category === category?.name);

  if (!category) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: category.name,
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {category.image ? (
            <Image source={{ uri: category.image }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: colors.border }]} />
          )}
          <View style={styles.headerOverlay} />
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{category.name}</Text>
            <Text style={styles.headerSubtitle}>{providers.length} professionals available</Text>
          </View>
        </View>

        <View style={styles.providersSection}>
          {providers.map((provider) => (
            <TouchableOpacity
              key={provider.id}
              style={[styles.providerCard, { backgroundColor: colors.card }]}
              onPress={() => router.push(`/provider/${provider.id}`)}
              activeOpacity={0.7}
            >
              {provider.image ? (
                <Image source={{ uri: provider.image }} style={styles.providerImage} />
              ) : (
                <View style={[styles.providerImage, { backgroundColor: colors.border }]} />
              )}
              <View style={styles.providerInfo}>
                <View style={styles.providerHeader}>
                  <Text style={[styles.providerName, { color: colors.text }]} numberOfLines={1}>
                    {provider.name}
                  </Text>
                  {provider.verified && (
                    <CheckCircle size={14} color={colors.primary} fill={colors.primary} />
                  )}
                </View>
                
                <View style={styles.ratingRow}>
                  <Star size={12} color={colors.star} fill={colors.star} />
                  <Text style={[styles.rating, { color: colors.text }]}>{provider.rating}</Text>
                  <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({provider.reviewCount})</Text>
                </View>

                <View style={styles.providerFooter}>
                  <View style={styles.infoItem}>
                    <MapPin size={12} color={colors.textSecondary} />
                    <Text style={[styles.infoText, { color: colors.textSecondary }]}>{provider.distance} mi</Text>
                  </View>
                  <Text style={[styles.price, { color: colors.primary }]}>${provider.hourlyRate}/hr</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
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
    height: 200,
    position: 'relative' as const,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  headerContent: {
    position: 'absolute' as const,
    bottom: 20,
    left: 20,
    right: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  providersSection: {
    padding: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  providerCard: {
    width: CARD_WIDTH,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  providerImage: {
    width: '100%',
    height: CARD_WIDTH * 0.85,
  },
  providerInfo: {
    padding: 12,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 6,
  },
  providerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 8,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  reviewCount: {
    fontSize: 12,
  },
  providerFooter: {
    flexDirection: 'column',
    gap: 4,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
});
