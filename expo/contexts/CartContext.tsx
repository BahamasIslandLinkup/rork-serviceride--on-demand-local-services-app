import { useEffect, useState, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import createContextHook from '@nkzw/create-context-hook';
import type { Cart, CartItem, CatalogItem } from '@/types';
import { Platform } from 'react-native';

const CART_STORAGE_KEY = '@island_linkup_cart';
const TAX_RATE = 0.075;
const PLATFORM_FEE_RATE = 0.05;

type AddToCartResult =
  | { success: true; replaced?: boolean }
  | { success: false; reason: 'different_provider' };

type AddToCartOptions = {
  replaceExisting?: boolean;
};

const normalizeAddOnIds = (ids: string[] = []) => [...ids].sort().join('|');
const cloneAddOnIds = (ids: string[] = []) => [...ids];

export const [CartProvider, useCart] = createContextHook(() => {
  const [cart, setCart] = useState<Cart>({ items: [], providerId: undefined });
  const [isLoading, setIsLoading] = useState(true);

  const loadCart = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        setCart(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const saveCart = useCallback(async (newCart: Cart) => {
    try {
      await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newCart));
      setCart(newCart);
    } catch (error) {
      console.error('Failed to save cart:', error);
    }
  }, []);

  const addToCart = useCallback((
    catalogItem: CatalogItem,
    quantity: number = 1,
    selectedVariantId?: string,
    selectedAddOnIds: string[] = [],
    options: AddToCartOptions = {}
  ): AddToCartResult => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (cart.providerId && cart.providerId !== catalogItem.providerId) {
      if (!options.replaceExisting) {
        return { success: false, reason: 'different_provider' };
      }

      const freshCart: Cart = {
        items: [
          {
            catalogItemId: catalogItem.id,
            providerId: catalogItem.providerId,
            quantity,
            selectedVariantId,
            selectedAddOnIds: cloneAddOnIds(selectedAddOnIds),
          },
        ],
        providerId: catalogItem.providerId,
      };

      saveCart(freshCart);
      return { success: true, replaced: true };
    }

    const targetAddOnSignature = normalizeAddOnIds(selectedAddOnIds);
    const existingItemIndex = cart.items.findIndex(
      (item) =>
        item.catalogItemId === catalogItem.id &&
        item.selectedVariantId === selectedVariantId &&
        normalizeAddOnIds(item.selectedAddOnIds) === targetAddOnSignature
    );

    let newItems: CartItem[];

    if (existingItemIndex >= 0) {
      newItems = [...cart.items];
      newItems[existingItemIndex] = {
        ...newItems[existingItemIndex],
        quantity: newItems[existingItemIndex].quantity + quantity,
      };
    } else {
      newItems = [
        ...cart.items,
        {
          catalogItemId: catalogItem.id,
          providerId: catalogItem.providerId,
          quantity,
          selectedVariantId,
          selectedAddOnIds: cloneAddOnIds(selectedAddOnIds),
        },
      ];
    }

    saveCart({
      items: newItems,
      providerId: catalogItem.providerId,
    });

    return { success: true };
  }, [cart, saveCart]);

  const removeFromCart = useCallback((
    catalogItemId: string,
    selectedVariantId?: string,
    selectedAddOnIds: string[] = []
  ) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const targetAddOnSignature = normalizeAddOnIds(selectedAddOnIds);
    const newItems = cart.items.filter(
      (item) =>
        !(
          item.catalogItemId === catalogItemId &&
          item.selectedVariantId === selectedVariantId &&
          normalizeAddOnIds(item.selectedAddOnIds) === targetAddOnSignature
        )
    );

    saveCart({
      items: newItems,
      providerId: newItems.length > 0 ? cart.providerId : undefined,
    });
  }, [cart, saveCart]);

  const updateCartItemQuantity = useCallback((
    catalogItemId: string,
    quantity: number,
    selectedVariantId?: string,
    selectedAddOnIds: string[] = []
  ) => {
    if (quantity <= 0) {
      removeFromCart(catalogItemId, selectedVariantId, selectedAddOnIds);
      return;
    }

    const targetAddOnSignature = normalizeAddOnIds(selectedAddOnIds);
    const newItems = cart.items.map((item) => {
      if (
        item.catalogItemId === catalogItemId &&
        item.selectedVariantId === selectedVariantId &&
        normalizeAddOnIds(item.selectedAddOnIds) === targetAddOnSignature
      ) {
        return { ...item, quantity };
      }
      return item;
    });

    saveCart({ ...cart, items: newItems });
  }, [cart, saveCart, removeFromCart]);

  const clearCart = useCallback(() => {
    saveCart({ items: [], providerId: undefined });
  }, [saveCart]);

  const getCartItemCount = useCallback(() => {
    return cart.items.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart.items]);

  const calculateItemPrice = useCallback((
    catalogItem: CatalogItem,
    cartItem: CartItem
  ): number => {
    let price = catalogItem.price;

    if (cartItem.selectedVariantId && catalogItem.variants) {
      const variant = catalogItem.variants.find((v) => v.id === cartItem.selectedVariantId);
      if (variant) {
        price += variant.priceDelta;
      }
    }

    if (cartItem.selectedAddOnIds.length > 0 && catalogItem.addOns) {
      cartItem.selectedAddOnIds.forEach((addOnId) => {
        const addOn = catalogItem.addOns!.find((a) => a.id === addOnId);
        if (addOn) {
          price += addOn.price;
        }
      });
    }

    return price * cartItem.quantity;
  }, []);

  const calculateSubtotal = useCallback((catalogItems: CatalogItem[]): number => {
    return cart.items.reduce((sum, cartItem) => {
      const catalogItem = catalogItems.find((item) => item.id === cartItem.catalogItemId);
      if (!catalogItem) return sum;
      return sum + calculateItemPrice(catalogItem, cartItem);
    }, 0);
  }, [cart.items, calculateItemPrice]);

  const calculateTax = useCallback((subtotal: number): number => {
    return subtotal * TAX_RATE;
  }, []);

  const calculatePlatformFee = useCallback((subtotal: number): number => {
    return subtotal * PLATFORM_FEE_RATE;
  }, []);

  const calculateTotal = useCallback((catalogItems: CatalogItem[]): number => {
    const subtotal = calculateSubtotal(catalogItems);
    const tax = calculateTax(subtotal);
    const platformFee = calculatePlatformFee(subtotal);
    return subtotal + tax + platformFee;
  }, [calculateSubtotal, calculateTax, calculatePlatformFee]);

  return useMemo(() => ({
    cart,
    isLoading,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    calculateItemPrice,
    calculateSubtotal,
    calculateTax,
    calculatePlatformFee,
    calculateTotal,
  }), [
    cart,
    isLoading,
    addToCart,
    updateCartItemQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount,
    calculateItemPrice,
    calculateSubtotal,
    calculateTax,
    calculatePlatformFee,
    calculateTotal,
  ]);
});
