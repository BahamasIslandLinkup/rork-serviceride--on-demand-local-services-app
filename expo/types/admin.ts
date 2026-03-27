export type AdminRole = 
  | 'super_admin'
  | 'ops_admin'
  | 'finance_admin'
  | 'trust_safety'
  | 'cs_agent'
  | 'cs_lead'
  | 'auditor';

export type PermissionAction = 
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'reject'
  | 'suspend'
  | 'ban'
  | 'refund'
  | 'payout'
  | 'moderate'
  | 'escalate'
  | 'export';

export type PermissionModule =
  | 'dashboard'
  | 'users'
  | 'merchants'
  | 'bookings'
  | 'payments'
  | 'payouts'
  | 'disputes'
  | 'tickets'
  | 'messages'
  | 'kyc'
  | 'ad_boosts'
  | 'analytics'
  | 'settings'
  | 'audit_logs'
  | 'kb_articles'
  | 'notifications';

export type Permission = {
  module: PermissionModule;
  actions: PermissionAction[];
};

export type AdminUser = {
  id: string;
  email: string;
  name: string;
  role: AdminRole;
  permissions: Permission[];
  mfaEnabled: boolean;
  lastLogin: string;
  ipAllowlist?: string[];
  status: 'active' | 'suspended' | 'inactive';
  createdAt: string;
  updatedAt: string;
};

export type TicketType = 'dispute' | 'support' | 'fraud' | 'feature_request' | 'complaint';

export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';

export type TicketStatus = 
  | 'new'
  | 'open'
  | 'pending'
  | 'awaiting_customer'
  | 'awaiting_merchant'
  | 'in_progress'
  | 'resolved'
  | 'closed';

export type TicketChannel = 'in_app' | 'email' | 'phone' | 'chat';

export type Ticket = {
  id: string;
  type: TicketType;
  subject: string;
  description: string;
  customerId?: string;
  customerName?: string;
  merchantId?: string;
  merchantName?: string;
  bookingId?: string;
  priority: TicketPriority;
  status: TicketStatus;
  channel: TicketChannel;
  tags: string[];
  assigneeId?: string;
  assigneeName?: string;
  slaDeadline?: string;
  slaBreach: boolean;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
};

export type TicketEvent = {
  id: string;
  ticketId: string;
  actorId: string;
  actorName: string;
  actorRole: 'customer' | 'merchant' | 'admin';
  eventType: 
    | 'created'
    | 'status_changed'
    | 'priority_changed'
    | 'assigned'
    | 'reassigned'
    | 'tagged'
    | 'comment_added'
    | 'internal_note_added'
    | 'evidence_uploaded'
    | 'resolution_proposed'
    | 'resolved'
    | 'closed'
    | 'reopened';
  payload: any;
  isInternal: boolean;
  createdAt: string;
};

export type TicketComment = {
  id: string;
  ticketId: string;
  authorId: string;
  authorName: string;
  authorRole: 'customer' | 'merchant' | 'admin';
  text: string;
  attachments?: {
    id: string;
    type: 'image' | 'video' | 'document';
    uri: string;
    name: string;
  }[];
  isInternal: boolean;
  createdAt: string;
};

export type DisputeReason = 
  | 'service_quality'
  | 'payment_issue'
  | 'cancellation'
  | 'no_show'
  | 'price_discrepancy'
  | 'merchant_unprofessional'
  | 'safety_concern'
  | 'other';

export type DisputeOutcome = 
  | 'pending'
  | 'refund_full'
  | 'refund_partial'
  | 'merchant_favor'
  | 'goodwill_credit'
  | 'denied';

export type DisputeStatus = 
  | 'open'
  | 'investigating'
  | 'pending_merchant_response'
  | 'pending_decision'
  | 'resolved'
  | 'rejected';

