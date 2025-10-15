import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import type {
  AdminUser,
  Ticket,
  TicketEvent,
  TicketComment,
  AdminDispute,
  MerchantKYC,
  KYCDocument,
  AdminPayout,
  RefundRequest,
  AdminAdBoost,
  ReportedContent,
  KBArticle,
  NotificationTemplate,
  AuditLog,
  DashboardKPI,
  MerchantDetail,
  CustomerDetail,
  BookingDetail,
  SLADefinition,
  TicketMacro,
  FeatureFlag,
  SystemSettings,
} from '@/types/admin';

export async function createAuditLog(
  actorId: string,
  actorName: string,
  actorRole: string,
  action: string,
  entityType: string,
  entityId: string,
  before?: any,
  after?: any,
  metadata?: any
): Promise<void> {
  try {
    const auditLogRef = doc(collection(db, 'auditLogs'));
    const diff = before && after ? calculateDiff(before, after) : null;

    await setDoc(auditLogRef, {
      actorId,
      actorName,
      actorRole,
      action,
      entityType,
      entityId,
      before: before || null,
      after: after || null,
      diff,
      ipAddress: 'unknown',
      userAgent: 'unknown',
      metadata: metadata || null,
      createdAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('[Admin] Failed to create audit log:', error);
  }
}

function calculateDiff(before: any, after: any): any {
  const diff: any = {};
  const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
  
  allKeys.forEach(key => {
    if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
      diff[key] = {
        before: before[key],
        after: after[key],
      };
    }
  });
  
  return diff;
}

export async function getTickets(filters?: {
  status?: string;
  priority?: string;
  type?: string;
  assigneeId?: string;
  customerId?: string;
  merchantId?: string;
  limitCount?: number;
}): Promise<Ticket[]> {
  try {
    let q = query(collection(db, 'tickets'), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('status', '==', filters.status));
    }
    if (filters?.priority) {
      q = query(q, where('priority', '==', filters.priority));
    }
    if (filters?.type) {
      q = query(q, where('type', '==', filters.type));
    }
    if (filters?.assigneeId) {
      q = query(q, where('assigneeId', '==', filters.assigneeId));
    }
    if (filters?.customerId) {
      q = query(q, where('customerId', '==', filters.customerId));
    }
    if (filters?.merchantId) {
      q = query(q, where('merchantId', '==', filters.merchantId));
    }
    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
      closedAt: doc.data().closedAt?.toDate().toISOString(),
      slaDeadline: doc.data().slaDeadline?.toDate().toISOString(),
    })) as Ticket[];
  } catch (error) {
    console.error('[Admin] Failed to get tickets:', error);
    throw error;
  }
}

export async function getTicketById(ticketId: string): Promise<Ticket | null> {
  try {
    const ticketDoc = await getDoc(doc(db, 'tickets', ticketId));
    if (!ticketDoc.exists()) return null;

    const data = ticketDoc.data();
    return {
      id: ticketDoc.id,
      ...data,
      createdAt: data.createdAt?.toDate().toISOString(),
      updatedAt: data.updatedAt?.toDate().toISOString(),
      resolvedAt: data.resolvedAt?.toDate().toISOString(),
      closedAt: data.closedAt?.toDate().toISOString(),
      slaDeadline: data.slaDeadline?.toDate().toISOString(),
    } as Ticket;
  } catch (error) {
    console.error('[Admin] Failed to get ticket:', error);
    throw error;
  }
}

export async function updateTicket(
  ticketId: string,
  updates: Partial<Ticket>,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const ticketRef = doc(db, 'tickets', ticketId);
    const before = await getDoc(ticketRef);

    await updateDoc(ticketRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'update_ticket',
      'ticket',
      ticketId,
      before.data(),
      { ...before.data(), ...updates }
    );
  } catch (error) {
    console.error('[Admin] Failed to update ticket:', error);
    throw error;
  }
}

export async function createTicket(
  ticket: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt'>,
  adminId: string,
  adminName: string
): Promise<string> {
  try {
    const ticketRef = doc(collection(db, 'tickets'));
    const now = Timestamp.now();

    await setDoc(ticketRef, {
      ...ticket,
      createdAt: now,
      updatedAt: now,
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'create_ticket',
      'ticket',
      ticketRef.id,
      null,
      ticket
    );

    return ticketRef.id;
  } catch (error) {
    console.error('[Admin] Failed to create ticket:', error);
    throw error;
  }
}

export async function addTicketComment(
  ticketId: string,
  comment: Omit<TicketComment, 'id' | 'createdAt'>,
  adminId: string,
  adminName: string
): Promise<string> {
  try {
    const commentRef = doc(collection(db, 'ticketComments'));
    await setDoc(commentRef, {
      ...comment,
      ticketId,
      createdAt: Timestamp.now(),
    });

    await updateDoc(doc(db, 'tickets', ticketId), {
      updatedAt: Timestamp.now(),
    });

    if (!comment.isInternal) {
      await createAuditLog(
        adminId,
        adminName,
        'admin',
        'add_ticket_comment',
        'ticket',
        ticketId,
        null,
        comment
      );
    }

    return commentRef.id;
  } catch (error) {
    console.error('[Admin] Failed to add ticket comment:', error);
    throw error;
  }
}

export async function getTicketComments(ticketId: string): Promise<TicketComment[]> {
  try {
    const q = query(
      collection(db, 'ticketComments'),
      where('ticketId', '==', ticketId),
      orderBy('createdAt', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    })) as TicketComment[];
  } catch (error) {
    console.error('[Admin] Failed to get ticket comments:', error);
    throw error;
  }
}

