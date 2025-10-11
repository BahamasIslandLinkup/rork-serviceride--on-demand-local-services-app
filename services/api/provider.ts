import type { VehicleInfo } from '@/types';

export interface SubmitKYCRequest {
  idFrontUri: string;
  idBackUri: string;
  selfieUri: string;
  dateOfBirth: string;
  ssn: string;
  address: string;
}

export interface SaveServiceRequest {
  title: string;
  description: string;
  category: string;
  price: number;
  pricingType: 'fixed' | 'hourly';
  estimatedDuration?: string;
  images: string[];
}

export interface SetPricingRequest {
  serviceId: string;
  basePrice: number;
  variants?: { name: string; priceDelta: number }[];
  addOns?: { name: string; price: number }[];
}

export interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

export interface SetAvailabilityRequest {
  slots: AvailabilitySlot[];
  blockedDates?: string[];
}

export interface SetCoverageRequest {
  radiusKm: number;
  centerLat: number;
  centerLng: number;
}

export interface ConnectBankRequest {
  accountHolderName: string;
  accountNumber: string;
  routingNumber: string;
  accountType: 'checking' | 'savings';
}

export interface UpdateVehicleInfoRequest {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  imageUri?: string;
}

export async function submitKYC(request: SubmitKYCRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true };
}

export async function saveService(request: SaveServiceRequest): Promise<{ success: boolean; serviceId?: string; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, serviceId: 'service_' + Date.now() };
}

export async function setPricing(request: SetPricingRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return { success: true };
}

export async function setAvailability(request: SetAvailabilityRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return { success: true };
}

export async function setCoverage(request: SetCoverageRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function connectBank(request: ConnectBankRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  return { success: true };
}

export async function updateVehicleInfo(request: UpdateVehicleInfoRequest): Promise<{ success: boolean; vehicleInfo?: VehicleInfo; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const vehicleInfo: VehicleInfo = {
    make: request.make,
    model: request.model,
    year: request.year,
    color: request.color,
    licensePlate: request.licensePlate,
    imageUri: request.imageUri,
  };
  
  return { success: true, vehicleInfo };
}

export async function getOnboardingStatus(): Promise<{
  kycCompleted: boolean;
  servicesAdded: boolean;
  availabilitySet: boolean;
  bankConnected: boolean;
  canGoOnline: boolean;
}> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return {
    kycCompleted: false,
    servicesAdded: false,
    availabilitySet: false,
    bankConnected: false,
    canGoOnline: false,
  };
}
