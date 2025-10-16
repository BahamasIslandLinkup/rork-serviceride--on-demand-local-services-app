import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Star,
  MapPin,
  Clock,
  CheckCircle,
  Briefcase,
  MessageCircle,
  Play,
  Plus,
  Minus,
  X,
  ShoppingCart,
  ChevronRight,
} from 'lucide-react-native';
import { serviceProviders, mockReviews, catalogItems } from '@/mocks/services';
import { useTheme } from '@/contexts/ThemeContext';
import { useCart } from '@/contexts/CartContext';
import type { CatalogItem } from '@/types';

const { width } = Dimensions.get('window');

export default function ProviderScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { colors } = useTheme();
  const { cart, addToCart, calculateSubtotal, calculateTax, calculatePlatformFee, calculateTotal } = useCart();
  
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>();
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  
  const provider = serviceProviders.find((p) => p.id === id);
  const providerCatalog = catalogItems.filter((item) => item.providerId === id);
  const cartForProvider = cart.providerId === id ? cart.items : [];

  const subtotal = useMemo(() => calculateSubtotal(catalogItems), [calculateSubtotal, catalogItems]);
  const tax = useMemo(() => calculateTax(subtotal), [calculateTax, subtotal]);
  const platformFee = useMemo(() => calculatePlatformFee(subtotal), [calculatePlatformFee, subtotal]);
  const total = useMemo(() => calculateTotal(catalogItems), [calculateTotal, catalogItems]);

  if (!provider) {
    return null;
  }

  const resetSelection = () => {
    setSelectedItem(null);
    setSelectedVariantId(undefined);
    setSelectedAddOnIds([]);
    setQuantity(1);
  };

  const handleAddToCart = () => {
    if (!selectedItem) return;

    const itemToAdd = selectedItem;
    const variantToAdd = selectedVariantId;
    const addOnsToAdd = [...selectedAddOnIds];
    const quantityToAdd = quantity;

    const result = addToCart(itemToAdd, quantityToAdd, variantToAdd, addOnsToAdd);

    if (result.success) {
      resetSelection();
      return;
    }

    if (result.reason === 'different_provider') {
      Alert.alert(
        'Replace Cart Items?',
        'Your cart already has services from another provider. Replace them with this selection?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Replace',
            style: 'destructive',
            onPress: () => {
              const retryResult = addToCart(
                itemToAdd,
                quantityToAdd,
                variantToAdd,
                addOnsToAdd,
                { replaceExisting: true }
              );

              if (retryResult.success) {
                resetSelection();
              }
            },
          },
        ]
      );
    }
  };

  const calculateItemPrice = (item: CatalogItem) => {
    let price = item.price;
    
    if (selectedVariantId && item.variants) {
      const variant = item.variants.find((v) => v.id === selectedVariantId);
      if (variant) {
        price += variant.priceDelta;
      }
    }
    
    if (selectedAddOnIds.length > 0 && item.addOns) {
      selectedAddOnIds.forEach((addOnId) => {
        const addOn = item.addOns!.find((a) => a.id === addOnId);
        if (addOn) {
          price += addOn.price;
        }
      });
    }
    
    return price;
  };

  const toggleAddOn = (addOnId: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(addOnId) ? prev.filter((id) => id !== addOnId) : [...prev, addOnId]
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: '',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
          headerShadowVisible: false,
          headerTransparent: true,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          {provider.image ? (
            <Image source={{ uri: provider.image }} style={styles.headerImage} />
          ) : (
            <View style={[styles.headerImage, { backgroundColor: colors.border }]} />
          )}
          <View style={styles.headerOverlay} />
        </View>

        <View style={styles.content}>
          <View style={[styles.profileSection, { backgroundColor: colors.card }]}>
            <View style={styles.profileHeader}>
              <View>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, { color: colors.text }]}>{provider.name}</Text>
                  {provider.verified && (
                    <CheckCircle size={20} color={colors.primary} fill={colors.primary} />
                  )}
                </View>
                <Text style={[styles.category, { color: colors.textSecondary }]}>
                  {provider.category}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.messageButton, { backgroundColor: colors.primary + '15' }]}
                onPress={() => router.push(`/chat/${provider.id}` as any)}
              >
                <MessageCircle size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.statsRow, { borderTopColor: colors.border }]}>
              <View style={styles.statItem}>
                <Star size={18} color={colors.star} fill={colors.star} />
                <Text style={[styles.statValue, { color: colors.text }]}>{provider.rating}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  ({provider.reviewCount})
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Briefcase size={18} color={colors.primary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{provider.completedJobs}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>jobs</Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.statItem}>
                <Clock size={18} color={colors.secondary} />
                <Text style={[styles.statValue, { color: colors.text }]}>{provider.responseTime}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>About</Text>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
              {provider.description}
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Services Catalog</Text>
            {providerCatalog.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.catalogCard, { backgroundColor: colors.card }]}
                onPress={() => {
                  setSelectedItem(item);
                  setSelectedVariantId(item.variants?.[0]?.id);
                  setSelectedAddOnIds([]);
                  setQuantity(1);
                }}
                activeOpacity={0.7}
              >
                {item.images && item.images[0] ? (
                  <Image source={{ uri: item.images[0] }} style={styles.catalogImage} />
                ) : (
                  <View style={[styles.catalogImage, { backgroundColor: colors.border }]} />
                )}
                <View style={styles.catalogInfo}>
                  <Text style={[styles.catalogTitle, { color: colors.text }]}>{item.title}</Text>
                  <Text style={[styles.catalogDescription, { color: colors.textSecondary }]} numberOfLines={2}>
                    {item.description}
                  </Text>
                  <View style={styles.catalogMeta}>
                    <View style={styles.catalogMetaItem}>
                      <Clock size={14} color={colors.textSecondary} />
                      <Text style={[styles.catalogMetaText, { color: colors.textSecondary }]}>
                        {item.estimatedDuration}
                      </Text>
                    </View>
                    {item.leadTime && (
                      <Text style={[styles.catalogMetaText, { color: colors.textSecondary }]}>
                        • {item.leadTime}
                      </Text>
                    )}
                  </View>
                  <View style={styles.catalogFooter}>
                    <View>
                      <Text style={[styles.catalogPrice, { color: colors.primary }]}>
                        ${item.price}
                        {item.pricingType === 'hourly' && '/hr'}
                      </Text>
                      {item.variants && item.variants.length > 0 && (
                        <Text style={[styles.catalogVariants, { color: colors.textSecondary }]}>
                          {item.variants.length} options
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      style={[styles.addButton, { backgroundColor: colors.primary }]}
                      onPress={() => {
                        setSelectedItem(item);
                        setSelectedVariantId(item.variants?.[0]?.id);
                        setSelectedAddOnIds([]);
                        setQuantity(1);
                      }}
                    >
                      <Plus size={18} color="#fff" strokeWidth={3} />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Reviews</Text>
              <Text style={[styles.seeAll, { color: colors.primary }]}>See all</Text>
            </View>
            {mockReviews.map((review) => (
              <View key={review.id} style={[styles.reviewCard, { backgroundColor: colors.card }]}>
                <View style={styles.reviewHeader}>
                  {review.userImage ? (
                    <Image source={{ uri: review.userImage }} style={styles.reviewerImage} />
                  ) : (
                    <View style={[styles.reviewerImage, { backgroundColor: colors.border }]} />
                  )}
                  <View style={styles.reviewerInfo}>
                    <Text style={[styles.reviewerName, { color: colors.text }]}>{review.userName}</Text>
                    <View style={styles.reviewRating}>
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          color={i < review.rating ? colors.star : colors.border}
                          fill={i < review.rating ? colors.star : 'transparent'}
                        />
                      ))}
                      <Text style={[styles.reviewDate, { color: colors.textSecondary }]}>{review.date}</Text>
                    </View>
                  </View>
                </View>
                {review.videoUrl && (
                  <View style={styles.videoContainer}>
                    <Video
                      source={{ uri: review.videoUrl }}
                      style={styles.video}
                      useNativeControls
                      resizeMode={ResizeMode.COVER}
                      isLooping={false}
                      shouldPlay={playingVideoId === review.id}
                      onPlaybackStatusUpdate={(status) => {
                        if ('isPlaying' in status && !status.isPlaying) {
                          setPlayingVideoId(null);
                        }
                      }}
                    />
                    {playingVideoId !== review.id && (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => setPlayingVideoId(review.id)}
                        activeOpacity={0.8}
                      >
                        <Play size={32} color="#fff" fill="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
                <Text style={[styles.reviewComment, { color: colors.textSecondary }]}>
                  {review.comment}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {cartForProvider.length > 0 && (
        <View style={[styles.cartFooter, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={styles.cartSummary}>
            <View style={styles.cartSummaryRow}>
              <ShoppingCart size={20} color={colors.text} />
              <Text style={[styles.cartItemCount, { color: colors.text }]}>
                {cartForProvider.reduce((sum, item) => sum + item.quantity, 0)} items
              </Text>
            </View>
            <View>
              <Text style={[styles.cartSubtotal, { color: colors.textSecondary }]}>
                Subtotal: ${subtotal.toFixed(2)}
              </Text>
              <Text style={[styles.cartTotal, { color: colors.text }]}>
                Total: ${total.toFixed(2)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={[styles.proceedButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/booking/${provider.id}`)}
            activeOpacity={0.8}
          >
            <Text style={styles.proceedButtonText}>Proceed to Schedule</Text>
            <ChevronRight size={20} color="#fff" strokeWidth={3} />
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={selectedItem !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{selectedItem?.title}</Text>
              <TouchableOpacity onPress={() => setSelectedItem(null)}>
                <X size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {selectedItem && (
                <>
                  {selectedItem.images && selectedItem.images[0] ? (
                    <Image source={{ uri: selectedItem.images[0] }} style={styles.modalImage} />
                  ) : (
                    <View style={[styles.modalImage, { backgroundColor: colors.border }]} />
                  )}
                  <Text style={[styles.modalDescription, { color: colors.textSecondary }]}>
                    {selectedItem.description}
                  </Text>

                  {selectedItem.variants && selectedItem.variants.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Select Option</Text>
                      {selectedItem.variants.map((variant) => (
                        <TouchableOpacity
                          key={variant.id}
                          style={[
                            styles.variantOption,
                            {
                              backgroundColor: selectedVariantId === variant.id ? colors.primary + '15' : colors.background,
                              borderColor: selectedVariantId === variant.id ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => setSelectedVariantId(variant.id)}
                        >
                          <Text style={[styles.variantName, { color: colors.text }]}>{variant.name}</Text>
                          <Text style={[styles.variantPrice, { color: colors.primary }]}>
                            {variant.priceDelta > 0 ? `+$${variant.priceDelta}` : 'Included'}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {selectedItem.addOns && selectedItem.addOns.length > 0 && (
                    <View style={styles.modalSection}>
                      <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Add-ons (Optional)</Text>
                      {selectedItem.addOns.map((addOn) => (
                        <TouchableOpacity
                          key={addOn.id}
                          style={[
                            styles.addOnOption,
                            {
                              backgroundColor: selectedAddOnIds.includes(addOn.id) ? colors.primary + '15' : colors.background,
                              borderColor: selectedAddOnIds.includes(addOn.id) ? colors.primary : colors.border,
                            },
                          ]}
                          onPress={() => toggleAddOn(addOn.id)}
                        >
                          <View style={styles.addOnInfo}>
                            <Text style={[styles.addOnName, { color: colors.text }]}>{addOn.name}</Text>
                            <Text style={[styles.addOnPrice, { color: colors.textSecondary }]}>
                              +${addOn.price}
                            </Text>
                          </View>
                          <View
                            style={[
                              styles.checkbox,
                              {
                                backgroundColor: selectedAddOnIds.includes(addOn.id) ? colors.primary : 'transparent',
                                borderColor: selectedAddOnIds.includes(addOn.id) ? colors.primary : colors.border,
                              },
                            ]}
                          >
                            {selectedAddOnIds.includes(addOn.id) && (
                              <CheckCircle size={16} color="#fff" fill="#fff" />
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  <View style={styles.modalSection}>
                    <Text style={[styles.modalSectionTitle, { color: colors.text }]}>Quantity</Text>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity
                        style={[styles.quantityButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setQuantity(Math.max(1, quantity - 1))}
                      >
                        <Minus size={20} color={colors.text} />
                      </TouchableOpacity>
                      <Text style={[styles.quantityText, { color: colors.text }]}>{quantity}</Text>
                      <TouchableOpacity
                        style={[styles.quantityButton, { backgroundColor: colors.background, borderColor: colors.border }]}
                        onPress={() => setQuantity(quantity + 1)}
                      >
                        <Plus size={20} color={colors.text} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
              <View>
                <Text style={[styles.modalTotalLabel, { color: colors.textSecondary }]}>Total</Text>
                <Text style={[styles.modalTotalPrice, { color: colors.primary }]}>
                  ${selectedItem ? (calculateItemPrice(selectedItem) * quantity).toFixed(2) : '0.00'}
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.modalAddButton, { backgroundColor: colors.primary }]}
                onPress={handleAddToCart}
              >
                <Text style={styles.modalAddButtonText}>Add to Cart</Text>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  header: {
    height: 300,
    position: 'relative' as const,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  content: {
    marginTop: -40,
  },
  profileSection: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: {
        elevation: 5,
      },
      web: {
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      },
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  category: {
    fontSize: 16,
  },
  messageButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  statLabel: {
    fontSize: 14,
  },
  statDivider: {
    width: 1,
    height: 24,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    marginBottom: 12,
  },
  seeAll: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
  },
  catalogCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      },
    }),
  },
  catalogImage: {
    width: '100%',
    height: 200,
  },
  catalogInfo: {
    padding: 16,
  },
  catalogTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    marginBottom: 6,
  },
  catalogDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  catalogMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  catalogMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catalogMetaText: {
    fontSize: 13,
  },
  catalogFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  catalogPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  catalogVariants: {
    fontSize: 12,
    marginTop: 2,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      },
    }),
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  reviewerInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 15,
    fontWeight: '600' as const,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    marginLeft: 8,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
  },
  videoContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    backgroundColor: '#000',
    position: 'relative' as const,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  playButton: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -24 }],
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartFooter: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
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
      web: {
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)',
      },
    }),
  },
  cartSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cartSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cartItemCount: {
    fontSize: 16,
    fontWeight: '600' as const,
  },
  cartSubtotal: {
    fontSize: 13,
    textAlign: 'right' as const,
  },
  cartTotal: {
    fontSize: 18,
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: '#fff',
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
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    flex: 1,
  },
  modalBody: {
    maxHeight: width * 1.2,
  },
  modalImage: {
    width: '100%',
    height: 200,
  },
  modalDescription: {
    fontSize: 15,
    lineHeight: 22,
    padding: 20,
  },
  modalSection: {
    padding: 20,
    paddingTop: 0,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    marginBottom: 12,
  },
  variantOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  variantName: {
    fontSize: 15,
    fontWeight: '500' as const,
  },
  variantPrice: {
    fontSize: 15,
    fontWeight: '600' as const,
  },
  addOnOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 2,
  },
  addOnInfo: {
    flex: 1,
  },
  addOnName: {
    fontSize: 15,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
  addOnPrice: {
    fontSize: 13,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  quantityButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quantityText: {
    fontSize: 20,
    fontWeight: '600' as const,
    minWidth: 40,
    textAlign: 'center' as const,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderTopWidth: 1,
  },
  modalTotalLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  modalTotalPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
  },
  modalAddButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  modalAddButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#fff',
  },
});
