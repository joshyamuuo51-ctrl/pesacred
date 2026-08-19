import type { PaymentMethod, PaymentStatus } from '@/types/database';

export interface PaymentRequest {
  amount: number;
  method: PaymentMethod;
  account: string;
  reference: string;
  description: string;
}

export interface PaymentResult {
  reference: string;
  providerReference: string;
  status: PaymentStatus;
  message: string;
}

export interface PaymentProvider {
  readonly id: PaymentMethod;
  readonly name: string;
  initPayment(request: PaymentRequest): Promise<PaymentResult>;
  checkStatus(providerReference: string): Promise<PaymentStatus>;
}

export const PAYMENT_PROVIDERS: Record<PaymentMethod, PaymentProvider> = {
  mpesa: {
    id: 'mpesa',
    name: 'M-Pesa',
    async initPayment(req): Promise<PaymentResult> {
      await simulateLatency();
      return {
        reference: req.reference,
        providerReference: `MP${Math.random().toString().slice(2, 12)}`,
        status: 'pending',
        message: `STK push sent to ${req.account}. Enter your M-Pesa PIN to authorize the payment of KES ${req.amount}.`,
      };
    },
    async checkStatus(): Promise<PaymentStatus> {
      return 'pending';
    },
  },
  airtel: {
    id: 'airtel',
    name: 'Airtel Money',
    async initPayment(req): Promise<PaymentResult> {
      await simulateLatency();
      return {
        reference: req.reference,
        providerReference: `AM${Math.random().toString().slice(2, 12)}`,
        status: 'pending',
        message: `Payment request sent to ${req.account}. Approve the Airtel Money prompt to complete payment of KES ${req.amount}.`,
      };
    },
    async checkStatus(): Promise<PaymentStatus> {
      return 'pending';
    },
  },
  card: {
    id: 'card',
    name: 'Card Payment',
    async initPayment(req): Promise<PaymentResult> {
      await simulateLatency();
      return {
        reference: req.reference,
        providerReference: `CD${Math.random().toString().slice(2, 12)}`,
        status: 'pending',
        message: `Card payment of KES ${req.amount} is being processed by your bank.`,
      };
    },
    async checkStatus(): Promise<PaymentStatus> {
      return 'pending';
    },
  },
};

export function getPaymentProvider(method: PaymentMethod): PaymentProvider {
  return PAYMENT_PROVIDERS[method];
}

async function simulateLatency(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 1200));
}

/**
 * Simulates a user confirming the mobile-money / card prompt.
 * In production this would be triggered by a provider webhook
 * calling an edge function that updates the payment row. Here
 * we simulate the confirmation client-side after a short delay.
 */
export async function simulatePaymentConfirmation(
  providerReference: string,
  outcome: 'paid' | 'failed' = 'paid'
): Promise<PaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return {
    reference: '',
    providerReference,
    status: outcome,
    message: outcome === 'paid' ? 'Payment received successfully.' : 'Payment was declined.',
  };
}
