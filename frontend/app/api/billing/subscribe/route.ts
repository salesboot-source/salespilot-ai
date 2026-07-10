import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { getPriceForCycle, getPlanById } from '@/lib/billing/plan-catalog';
import { createXenditInvoice } from '@/lib/billing/xendit';
import { initBillingTables } from '@/lib/billing/db';
import { v4 as uuid } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { plan_id, billing_cycle } = body;

    if (!plan_id || !billing_cycle) {
      return Response.json({ success: false, message: 'plan_id and billing_cycle are required' }, { status: 422 });
    }

    if (!['monthly', 'yearly'].includes(billing_cycle)) {
      return Response.json({ success: false, message: 'billing_cycle must be monthly or yearly' }, { status: 422 });
    }

    const plan = getPlanById(plan_id);
    if (!plan || plan.id === 'free') {
      return Response.json({ success: false, message: 'Invalid plan selected' }, { status: 422 });
    }

    const amount = getPriceForCycle(plan_id, billing_cycle);
    if (amount <= 0) {
      return Response.json({ success: false, message: 'Invalid plan pricing' }, { status: 422 });
    }

    await initBillingTables();
    const sql = getDb();

    // Get user email
    const users = await sql`SELECT email FROM users WHERE id = ${userId}`;
    if (users.length === 0) {
      return Response.json({ success: false, message: 'User not found' }, { status: 404 });
    }
    const userEmail = users[0].email;

    // Generate unique external ID
    const externalId = `sp_${uuid()}`;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://salespilot-web.netlify.app';

    // Create Xendit invoice
    const invoice = await createXenditInvoice({
      externalId,
      amount,
      payerEmail: userEmail,
      description: `SalesPilot ${plan.name} Plan (${billing_cycle})`,
      userId,
      planId: plan_id,
      billingCycle: billing_cycle,
      type: 'new',
      successUrl: `${baseUrl}/billing/success?tx=${externalId}`,
      failureUrl: `${baseUrl}/billing/failed`,
    });

    // Store pending transaction
    await sql`
      INSERT INTO transactions (user_id, xendit_invoice_id, external_id, amount, plan_id, billing_cycle, type, status)
      VALUES (${userId}, ${invoice.id}, ${externalId}, ${amount}, ${plan_id}, ${billing_cycle}, 'new', 'pending')
    `;

    return Response.json({
      success: true,
      message: 'Checkout created',
      data: { checkout_url: invoice.invoice_url, transaction_id: externalId },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
    const msg = error instanceof Error ? error.message : 'Failed to create checkout';
    if (msg.includes('XENDIT_SECRET_KEY')) {
      return Response.json({ success: false, message: 'Payment gateway not configured. Contact support.' }, { status: 503 });
    }
    return Response.json({ success: false, message: msg }, { status: 500 });
  }
}
