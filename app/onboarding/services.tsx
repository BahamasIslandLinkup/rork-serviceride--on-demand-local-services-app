import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Briefcase, Plus, X, ChevronRight, DollarSign } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { serviceCategories } from '@/mocks/services';

interface Service {
  id: string;
  category: string;
  title: string;
  description: string;
  price: number;
  pricingType: 'fixed' | 'hourly';
}

export default function ServicesScreen() {
  const router = useRouter();
  const { colors } = useTheme();

  const [services, setServices] = useState<Service[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [pricingType, setPricingType] = useState<'fixed' | 'hourly'>('fixed');
  const [saving, setSaving] = useState(false);

  const handleAddService = () => {
    if (!selectedCategory || !title || !description || !price) {
      Alert.alert('Incomplete', 'Please fill in all fields');
      return;
    }

    const newService: Service = {
      id: Date.now().toString(),
      category: selectedCategory,
      title,
      description,
      price: parseFloat(price),
      pricingType,
    };

    setServices(prev => [...prev, newService]);
    setShowAddForm(false);
    setSelectedCategory('');
    setTitle('');
    setDescription('');
    setPrice('');
    setPricingType('fixed');
  };

  const handleRemoveService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  const handleContinue = async () => {
    if (services.length === 0) {
      Alert.alert('No Services', 'Please add at least one service');
      return;
    }

    setSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/onboarding/availability' as any);
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: 'Your Services',
          headerStyle: { backgroundColor: colors.card },
          headerTintColor: colors.text,
        }}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={[styles.iconContainer, { backgroundColor: `${colors.primary}15` }]}>
            <Briefcase size={40} color={colors.primary} strokeWidth={2.5} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>What Services Do You Offer?</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Add the services you provide to start receiving bookings
          </Text>
        </View>

        {services.length > 0 && (
          <View style={styles.servicesContainer}>
            {services.map(service => (
              <View key={service.id} style={[styles.serviceCard, { backgroundColor: colors.card }]}>
                <View style={styles.serviceHeader}>
                  <View style={styles.serviceInfo}>
                    <Text style={[styles.serviceTitle, { color: colors.text }]}>
                      {service.title}
                    </Text>
                    <Text style={[styles.serviceCategory, { color: colors.textSecondary }]}>
                      {service.category}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.removeButton, { backgroundColor: `${colors.error}15` }]}
                    onPress={() => handleRemoveService(service.id)}
                  >
                    <X size={18} color={colors.error} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.serviceDescription, { color: colors.textSecondary }]}>
                  {service.description}
                </Text>
                <View style={styles.servicePricing}>
                  <DollarSign size={16} color={colors.primary} />
                  <Text style={[styles.servicePrice, { color: colors.primary }]}>
                    ${service.price.toFixed(2)}
                    {service.pricingType === 'hourly' ? '/hr' : ''}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {showAddForm ? (
          <View style={[styles.addForm, { backgroundColor: colors.card }]}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: colors.text }]}>Add New Service</Text>
              <TouchableOpacity onPress={() => setShowAddForm(false)}>
                <X size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {serviceCategories.map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor:
                          selectedCategory === cat.name ? colors.primary : colors.background,
                        borderColor: selectedCategory === cat.name ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedCategory(cat.name)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        { color: selectedCategory === cat.name ? '#1E1E1E' : colors.text },
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Service Title</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g., Oil Change & Filter Replacement"
                placeholderTextColor={colors.textLight}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Describe what's included in this service"
                placeholderTextColor={colors.textLight}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.pricingRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Price</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="0.00"
                  placeholderTextColor={colors.textLight}
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Type</Text>
                <View style={styles.pricingTypeButtons}>
                  <TouchableOpacity
                    style={[
                      styles.pricingTypeButton,
                      {
                        backgroundColor: pricingType === 'fixed' ? colors.primary : colors.background,
                        borderColor: pricingType === 'fixed' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setPricingType('fixed')}
                  >
                    <Text
                      style={[
                        styles.pricingTypeText,
                        { color: pricingType === 'fixed' ? '#1E1E1E' : colors.text },
                      ]}
                    >
                      Fixed
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pricingTypeButton,
                      {
                        backgroundColor: pricingType === 'hourly' ? colors.primary : colors.background,
                        borderColor: pricingType === 'hourly' ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setPricingType('hourly')}
                  >
                    <Text
                      style={[
                        styles.pricingTypeText,
                        { color: pricingType === 'hourly' ? '#1E1E1E' : colors.text },
                      ]}
                    >
                      Hourly
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.addServiceButton, { backgroundColor: colors.primary }]}
              onPress={handleAddService}
            >
              <Text style={styles.addServiceButtonText}>Add Service</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => setShowAddForm(true)}
          >
            <Plus size={24} color={colors.primary} strokeWidth={2.5} />
            <Text style={[styles.addButtonText, { color: colors.primary }]}>Add Service</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.continueButton, { opacity: services.length > 0 && !saving ? 1 : 0.5 }]}
          onPress={handleContinue}
          disabled={services.length === 0 || saving}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.continueButtonGradient}
          >
            {saving ? (
              <ActivityIndicator color="#1E1E1E" />
            ) : (
              <>
                <Text style={styles.continueButtonText}>Continue</Text>
                <ChevronRight size={20} color="#1E1E1E" strokeWidth={3} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    padding: 20,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700' as const,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500' as const,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  servicesContainer: {
    gap: 16,
    marginBottom: 16,
  },
  serviceCard: {
    padding: 16,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  serviceCategory: {
    fontSize: 13,
    fontWeight: '500' as const,
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceDescription: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    marginBottom: 12,
  },
  servicePricing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  servicePrice: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  addForm: {
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  categoryScroll: {
    marginHorizontal: -4,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 4,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
  },
  textArea: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: '500' as const,
    minHeight: 100,
  },
  pricingRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pricingTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  pricingTypeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  pricingTypeText: {
    fontSize: 14,
    fontWeight: '600' as const,
  },
  addServiceButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  addServiceButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
  },
  footer: {
    position: 'absolute' as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
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
    }),
  },
  continueButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 18,
    minHeight: 56,
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1E1E1E',
  },
});
