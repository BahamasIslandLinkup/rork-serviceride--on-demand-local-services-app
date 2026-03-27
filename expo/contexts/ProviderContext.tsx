import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { 
  ProviderProfile, 
  OnboardingProgress,
  KYCDocument,
  ServiceOffering,
  AvailabilitySlot,
  BankAccount,
  VehicleInfo
} from '@/types';
import { 
  getProviderProfile, 
  updateProviderProfile, 
  createProviderProfile,
  subscribeToProviderProfile 
} from '@/services/firestore/provider';

const ONBOARDING_STORAGE_KEY = '@provider_onboarding';

export const [ProviderContextProvider, useProvider] = createContextHook(() => {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress>({
    currentStep: 'kyc',
    completedSteps: [],
    kycCompleted: false,
    servicesCompleted: false,
    pricingCompleted: false,
    availabilityCompleted: false,
    coverageCompleted: false,
    bankCompleted: false,
    isComplete: false,
  });

  useEffect(() => {
    if (user && user.role === 'provider') {
      loadProviderData();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user || user.role !== 'provider') return;

    console.log('[Provider] Setting up profile subscription for user:', user.id);
    const unsubscribe = subscribeToProviderProfile(user.id, (updatedProfile: ProviderProfile | null) => {
      if (updatedProfile) {
        console.log('[Provider] Profile updated via subscription');
        setProfile(updatedProfile);
        updateOnboardingProgress(updatedProfile);
      }
    });

    return () => {
      console.log('[Provider] Cleaning up profile subscription');
      unsubscribe();
    };
  }, [user]);

  const loadProviderData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      console.log('[Provider] Loading profile for user:', user.id);
      
      const savedProgress = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);
      if (savedProgress) {
        setOnboardingProgress(JSON.parse(savedProgress));
      }

      const providerProfile = await getProviderProfile(user.id);
      
      if (!providerProfile) {
        console.log('[Provider] No profile found, creating new one');
        const newProfile: ProviderProfile = {
          id: user.id,
          userId: user.id,
          businessName: user.businessName ?? undefined,
          businessDescription: user.businessDescription ?? undefined,
          bio: user.bio ?? undefined,
          kycStatus: 'pending',
          kycDocuments: [],
          governmentId: user.governmentId ?? undefined,
          businessLicense: user.businessLicense ?? undefined,
          verificationBadges: user.verificationBadges ?? undefined,
          services: [],
          availability: {
            slots: [],
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
          coverageKm: 10,
          vehicleInfo: user.vehicleInfo ?? undefined,
          isOnline: false,
          isBusy: false,
          metrics: {
            totalJobs: 0,
            completedJobs: 0,
            cancelledJobs: 0,
            averageRating: 0,
            totalReviews: 0,
            responseTimeMinutes: 0,
            completionRate: 0,
            onTimeRate: 0,
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        await createProviderProfile(user.id, newProfile);
        setProfile(newProfile);
      } else {
        console.log('[Provider] Profile loaded successfully');
        setProfile(providerProfile);
        updateOnboardingProgress(providerProfile);
      }
    } catch (error) {
      console.error('[Provider] Failed to load provider data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateOnboardingProgress = (profile: ProviderProfile) => {
    const progress: OnboardingProgress = {
      currentStep: 'kyc',
      completedSteps: [],
      kycCompleted: profile.kycStatus === 'approved',
      servicesCompleted: profile.services.length > 0,
      pricingCompleted: profile.services.some(s => s.price > 0),
      availabilityCompleted: profile.availability.slots.length > 0,
      coverageCompleted: profile.coverageKm > 0,
      bankCompleted: !!profile.bankAccount?.isLinked,
      isComplete: false,
    };

    if (progress.kycCompleted) progress.completedSteps.push('kyc');
    if (progress.servicesCompleted) progress.completedSteps.push('services');
    if (progress.pricingCompleted) progress.completedSteps.push('pricing');
    if (progress.availabilityCompleted) progress.completedSteps.push('availability');
    if (progress.coverageCompleted) progress.completedSteps.push('coverage');
    if (progress.bankCompleted) progress.completedSteps.push('bank');

    if (!progress.kycCompleted) progress.currentStep = 'kyc';
    else if (!progress.servicesCompleted) progress.currentStep = 'services';
    else if (!progress.pricingCompleted) progress.currentStep = 'pricing';
    else if (!progress.availabilityCompleted) progress.currentStep = 'availability';
    else if (!progress.coverageCompleted) progress.currentStep = 'coverage';
    else if (!progress.bankCompleted) progress.currentStep = 'bank';

    progress.isComplete = progress.completedSteps.length === 6;

    setOnboardingProgress(progress);
    AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(progress));
  };

  const submitKYC = useCallback(async (documents: KYCDocument[]) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Submitting KYC documents');
      const updatedProfile = {
        ...profile,
        kycDocuments: documents,
        updatedAt: new Date().toISOString(),
      };

      await updateProviderProfile(user.id, { kycDocuments: documents });
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to submit KYC:', error);
      return { success: false, error: 'Failed to submit KYC documents' };
    }
  }, [user, profile]);

  const createService = useCallback(async (service: Omit<ServiceOffering, 'id' | 'providerId' | 'createdAt'>) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Creating service');
      const newService: ServiceOffering = {
        ...service,
        id: `service_${Date.now()}`,
        providerId: user.id,
        createdAt: new Date().toISOString(),
      };

      const updatedServices = [...profile.services, newService];
      await updateProviderProfile(user.id, { services: updatedServices });
      
      const updatedProfile = {
        ...profile,
        services: updatedServices,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true, serviceId: newService.id };
    } catch (error) {
      console.error('[Provider] Failed to create service:', error);
      return { success: false, error: 'Failed to create service' };
    }
  }, [user, profile]);

  const updateService = useCallback(async (serviceId: string, updates: Partial<ServiceOffering>) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Updating service:', serviceId);
      const updatedServices = profile.services.map(s => 
        s.id === serviceId ? { ...s, ...updates } : s
      );

      await updateProviderProfile(user.id, { services: updatedServices });
      
      const updatedProfile = {
        ...profile,
        services: updatedServices,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to update service:', error);
      return { success: false, error: 'Failed to update service' };
    }
  }, [user, profile]);

  const setAvailability = useCallback(async (slots: AvailabilitySlot[]) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Setting availability');
      const availability = {
        ...profile.availability,
        slots,
      };

      await updateProviderProfile(user.id, { availability });
      
      const updatedProfile = {
        ...profile,
        availability,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to set availability:', error);
      return { success: false, error: 'Failed to set availability' };
    }
  }, [user, profile]);

  const setCoverage = useCallback(async (coverageKm: number) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Setting coverage:', coverageKm);
      await updateProviderProfile(user.id, { coverageKm });
      
      const updatedProfile = {
        ...profile,
        coverageKm,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to set coverage:', error);
      return { success: false, error: 'Failed to set coverage' };
    }
  }, [user, profile]);

  const connectBank = useCallback(async (bankAccount: BankAccount) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Connecting bank account');
      await updateProviderProfile(user.id, { bankAccount });
      
      const updatedProfile = {
        ...profile,
        bankAccount,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);
      updateOnboardingProgress(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to connect bank:', error);
      return { success: false, error: 'Failed to connect bank account' };
    }
  }, [user, profile]);

  const setVehicleInfo = useCallback(async (vehicleInfo: VehicleInfo) => {
    if (!user || !profile) return { success: false, error: 'No profile found' };

    try {
      console.log('[Provider] Setting vehicle info');
      await updateProviderProfile(user.id, { vehicleInfo });
      await updateProfile({ vehicleInfo });
      
      const updatedProfile = {
        ...profile,
        vehicleInfo,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);

      return { success: true };
    } catch (error) {
      console.error('[Provider] Failed to set vehicle info:', error);
      return { success: false, error: 'Failed to set vehicle information' };
    }
  }, [user, profile, updateProfile]);

  const toggleOnline = useCallback(async () => {
    if (!user || !profile) return { success: false, error: 'No profile found' };
    if (!onboardingProgress.isComplete) return { success: false, error: 'Complete onboarding first' };
    if (profile.kycStatus !== 'approved') return { success: false, error: 'KYC must be approved' };

    try {
      const isOnline = !profile.isOnline;
      console.log('[Provider] Toggling online status to:', isOnline);
      
      await updateProviderProfile(user.id, { isOnline });
      
      const updatedProfile = {
        ...profile,
        isOnline,
        updatedAt: new Date().toISOString(),
      };
      
      setProfile(updatedProfile);

      return { success: true, isOnline };
    } catch (error) {
      console.error('[Provider] Failed to toggle online:', error);
      return { success: false, error: 'Failed to update online status' };
    }
  }, [user, profile, onboardingProgress]);

  const canGoOnline = useMemo(() => {
    return !!(profile && 
      onboardingProgress.isComplete && 
      profile.kycStatus === 'approved');
  }, [profile, onboardingProgress]);

  const refreshProfile = useCallback(() => {
    loadProviderData();
  }, []);

  return useMemo(
    () => ({
      profile,
      isLoading,
      onboardingProgress,
      canGoOnline,
      submitKYC,
      createService,
      updateService,
      setAvailability,
      setCoverage,
      connectBank,
      setVehicleInfo,
      toggleOnline,
      refreshProfile,
    }),
    [
      profile,
      isLoading,
      onboardingProgress,
      canGoOnline,
      submitKYC,
      createService,
      updateService,
      setAvailability,
      setCoverage,
      connectBank,
      setVehicleInfo,
      toggleOnline,
      refreshProfile,
    ]
  );
});