export type AdminDispute = {
  id: string;
  ticketId: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  reason: DisputeReason;
  requestedAmount: number;
  description: string;
  status: DisputeStatus;
  evidence: {
    id: string;
    type: 'image' | 'video' | 'document';
    uri: string;
    uploadedBy: 'customer' | 'merchant';
    uploadedAt: string;
  }[];
  merchantResponseDeadline?: string;
  merchantResponded: boolean;
  merchantResponse?: string;
  outcome?: DisputeOutcome;
  refundAmount?: number;
  creditAmount?: number;
  resolution?: string;
  resolvedById?: string;
  resolvedByName?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type KYCStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 're_review_required';

export type KYCDocument = {
  id: string;
  merchantId: string;
  type: 'id_card' | 'passport' | 'drivers_license' | 'business_license' | 'bank_statement' | 'proof_of_address';
  status: KYCStatus;
  fileUri: string;
  fileName: string;
  uploadedAt: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  notes?: string;
};

export type MerchantKYC = {
  id: string;
  merchantId: string;
  merchantName: string;
  businessName: string;
  status: KYCStatus;
  documents: KYCDocument[];
  riskScore?: number;
  fraudFlags: string[];
  reviewNotes: string;
  reviewerId?: string;
  reviewerName?: string;
  submittedAt: string;
  reviewedAt?: string;
  approvedAt?: string;
};

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'frozen';

export type AdminPayout = {
  id: string;
  merchantId: string;
  merchantName: string;
  periodStart: string;
  periodEnd: string;
  grossAmount: number;
  commission: number;
  platformFees: number;
  netAmount: number;
  status: PayoutStatus;
  method: 'bank_transfer' | 'paypal' | 'stripe';
  accountDetails: {
    accountNumber?: string;
    routingNumber?: string;
    email?: string;
  };
  scheduledDate: string;
  processedDate?: string;
  reconciliationRef?: string;
  notes?: string;
  frozenReason?: string;
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type RefundReason = 
  | 'duplicate_charge'
  | 'service_not_delivered'
  | 'customer_cancelled'
  | 'merchant_cancelled'
  | 'quality_issue'
  | 'dispute_resolved'
  | 'goodwill'
  | 'other';

export type RefundRequest = {
  id: string;
  bookingId: string;
  paymentId: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  originalAmount: number;
  refundAmount: number;
  refundType: 'full' | 'partial';
  reason: RefundReason;
  reasonDetails?: string;
  status: 'pending' | 'approved' | 'rejected' | 'processed' | 'failed';
  requestedById: string;
  requestedByName: string;
  approvedById?: string;
  approvedByName?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type AdBoostTier = 'basic' | 'standard' | 'premium' | 'featured';

export type AdBoostStatus = 'pending_approval' | 'active' | 'paused' | 'completed' | 'cancelled';

export type AdminAdBoost = {
  id: string;
  merchantId: string;
  merchantName: string;
  tier: AdBoostTier;
  price: number;
  startDate: string;
  endDate: string;
  status: AdBoostStatus;
  placement: string[];
  targeting: {
    islands?: string[];
    categories?: string[];
    radius?: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    leads: number;
    bookings: number;
    revenue: number;
  };
  approvedById?: string;
  approvedByName?: string;
  createdAt: string;
  updatedAt: string;
};

export type ContentModerationAction = 'warn' | 'remove' | 'ban_user' | 'escalate' | 'dismiss';

export type ReportedContent = {
  id: string;
  type: 'message' | 'profile' | 'review' | 'photo' | 'video';
  contentId: string;
  reportedById: string;
  reportedByName: string;
  reportedUserId: string;
  reportedUserName: string;
  reason: string;
  description?: string;
  contentPreview: string;
  attachments?: {
    id: string;
    type: 'image' | 'video';
    uri: string;
  }[];
  status: 'pending' | 'under_review' | 'action_taken' | 'dismissed';
  action?: ContentModerationAction;
  actionReason?: string;
  reviewedById?: string;
  reviewedByName?: string;
  reviewedAt?: string;
  createdAt: string;
};

export type KBArticle = {
  id: string;
  title: string;
  slug: string;
  body: string;
  excerpt: string;
  category: string;
  tags: string[];
  visibility: 'internal' | 'public' | 'draft';
  version: number;
  authorId: string;
  authorName: string;
  lastEditedById?: string;
  lastEditedByName?: string;
  views: number;
  helpful: number;
  notHelpful: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
};

export type NotificationTemplate = {
  id: string;
  name: string;
  slug: string;
  category: 'booking' | 'payment' | 'dispute' | 'kyc' | 'marketing' | 'system';
  channels: ('email' | 'sms' | 'push')[];
  subject?: string;
  body: string;
  variables: {
    key: string;
    description: string;
    example: string;
  }[];
  status: 'active' | 'inactive' | 'draft';
  createdAt: string;
  updatedAt: string;
};

export type AuditLog = {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: AdminRole;
  action: string;
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  diff?: any;
  ipAddress: string;
  userAgent: string;
  metadata?: any;
  createdAt: string;
};

export type DashboardKPI = {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingCompletionRate: number;
  totalRevenue: number;
  platformFees: number;
  merchantPayouts: number;
  adBoostRevenue: number;
  averageBookingValue: number;
  newCustomers: number;
  newMerchants: number;
  pendingKYC: number;
  openDisputes: number;
  disputeRate: number;
  openTickets: number;
  averageResponseTime: number;
  averageResolutionTime: number;
  slaCompliance: number;
};

export type SLADefinition = {
  id: string;
  name: string;
  priority: TicketPriority;
  responseTimeMinutes: number;
  resolutionTimeMinutes: number;
  escalationTimeMinutes?: number;
  businessHoursOnly: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TicketMacro = {
  id: string;
  name: string;
  description: string;
  actions: {
    type: 
      | 'set_status'
      | 'set_priority'
      | 'add_tag'
      | 'assign_to'
      | 'add_comment'
      | 'send_template'
      | 'set_timer'
      | 'request_evidence';
    payload: any;
  }[];
  availableFor: TicketType[];
  createdById: string;
  createdByName: string;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
};

export type FeatureFlag = {
  key: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number;
  targetRoles?: AdminRole[];
  targetUserIds?: string[];
  metadata?: any;
  createdAt: string;
  updatedAt: string;
};

export type SystemSettings = {
  id: string;
  commissionRate: number;
  discoveryFeeMin: number;
  discoveryFeeMax: number;
  adBoostPricing: {
    basic: number;
    standard: number;
    premium: number;
    featured: number;
  };
  refundPolicy: {
    maxDaysAfterBooking: number;
    maxRefundsByRole: {
      [key in AdminRole]?: number;
    };
  };
  dataRetention: {
    tickets: number;
    messages: number;
    kycDocuments: number;
    auditLogs: number;
  };
  updatedAt: string;
  updatedById: string;
  updatedByName: string;
};

export type MerchantDetail = {
  id: string;
  userId: string;
  businessName: string;
  email: string;
  phone: string;
  island: string;
  categories: string[];
  rating: number;
  reviewCount: number;
  completedJobs: number;
  activeJobs: number;
  totalEarnings: number;
  status: 'active' | 'suspended' | 'banned' | 'pending_approval';
  kycStatus: KYCStatus;
  vehicleInfo?: {
    make: string;
    model: string;
    year: number;
    color: string;
    licensePlate: string;
  };
  serviceRadius: number;
  peakHours?: string[];
  averageResponseTime: number;
  cancellationRate: number;
  disputeCount: number;
  lastActiveAt: string;
  createdAt: string;
  suspendedReason?: string;
  suspendedAt?: string;
};

export type CustomerDetail = {
  id: string;
  email: string;
  name: string;
  phone: string;
  island: string;
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalSpent: number;
  averageBookingValue: number;
  lifetimeValue: number;
  disputeCount: number;
  status: 'active' | 'suspended' | 'banned';
  suspendedReason?: string;
  suspendedAt?: string;
  lastBookingAt?: string;
  createdAt: string;
};

export type BookingDetail = {
  id: string;
  bookingNumber: string;
  customerId: string;
  customerName: string;
  merchantId: string;
  merchantName: string;
  serviceCategory: string;
  serviceName: string;
  status: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  price: number;
  commission: number;
  discoveryFee: number;
  totalAmount: number;
  paymentStatus: string;
  location: {
    address: string;
    latitude: number;
    longitude: number;
  };
  timeline: {
    event: string;
    timestamp: string;
    actor: string;
    notes?: string;
  }[];
  vehicleInfo?: {
    make: string;
    model: string;
    color: string;
    licensePlate: string;
  };
  liveTracking?: {
    latitude: number;
    longitude: number;
    heading: number;
    speed: number;
    lastUpdate: string;
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
};
