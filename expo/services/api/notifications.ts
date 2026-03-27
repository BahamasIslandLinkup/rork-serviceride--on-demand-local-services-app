import type { Notification, NotificationSettings } from '@/types';

export async function listNotifications(): Promise<Notification[]> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return [
    {
      id: 'notif_1',
      userId: 'user_1',
      title: 'Booking Confirmed',
      body: 'Your booking with Mike Johnson has been confirmed for Oct 12 at 10:00 AM',
      type: 'booking',
      data: { bookingId: 'booking_1' },
      read: false,
      createdAt: '2025-10-10T09:00:00Z',
    },
    {
      id: 'notif_2',
      userId: 'user_1',
      title: 'New Message',
      body: 'Mike Johnson sent you a message',
      type: 'message',
      data: { conversationId: 'conv_1' },
      read: false,
      createdAt: '2025-10-10T08:30:00Z',
    },
    {
      id: 'notif_3',
      userId: 'user_1',
      title: 'Payment Successful',
      body: 'Your payment of $183.60 was processed successfully',
      type: 'payment',
      data: { transactionId: 'txn_1' },
      read: true,
      createdAt: '2025-10-09T14:00:00Z',
    },
  ];
}

export async function markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return { success: true };
}

export async function markAllAsRead(): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return { success: true };
}

export async function getNotificationSettings(): Promise<NotificationSettings> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return {
    pushEnabled: true,
    categories: {
      booking: true,
      message: true,
      dispute: true,
      payment: true,
      promotion: false,
      system: true,
    },
  };
}

export async function updateNotificationSettings(settings: NotificationSettings): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  return { success: true };
}

export async function requestPushPermissions(): Promise<{ granted: boolean; token?: string }> {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return { granted: true, token: 'mock_push_token_' + Date.now() };
}

export async function registerPushToken(token: string): Promise<{ success: boolean; error?: string }> {
  await new Promise(resolve => setTimeout(resolve, 400));
  
  return { success: true };
}
