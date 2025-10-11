import { Tabs } from "expo-router";
import { Home, Calendar, User, Award, MessageCircle, Search, LifeBuoy } from "lucide-react-native";
import React, { useRef, useEffect } from "react";
import { useTheme } from "@/contexts/ThemeContext";
import { View, Platform, Animated } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

function AnimatedTabIcon({ 
  Icon, 
  color, 
  focused, 
  colors 
}: { 
  Icon: any; 
  color: string; 
  focused: boolean; 
  colors: any;
}) {
  const scaleAnim = useRef(new Animated.Value(focused ? 1 : 0.9)).current;
  const glowAnim = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: focused ? 1 : 0.9,
        useNativeDriver: true,
        tension: 100,
        friction: 7,
      }),
      Animated.timing(glowAnim, {
        toValue: focused ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [focused, scaleAnim, glowAnim]);

  return (
    <Animated.View
      style={{
        transform: [{ scale: scaleAnim }],
      }}
    >
      <View
        style={{
          position: 'relative' as const,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {focused && (
          <Animated.View
            style={{
              position: 'absolute' as const,
              width: 56,
              height: 56,
              borderRadius: 28,
              opacity: glowAnim,
            }}
          >
            <LinearGradient
              colors={[`${colors.primary}40`, `${colors.secondary}20`]}
              style={{
                width: '100%',
                height: '100%',
                borderRadius: 28,
              }}
            />
          </Animated.View>
        )}
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: focused ? colors.primary : 'transparent',
          }}
        >
          <Icon
            size={24}
            color={focused ? '#1E1E1E' : color}
            strokeWidth={focused ? 2.5 : 2}
          />
        </View>
      </View>
    </Animated.View>
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopWidth: 0,
          height: 75,
          paddingBottom: 14,
          paddingTop: 10,
          ...Platform.select({
            ios: {
              shadowColor: colors.primary,
              shadowOffset: { width: 0, height: -6 },
              shadowOpacity: 0.2,
              shadowRadius: 20,
            },
            android: {
              elevation: 12,
            },
            web: {
              boxShadow: `0 -6px 24px ${colors.primary}30, 0 -2px 8px ${colors.shadow}`,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700' as const,
          letterSpacing: 0.5,
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginBottom: 0,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Home}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Search}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="featured"
        options={{
          title: "Featured",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Award}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={MessageCircle}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={Calendar}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="support"
        options={{
          title: "Support",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={LifeBuoy}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <AnimatedTabIcon
              Icon={User}
              color={color}
              focused={focused}
              colors={colors}
            />
          ),
        }}
      />
    </Tabs>
  );
}
