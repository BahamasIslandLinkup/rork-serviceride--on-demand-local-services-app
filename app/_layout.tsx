import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, useTheme } from "@/contexts/ThemeContext";
import { LocationProvider } from "@/contexts/LocationContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminProvider } from "@/contexts/AdminContext";
import { PaymentProvider } from "@/contexts/PaymentContext";
import { CartProvider } from "@/contexts/CartContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { BookingProvider } from "@/contexts/BookingContext";
import { ActivityIndicator, View } from "react-native";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      console.log('[Navigation] Auth loading...');
      return;
    }

    const inAuthGroup = segments[0] === 'auth';
    console.log('[Navigation] Auth state:', { isAuthenticated, inAuthGroup, segments });

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[Navigation] Redirecting to login - user not authenticated');
      router.replace('/auth/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[Navigation] Redirecting to tabs - user authenticated');
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments, isLoading, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  
  return (
    <Stack
      screenOptions={{
        headerBackTitle: "Back",
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen name="auth/login" options={{ headerShown: false }} />
      <Stack.Screen name="auth/signup" options={{ headerShown: false }} />
      <Stack.Screen name="auth/reset-password" options={{ headerShown: false }} />
      <Stack.Screen name="auth/verify" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="category/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="provider/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="booking/[id]" options={{ headerShown: true, title: "Book Service" }} />
      <Stack.Screen name="booking-detail/[id]" options={{ headerShown: true, title: "Booking Details" }} />
      <Stack.Screen name="checkout/[bookingId]" options={{ headerShown: true, title: "Checkout" }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: true, title: "Payment Methods" }} />
      <Stack.Screen name="review/[bookingId]" options={{ headerShown: true, presentation: "modal", title: "Rate & Review" }} />
      <Stack.Screen name="notifications" options={{ headerShown: true, title: "Notifications" }} />
      <Stack.Screen name="firebase-test" options={{ headerShown: true, title: "Firebase Test" }} />
      <Stack.Screen name="testing-checklist" options={{ headerShown: false }} />
      <Stack.Screen name="business-dashboard" options={{ headerShown: true, title: "Business Dashboard" }} />
      <Stack.Screen name="chat/[id]" options={{ headerShown: true }} />
      <Stack.Screen name="dispute/new" options={{ headerShown: true, title: "New Dispute" }} />
      <Stack.Screen name="dispute/[id]" options={{ headerShown: true, title: "Dispute Details" }} />
      <Stack.Screen name="onboarding/availability" options={{ headerShown: true, title: "Set Availability" }} />
      <Stack.Screen name="onboarding/kyc" options={{ headerShown: true, title: "KYC Verification" }} />
      <Stack.Screen name="onboarding/services" options={{ headerShown: true, title: "Your Services" }} />
      <Stack.Screen name="onboarding/complete" options={{ headerShown: false }} />
      <Stack.Screen name="provider/earnings" options={{ headerShown: true, title: "Earnings" }} />
      <Stack.Screen name="settings/notifications" options={{ headerShown: true, title: "Notification Settings" }} />
      <Stack.Screen name="tracking/[bookingId]" options={{ headerShown: true, title: "Track Provider" }} />
      <Stack.Screen name="admin/login" options={{ headerShown: false }} />
      <Stack.Screen name="admin/dashboard" options={{ headerShown: true }} />
      <Stack.Screen name="admin/tickets" options={{ headerShown: true, title: "Tickets" }} />
      <Stack.Screen name="admin/disputes" options={{ headerShown: true, title: "Disputes" }} />
      <Stack.Screen name="admin/merchants" options={{ headerShown: true, title: "Merchants" }} />
      <Stack.Screen name="admin/users" options={{ headerShown: true, title: "Users" }} />
      <Stack.Screen name="admin/bookings" options={{ headerShown: true, title: "Bookings" }} />
      <Stack.Screen name="admin/settings" options={{ headerShown: true, title: "Admin Settings" }} />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AdminProvider>
          <AuthProvider>
            <NotificationProvider>
              <BookingProvider>
                <PaymentProvider>
                  <LocationProvider>
                    <CartProvider>
                      <GestureHandlerRootView style={{ flex: 1 }}>
                        <RootLayoutNav />
                      </GestureHandlerRootView>
                    </CartProvider>
                  </LocationProvider>
                </PaymentProvider>
              </BookingProvider>
            </NotificationProvider>
          </AuthProvider>
        </AdminProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
