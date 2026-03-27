import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import FirebaseTestComponent from '@/components/FirebaseTestComponent';
import { useTheme } from '@/contexts/ThemeContext';

export default function FirebaseTestScreen() {
  const { colors } = useTheme();
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top', 'bottom']}>
      <Stack.Screen options={{ title: 'Firebase Test' }} />
      <FirebaseTestComponent />
    </SafeAreaView>
  );
}
