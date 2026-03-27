import type { Booking } from '@/types';

export interface GetBookingRequest {
  id: string;
}

export interface ListBookingsRequest {
  role: 'customer' | 'provider';
  status?: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  page?: number;
  limit?: number;
}

export interface UpdateBookingStatusRequest {
  id: string;
  status: 'pending' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface AddTipRequest {
  bookingId: string;
  amount: number;
}

export interface ModifyBookingRequest {
  id: string;
  date?: string;
  time?: string;
  notes?: string;
}

export async function getBooking(request: GetBookingRequest): Promise<Booking | null> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const mockBooking: Booking = {
    id: request.id,
    providerId: '1',
    providerName: 'Mike Johnson',
    providerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    category: 'Auto Repair',
    service: 'Brake Inspection & Repair',
    date: '2025-10-12',
    time: '10:00 AM',
    status: 'confirmed',
    price: 170,
    address: '123 Main St, Your City',
    vehicleInfo: {
      make: 'Toyota',
      model: 'Camry',
      year: 2019,
      color: 'Silver',
      licensePlate: 'ABC-1234',
    },
    providerLocation: {
      latitude: 25.0343,
      longitude: -77.3963,
      timestamp: new Date().toISOString(),
    },
    estimatedArrival: '9:45 AM',
  };
  
  return mockBooking;
}

export async function listBookings(request: ListBookingsRequest): Promise<Booking[]> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const mockBookings: Booking[] = [
    {
      id: '1',
      providerId: '1',
      providerName: 'Mike Johnson',
      providerImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
      category: 'Auto Repair',
      service: 'Brake Inspection & Repair',
      date: '2025-10-12',
      time: '10:00 AM',
      status: 'confirmed',
      price: 170,
      address: '123 Main St, Your City',
    },
    {
      id: '2',
      providerId: '2',
      providerName: 'Sarah Martinez',
      providerImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
      category: 'House Cleaning',
      service: 'Deep Cleaning',
      date: '2025-10-15',
      time: '2:00 PM',
      status: 'pending',
      price: 180,
      address: '123 Main St, Your City',
    },
  ];
  
  if (request.status) {
    return mockBookings.filter(b => b.status === request.status);
  }
  
  return mockBookings;
}

export async function updateBookingStatus(request: UpdateBookingStatusRequest): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const booking = await getBooking({ id: request.id });
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }
  
  return {
    success: true,
    booking: { ...booking, status: request.status },
  };
}

export async function addTip(request: AddTipRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function modifyBooking(request: ModifyBookingRequest): Promise<{ success: boolean; booking?: Booking; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  const booking = await getBooking({ id: request.id });
  if (!booking) {
    return { success: false, error: 'Booking not found' };
  }
  
  return {
    success: true,
    booking: {
      ...booking,
      date: request.date || booking.date,
      time: request.time || booking.time,
    },
  };
}

export async function cancelBooking(bookingId: string, reason?: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return { success: true };
}

export async function confirmCompletion(bookingId: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}
