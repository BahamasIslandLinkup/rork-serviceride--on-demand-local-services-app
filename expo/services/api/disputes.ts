import type { Dispute, DisputeEvidence, DisputeMessage } from '@/types';

export interface FileDisputeRequest {
  bookingId: string;
  category: 'service_quality' | 'payment' | 'cancellation' | 'no_show' | 'other';
  reason: string;
  description: string;
  evidenceUris: string[];
}

export interface AddDisputeEvidenceRequest {
  disputeId: string;
  evidenceUris: string[];
}

export interface SendDisputeMessageRequest {
  disputeId: string;
  text?: string;
  attachmentUris?: string[];
}

export async function fileDispute(request: FileDisputeRequest): Promise<{ success: boolean; dispute?: Dispute; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const evidence: DisputeEvidence[] = request.evidenceUris.map((uri, index) => ({
    id: 'evidence_' + Date.now() + '_' + index,
    type: uri.includes('video') ? 'video' : 'image',
    uri,
    uploadedAt: new Date().toISOString(),
  }));
  
  const dispute: Dispute = {
    id: 'dispute_' + Date.now(),
    bookingId: request.bookingId,
    customerId: 'user_1',
    customerName: 'John Smith',
    providerId: 'provider_1',
    providerName: 'Mike Johnson',
    category: request.category,
    reason: request.reason,
    description: request.description,
    evidence,
    status: 'open',
    merchantResponded: false,
    createdAt: new Date().toISOString(),
    messages: [],
    merchantResponseDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  };
  
  return { success: true, dispute };
}

export async function getDispute(disputeId: string): Promise<Dispute | null> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  const mockDispute: Dispute = {
    id: disputeId,
    bookingId: 'booking_1',
    customerId: 'user_1',
    customerName: 'John Smith',
    providerId: 'provider_1',
    providerName: 'Mike Johnson',
    category: 'service_quality',
    reason: 'Incomplete work',
    description: 'The brake repair was not completed as promised. The brake pads were not replaced.',
    evidence: [
      {
        id: 'evidence_1',
        type: 'image',
        uri: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&q=80',
        uploadedAt: '2025-10-10T10:00:00Z',
      },
    ],
    status: 'awaiting_merchant',
    merchantResponded: false,
    createdAt: '2025-10-10T10:00:00Z',
    messages: [
      {
        id: 'msg_1',
        disputeId,
        senderId: 'user_1',
        senderName: 'John Smith',
        senderRole: 'customer',
        text: 'I have attached photos showing the incomplete work.',
        timestamp: '2025-10-10T10:05:00Z',
        read: true,
      },
    ],
    merchantResponseDeadline: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  };
  
  return mockDispute;
}

export async function listDisputes(): Promise<Dispute[]> {
  await new Promise(resolve => setTimeout(resolve, 700));
  
  return [
    {
      id: 'dispute_1',
      bookingId: 'booking_1',
      customerId: 'user_1',
      customerName: 'John Smith',
      providerId: 'provider_1',
      providerName: 'Mike Johnson',
      category: 'service_quality',
      reason: 'Incomplete work',
      description: 'The brake repair was not completed as promised.',
      evidence: [],
      status: 'under_review',
      merchantResponded: true,
      createdAt: '2025-10-10T10:00:00Z',
      messages: [],
    },
  ];
}

export async function addDisputeEvidence(request: AddDisputeEvidenceRequest): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true };
}

export async function sendDisputeMessage(request: SendDisputeMessageRequest): Promise<{ success: boolean; message?: DisputeMessage; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const message: DisputeMessage = {
    id: 'msg_' + Date.now(),
    disputeId: request.disputeId,
    senderId: 'user_1',
    senderName: 'John Smith',
    senderRole: 'customer',
    text: request.text,
    timestamp: new Date().toISOString(),
    read: false,
  };
  
  return { success: true, message };
}

export async function closeDispute(disputeId: string, resolution: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 600));
  
  return { success: true };
}
