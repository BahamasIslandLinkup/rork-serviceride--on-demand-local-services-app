export type ServiceCategory = {
  id: string;
  name: string;
  icon: string;
  color: string;
  image: string;
};

export type ServiceProvider = {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  image: string;
  description: string;
  skills: string[];
  distance: number;
  responseTime: string;
  completedJobs: number;
  verified: boolean;
  latitude: number;
  longitude: number;
  isFeatured?: boolean;
  featuredPriority?: number;
};

export type VehicleInfo = {
  make: string;
  model: string;
  year: number;
  color: string;
  licensePlate: string;
  imageUri?: string;
};

export type ProviderLocation = {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
};

export type Booking = {
  id: string;
  serviceId?: string;
  clientId: string;
  clientName: string;
  clientImage?: string;
  providerId: string;
  providerName: string;
  providerImage?: string;
  category: string;
  service: string;
  date: string;
  time: string;
  scheduledAt: string;
  status: 'pending' | 'accepted' | 'declined' | 'in-progress' | 'completed' | 'cancelled';
  price: number;
  hours?: number;
  address: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  declineReason?: string;
  providerLocation?: ProviderLocation;
  vehicleInfo?: VehicleInfo;
  estimatedArrival?: string;
  createdAt: string;
  updatedAt: string;
};

export type Review = {
  id: string;
  userName: string;
  userImage: string;
  rating: number;
  comment: string;
  date: string;
  videoUrl?: string;
};

export type MessageAttachment = {
  id: string;
  type: 'image' | 'video';
  uri: string;
  thumbnailUri?: string;
  size: number;
  mimeType: string;
};

export type Message = {
  id: string;
  senderId: string;
  receiverId: string;
  text?: string;
  attachments?: MessageAttachment[];
  timestamp: string;
  read: boolean;
  uploadProgress?: number;
  uploadStatus?: 'uploading' | 'success' | 'failed';
};

export type Conversation = {
  id: string;
  participantId: string;
  participantName: string;
  participantImage: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
};

export type BusinessStats = {
  totalJobs: number;
  activeBookings: number;
  rating: number;
  totalEarnings: number;
  completionRate: number;
};

export type User = {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'customer' | 'provider' | 'admin';
  avatar?: string;
  verified: boolean;
  kycStatus?: 'pending' | 'approved' | 'rejected';
  vehicleInfo?: VehicleInfo;
  createdAt: string;
};

export type PaymentMethod = {
  id: string;
  type: 'card' | 'apple_pay' | 'google_pay';
  last4?: string;
  brand?: string;
  isDefault: boolean;
};

export type Transaction = {
  id: string;
  bookingId: string;
  amount: number;
  commission: number;
  platformFee: number;
  tip: number;
  tax: number;
  status: 'pending' | 'authorized' | 'captured' | 'refunded' | 'failed';
  createdAt: string;
};

export type Payout = {
  id: string;
  providerId: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  scheduledDate: string;
  completedDate?: string;
};

export type DisputeEvidence = {
  id: string;
  type: 'image' | 'video' | 'document';
  uri: string;
  thumbnailUri?: string;
  uploadedAt: string;
};

export type DisputeMessage = {
  id: string;
  disputeId: string;
  senderId: string;
  senderName: string;
  senderRole: 'customer' | 'provider' | 'admin';
  text?: string;
  attachments?: DisputeEvidence[];
  timestamp: string;
  read: boolean;
};

export type Dispute = {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  category: 'service_quality' | 'payment' | 'cancellation' | 'no_show' | 'other';
  reason: string;
  description: string;
  evidence: DisputeEvidence[];
  status: 'open' | 'awaiting_merchant' | 'under_review' | 'resolved' | 'closed';
  resolution?: string;
  assignedAdminId?: string;
  merchantResponseDeadline?: string;
  merchantResponded: boolean;
  createdAt: string;
  resolvedAt?: string;
  messages: DisputeMessage[];
};

export type PromoCode = {
  id: string;
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minAmount?: number;
  maxDiscount?: number;
  expiresAt: string;
  usageLimit: number;
  usageCount: number;
};

export type NotificationCategory = 'booking' | 'message' | 'dispute' | 'payment' | 'promotion' | 'system';

export type NotificationSettings = {
  pushEnabled: boolean;
  categories: {
    booking: boolean;
    message: boolean;
    dispute: boolean;
    payment: boolean;
    promotion: boolean;
    system: boolean;
  };
};

export type Notification = {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationCategory;
  data?: any;
  read: boolean;
  createdAt: string;
};

export type SearchFilters = {
  query: string;
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  maxDistance?: number;
  verifiedOnly: boolean;
  availableNow: boolean;
};

export type CatalogItemVariant = {
  id: string;
  name: string;
  priceDelta: number;
};

export type CatalogItemAddOn = {
  id: string;
  name: string;
  price: number;
};

export type CatalogItem = {
  id: string;
  providerId: string;
  title: string;
  description: string;
  price: number;
  pricingType: 'fixed' | 'hourly';
  images: string[];
  videoUrl?: string;
  estimatedDuration?: string;
  leadTime?: string;
  serviceRadius?: number;
  variants?: CatalogItemVariant[];
  addOns?: CatalogItemAddOn[];
  category: string;
};

export type CartItem = {
  catalogItemId: string;
  providerId: string;
  quantity: number;
  selectedVariantId?: string;
  selectedAddOnIds: string[];
};

export type Cart = {
  items: CartItem[];
  providerId?: string;
};
