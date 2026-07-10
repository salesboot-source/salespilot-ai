// ============================================================
// XENDIT API — Invoice creation for subscription payments
// ============================================================

const XENDIT_BASE_URL = 'https://api.xendit.co';

function getSecretKey(): string {
  const key = process.env.XENDIT_SECRET_KEY;
  if (!key) throw new Error('XENDIT_SECRET_KEY environment variable is not set');
  return key;
}

function getAuthHeader(): string {
  return 'Basic ' + Buffer.from(getSecretKey() + ':').toString('base64');
}

export interface CreateInvoiceParams {
  externalId: string;
  amount: number;
  payerEmail: string;
  description: string;
  userId: string;
  planId: string;
  billingCycle: 'monthly' | 'yearly';
  type: 'new' | 'renewal' | 'upgrade';
  successUrl: string;
  failureUrl: string;
}

export interface XenditInvoiceResponse {
  id: string;
  external_id: string;
  invoice_url: string;
  status: string;
  amount: number;
  expiry_date: string;
}

export async function createXenditInvoice(params: CreateInvoiceParams): Promise<XenditInvoiceResponse> {
  const response = await fetch(`${XENDIT_BASE_URL}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      external_id: params.externalId,
      amount: params.amount,
      payer_email: params.payerEmail,
      description: params.description,
      invoice_duration: 86400, // 24 hours
      success_redirect_url: params.successUrl,
      failure_redirect_url: params.failureUrl,
      currency: 'IDR',
      payment_methods: [
        'BANK_TRANSFER',
        'EWALLET',
        'QR_CODE',
        'CREDIT_CARD',
        'RETAIL_OUTLET',
        'DIRECT_DEBIT',
      ],
      metadata: {
        user_id: params.userId,
        plan_id: params.planId,
        billing_cycle: params.billingCycle,
        type: params.type,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error('Xendit invoice creation failed:', error);
    throw new Error(`Payment gateway error: ${response.status}`);
  }

  return response.json();
}

export function verifyWebhookToken(receivedToken: string): boolean {
  const expectedToken = process.env.XENDIT_WEBHOOK_TOKEN;
  if (!expectedToken) return false;
  return receivedToken === expectedToken;
}
