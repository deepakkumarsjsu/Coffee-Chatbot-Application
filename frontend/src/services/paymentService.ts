import axios from 'axios';
import { PAYMENT_API_URL } from '../config/stripeConfig';

export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string;
  metadata?: {
    userId?: string;
    orderId?: string;
    [key: string]: any;
  };
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

/**
 * Create a payment intent on the backend
 * This requires a backend endpoint that uses your Stripe secret key
 */
export async function createPaymentIntent(
  amount: number,
  metadata?: CreatePaymentIntentRequest['metadata']
): Promise<CreatePaymentIntentResponse> {
  try {
    const response = await axios.post<CreatePaymentIntentResponse>(
      `${PAYMENT_API_URL}/create-intent`,
      {
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: metadata || {},
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data;
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to create payment intent. Please try again.'
    );
  }
}

/**
 * Confirm payment on the backend (optional, if you want to verify on backend)
 */
export async function confirmPayment(paymentIntentId: string): Promise<void> {
  try {
    await axios.post(
      `${PAYMENT_API_URL}/confirm`,
      {
        paymentIntentId,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    throw new Error(
      error.response?.data?.message || 'Failed to confirm payment. Please try again.'
    );
  }
}

