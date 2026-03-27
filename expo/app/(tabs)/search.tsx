import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Platform,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;
import { Stack, useRouter } from 'expo-router';
import {
  Search as SearchIcon,
  SlidersHorizontal,
  Star,
  MapPin,
  Clock,
  CheckCircle,
  X,
} from 'lucide-react-native';
import { serviceProviders } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useLocation } from '@/contexts/LocationContext';
import type { SearchFilters } from '@/types';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { location, calculateDistance } = useLocation();

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    maxDistance: undefined,
    verifiedOnly: false,
    availableNow: false,
  });

  const filteredProviders = useMemo(() => {
    let results = [...serviceProviders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.skills.some((s) => s.toLowerCase().includes(query))
      );
    }

    if (filters.minPrice !== undefined) {
      results = results.filter((p) => p.hourlyRate >= filters.minPrice!);
    }

    if (filters.maxPrice !== undefined) {
      results = results.filter((p) => p.hourlyRate <= filters.maxPrice!);
    }

    if (filters.minRating !== undefined) {
      results = results.filter((p) => p.rating >= filters.minRating!);
    }

    if (filters.verifiedOnly) {
      results = results.filter((p) => p.verified);
    }

    if (filters.maxDistance !== undefined && location.coords) {
      results = results.filter((p) => {
        const distance = calculateDistance(
          location.coords!.latitude,
          location.coords!.longitude,
          p.latitude,
          p.longitude
        );
        return distance <= filters.maxDistance!;
      });
    }

    return results;
  }, [searchQuery, filters, location.coords, calculateDistance]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.minPrice !== undefined) count++;
    if (filters.maxPrice !== undefined) count++;
    if (filters.minRating !== undefined) count++;
    if (filters.maxDistance !== undefined) count++;
    if (filters.verifiedOnly) count++;
    if (filters.availableNow) count++;
    return count;
  }, [filters]);

  const clearFilters = () => {
    setFilters({
      query: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      maxDistance: undefined,
      verifiedOnly: false,
      availableNow: false,
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: colors.background,
              borderColor: colors.borderLight,
            },
          ]}
        >
          <SearchIcon size={20} color={colors.textLight} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search services or providers..."
            placeholderTextColor={colors.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={20} color={colors.textLight} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFiltersCount > 0 ? colors.primary : colors.background,
              borderColor: colors.borderLight,
            },
          ]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal
            size={20}
            color={activeFiltersCount > 0 ? '#fff' : colors.text}
          />
          {activeFiltersCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: colors.secondary }]}>
              <Text style={styles.filterBadgeText}>{activeFiltersCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card }]}>
          <View style={styles.filterHeader}>
            <Text style={[styles.filterTitle, { color: colors.text }]}>Filters</Text>
            {activeFiltersCount > 0 && (
              <TouchableOpacity onPress={clearFilters}>
                <Text style={[styles.clearText, { color: colors.primary }]}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Price Range</Text>
            <View style={styles.priceInputs}>
              <TextInput
                style={[
                  styles.priceInput,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                placeholder="Min"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={filters.minPrice?.toString() || ''}
                onChangeText={(text) =>
                  setFilters({ ...filters, minPrice: text ? parseInt(text) : undefined })
                }
              />
              <Text style={[styles.priceSeparator, { color: colors.textSecondary }]}>to</Text>
              <TextInput
                style={[
                  styles.priceInput,
                  { backgroundColor: colors.background, color: colors.text },
                ]}
                placeholder="Max"
                placeholderTextColor={colors.textLight}
                keyboardType="numeric"
                value={filters.maxPrice?.toString() || ''}
                onChangeText={(text) =>
                  setFilters({ ...filters, maxPrice: text ? parseInt(text) : undefined })
                }
              />
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>Minimum Rating</Text>
            <View style={styles.ratingButtons}>
              {[3, 3.5, 4, 4.5, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    {
                      backgroundColor:
                        filters.minRating === rating ? colors.primary : colors.background,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      minRating: filters.minRating === rating ? undefined : rating,
                    })
                  }
                >
                  <Star
                    size={14}
                    color={filters.minRating === rating ? '#fff' : colors.star}
                    fill={filters.minRating === rating ? '#fff' : colors.star}
                  />
                  <Text
                    style={[
                      styles.ratingButtonText,
                      { color: filters.minRating === rating ? '#fff' : colors.text },
                    ]}
                  >
                    {rating}+
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.text }]}>
              Max Distance (miles)
            </Text>
            <View style={styles.distanceButtons}>
              {[5, 10, 25, 50].map((distance) => (
                <TouchableOpacity
                  key={distance}
                  style={[
                    styles.distanceButton,
                    {
                      backgroundColor:
                        filters.maxDistance === distance ? colors.primary : colors.background,
                      borderColor: colors.borderLight,
                    },
                  ]}
                  onPress={() =>
                    setFilters({
                      ...filters,
                      maxDistance: filters.maxDistance === distance ? undefined : distance,
                    })
                  }
                >
                  <Text
                    style={[
                      styles.distanceButtonText,
                      { color: filters.maxDistance === distance ? '#fff' : colors.text },
                    ]}
                  >
                    {distance} mi
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TouchableOpacity
            style={[
              styles.toggleFilter,
              { backgroundColor: filters.verifiedOnly ? colors.primary + '15' : 'transparent' },
            ]}
            onPress={() => setFilters({ ...filters, verifiedOnly: !filters.verifiedOnly })}
          >
            <View style={styles.toggleLeft}>
              <CheckCircle
                size={20}
                color={filters.verifiedOnly ? colors.primary : colors.textSecondary}
              />
              <Text style={[styles.toggleText, { color: colors.text }]}>Verified Only</Text>
            </View>
            <View
              style={[
                styles.toggleIndicator,
                {
                  backgroundColor: filters.verifiedOnly ? colors.primary : colors.border,
                },
              ]}
            >
              {filters.verifiedOnly && <View style={styles.toggleDot} />}
            </View>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
          {filteredProviders.length} provider{filteredProviders.length !== 1 ? 's' : ''} found
        </Text>

        <View style={styles.providersGrid}>
          {filteredProviders.map((provider) => {
          const distance = location.coords
            ? calculateDistance(
                location.coords.latitude,
                location.coords.longitude,
                provider.latitude,
                provider.longitude
              )
            : provider.distance;

            return (
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

                  <Text style={[styles.category, { color: colors.textSecondary }]} numberOfLines={1}>
                    {provider.category}
                  </Text>

                  <View style={styles.statsRow}>
                    <View style={styles.stat}>
                      <Star size={12} color={colors.star} fill={colors.star} />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {provider.rating}
                      </Text>
                    </View>

                    <View style={styles.stat}>
                      <MapPin size={12} color={colors.textSecondary} />
                      <Text style={[styles.statText, { color: colors.text }]}>
                        {distance.toFixed(1)} mi
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.price, { color: colors.primary }]}>
                    ${provider.hourlyRate}/hr
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {filteredProviders.length === 0 && (
          <View style={styles.emptyState}>
            <SearchIcon size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Try adjusting your search or filters
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 12,
    gap: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    color: '#1E1E1E',
    fontSize: 10,
    fontWeight: '700' as const,
  },
  filtersPanel: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  filterSection: {
    marginBottom: 20,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    height: 44,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  priceSeparator: {
    fontSize: 14,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  ratingButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  distanceButtons: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  distanceButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  distanceButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
  },
  toggleFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  toggleIndicator: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    alignSelf: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  resultsCount: {
    fontSize: 14,
    fontWeight: '500' as const,
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  providersGrid: {
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
  category: {
    fontSize: 12,
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  statText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    textAlign: 'center' as const,
  },
});