export async function getDisputes(filters?: {
  status?: string;
  limitCount?: number;
}): Promise<AdminDispute[]> {
  try {
    let q = query(collection(db, 'adminDisputes'), orderBy('createdAt', 'desc'));

    if (filters?.status) {
      q = query(q, where('outcome', '==', filters.status));
    }
    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
      resolvedAt: doc.data().resolvedAt?.toDate().toISOString(),
      merchantResponseDeadline: doc.data().merchantResponseDeadline?.toDate().toISOString(),
    })) as AdminDispute[];
  } catch (error) {
    console.error('[Admin] Failed to get disputes:', error);
    throw error;
  }
}

export async function resolveDispute(
  disputeId: string,
  outcome: string,
  resolution: string,
  refundAmount: number | undefined,
  creditAmount: number | undefined,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const disputeRef = doc(db, 'adminDisputes', disputeId);
    const before = await getDoc(disputeRef);

    await updateDoc(disputeRef, {
      outcome,
      resolution,
      refundAmount: refundAmount || null,
      creditAmount: creditAmount || null,
      resolvedById: adminId,
      resolvedByName: adminName,
      resolvedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'resolve_dispute',
      'dispute',
      disputeId,
      before.data(),
      { outcome, resolution, refundAmount, creditAmount }
    );
  } catch (error) {
    console.error('[Admin] Failed to resolve dispute:', error);
    throw error;
  }
}

export async function getPendingKYC(): Promise<MerchantKYC[]> {
  try {
    const q = query(
      collection(db, 'merchantKYC'),
      where('status', 'in', ['pending', 'under_review']),
      orderBy('submittedAt', 'desc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      submittedAt: doc.data().submittedAt?.toDate().toISOString(),
      reviewedAt: doc.data().reviewedAt?.toDate().toISOString(),
      approvedAt: doc.data().approvedAt?.toDate().toISOString(),
    })) as MerchantKYC[];
  } catch (error) {
    console.error('[Admin] Failed to get pending KYC:', error);
    throw error;
  }
}

export async function reviewKYC(
  kycId: string,
  status: 'approved' | 'rejected',
  notes: string,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const kycRef = doc(db, 'merchantKYC', kycId);
    const before = await getDoc(kycRef);
    const now = Timestamp.now();

    const updates: any = {
      status,
      reviewNotes: notes,
      reviewerId: adminId,
      reviewerName: adminName,
      reviewedAt: now,
      updatedAt: now,
    };

    if (status === 'approved') {
      updates.approvedAt = now;
    }

    await updateDoc(kycRef, updates);

    const kycData = before.data();
    if (kycData?.merchantId) {
      await updateDoc(doc(db, 'users', kycData.merchantId), {
        kycStatus: status,
      });
    }

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'review_kyc',
      'kyc',
      kycId,
      before.data(),
      { status, notes }
    );
  } catch (error) {
    console.error('[Admin] Failed to review KYC:', error);
    throw error;
  }
}

export async function getPendingPayouts(): Promise<AdminPayout[]> {
  try {
    const q = query(
      collection(db, 'payouts'),
      where('status', '==', 'pending'),
      orderBy('scheduledDate', 'asc')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      scheduledDate: doc.data().scheduledDate?.toDate().toISOString(),
      processedDate: doc.data().processedDate?.toDate().toISOString(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
      updatedAt: doc.data().updatedAt?.toDate().toISOString(),
    })) as AdminPayout[];
  } catch (error) {
    console.error('[Admin] Failed to get pending payouts:', error);
    throw error;
  }
}

export async function approvePayout(
  payoutId: string,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const payoutRef = doc(db, 'payouts', payoutId);
    const before = await getDoc(payoutRef);

    await updateDoc(payoutRef, {
      status: 'processing',
      approvedById: adminId,
      approvedByName: adminName,
      processedDate: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'approve_payout',
      'payout',
      payoutId,
      before.data(),
      { status: 'processing' }
    );
  } catch (error) {
    console.error('[Admin] Failed to approve payout:', error);
    throw error;
  }
}

