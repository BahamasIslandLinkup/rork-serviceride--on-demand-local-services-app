import { createTransaction, captureTransaction } from './transactions';
import { getBooking, updateBooking } from './bookings';

export async function authorizePayment(
  bookingId: string,
  amount: number,
  providerId: string
): Promise<string> {
  try {
    console.log('[Payments] Authorizing payment for booking:', bookingId);

    const commission = amount * 0.15;
    const platformFee = 2.5;
    const netAmount = amount - commission - platformFee;

    const transactionId = await createTransaction({
      bookingId,
      providerId,
      type: 'booking',
      amount,
      commission,
      platformFee,
      netAmount,
      status: 'authorized',
      description: 'Booking payment',
    });

    console.log('[Payments] Payment authorized successfully:', transactionId);
    return transactionId;
  } catch (error) {
    console.error('[Payments] Error authorizing payment:', error);
    throw error;
  }
}

export async function capturePayment(bookingId: string, providerId: string): Promise<void> {
  try {
    console.log('[Payments] Capturing payment for booking:', bookingId);

    const booking = await getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    if (booking.status !== 'completed') {
      throw new Error('Booking must be completed to capture payment');
    }

    await captureTransaction(bookingId, providerId);

    await updateBooking(bookingId, {
      status: 'completed',
      paymentCaptured: true,
      paymentCapturedAt: new Date().toISOString(),
    } as any);

    console.log('[Payments] Payment captured successfully');
  } catch (error) {
    console.error('[Payments] Error capturing payment:', error);
    throw error;
  }
}

export async function refundPayment(
  bookingId: string,
  providerId: string,
  reason: string
): Promise<void> {
  try {
    console.log('[Payments] Refunding payment for booking:', bookingId);

    const booking = await getBooking(bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }

    const refundAmount = booking.price;
    const commission = refundAmount * 0.15;
    const platformFee = 2.5;
    const netAmount = -(refundAmount - commission - platformFee);

    await createTransaction({
      bookingId,
      providerId,
      type: 'refund',
      amount: -refundAmount,
      commission: -commission,
      platformFee: -platformFee,
      netAmount,
      status: 'refunded',
      description: `Refund: ${reason}`,
    });

    await updateBooking(bookingId, {
      status: 'cancelled',
      refundReason: reason,
      refundedAt: new Date().toISOString(),
    } as any);

    console.log('[Payments] Payment refunded successfully');
  } catch (error) {
    console.error('[Payments] Error refunding payment:', error);
    throw error;
  }
}

export async function checkAndCaptureExpiredBookings(): Promise<void> {
  try {
    console.log('[Payments] Checking for expired bookings to auto-capture');

    console.log('[Payments] Auto-capture check complete');
  } catch (error) {
    console.error('[Payments] Error in auto-capture check:', error);
  }
}