export async function processRefund(
  refundRequest: Omit<RefundRequest, 'id' | 'createdAt' | 'updatedAt'>,
  adminId: string,
  adminName: string
): Promise<string> {
  try {
    const refundRef = doc(collection(db, 'refunds'));
    const now = Timestamp.now();

    await setDoc(refundRef, {
      ...refundRequest,
      requestedById: adminId,
      requestedByName: adminName,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'process_refund',
      'refund',
      refundRef.id,
      null,
      refundRequest
    );

    return refundRef.id;
  } catch (error) {
    console.error('[Admin] Failed to process refund:', error);
    throw error;
  }
}

export async function getDashboardKPIs(dateRange?: {
  start: string;
  end: string;
}): Promise<DashboardKPI> {
  try {
    const bookingsSnapshot = await getDocs(collection(db, 'bookings'));
    const paymentsSnapshot = await getDocs(collection(db, 'payments'));
    const disputesSnapshot = await getDocs(collection(db, 'disputes'));
    const ticketsSnapshot = await getDocs(collection(db, 'tickets'));

    const bookings = bookingsSnapshot.docs.map(d => d.data());
    const payments = paymentsSnapshot.docs.map(d => d.data());
    const disputes = disputesSnapshot.docs.map(d => d.data());
    const tickets = ticketsSnapshot.docs.map(d => d.data());

    const totalBookings = bookings.length;
    const activeBookings = bookings.filter(b => 
      ['accepted', 'in-progress'].includes(b.status)
    ).length;
    const completedBookings = bookings.filter(b => b.status === 'completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'cancelled').length;

    const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const platformFees = payments.reduce((sum, p) => sum + (p.platformFee || 0), 0);

    const openDisputes = disputes.filter(d => 
      ['open', 'awaiting_merchant', 'under_review'].includes(d.status)
    ).length;

    const openTickets = tickets.filter(t => 
      ['new', 'open', 'in_progress'].includes(t.status)
    ).length;

    return {
      totalBookings,
      activeBookings,
      completedBookings,
      cancelledBookings,
      bookingCompletionRate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      totalRevenue,
      platformFees,
      merchantPayouts: totalRevenue - platformFees,
      adBoostRevenue: 0,
      averageBookingValue: totalBookings > 0 ? totalRevenue / totalBookings : 0,
      newCustomers: 0,
      newMerchants: 0,
      pendingKYC: 0,
      openDisputes,
      disputeRate: totalBookings > 0 ? (disputes.length / totalBookings) * 100 : 0,
      openTickets,
      averageResponseTime: 0,
      averageResolutionTime: 0,
      slaCompliance: 95,
    };
  } catch (error) {
    console.error('[Admin] Failed to get dashboard KPIs:', error);
    throw error;
  }
}

export async function suspendMerchant(
  merchantId: string,
  reason: string,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const merchantRef = doc(db, 'users', merchantId);
    const before = await getDoc(merchantRef);

    await updateDoc(merchantRef, {
      status: 'suspended',
      suspendedReason: reason,
      suspendedAt: Timestamp.now(),
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'suspend_merchant',
      'merchant',
      merchantId,
      before.data(),
      { status: 'suspended', reason }
    );
  } catch (error) {
    console.error('[Admin] Failed to suspend merchant:', error);
    throw error;
  }
}

export async function banUser(
  userId: string,
  reason: string,
  adminId: string,
  adminName: string
): Promise<void> {
  try {
    const userRef = doc(db, 'users', userId);
    const before = await getDoc(userRef);

    await updateDoc(userRef, {
      status: 'banned',
      suspendedReason: reason,
      suspendedAt: Timestamp.now(),
    });

    await createAuditLog(
      adminId,
      adminName,
      'admin',
      'ban_user',
      'user',
      userId,
      before.data(),
      { status: 'banned', reason }
    );
  } catch (error) {
    console.error('[Admin] Failed to ban user:', error);
    throw error;
  }
}

export async function getAuditLogs(filters?: {
  actorId?: string;
  entityType?: string;
  entityId?: string;
  limitCount?: number;
}): Promise<AuditLog[]> {
  try {
    let q = query(collection(db, 'auditLogs'), orderBy('createdAt', 'desc'));

    if (filters?.actorId) {
      q = query(q, where('actorId', '==', filters.actorId));
    }
    if (filters?.entityType) {
      q = query(q, where('entityType', '==', filters.entityType));
    }
    if (filters?.entityId) {
      q = query(q, where('entityId', '==', filters.entityId));
    }
    if (filters?.limitCount) {
      q = query(q, limit(filters.limitCount));
    } else {
      q = query(q, limit(100));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate().toISOString(),
    })) as AuditLog[];
  } catch (error) {
    console.error('[Admin] Failed to get audit logs:', error);
    throw error;
  }
}
