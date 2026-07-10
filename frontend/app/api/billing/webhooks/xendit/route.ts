import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyWebhookToken } from '@/lib/billing/xendit';
import { initBillingTables } from '@/lib/billing/db';

export async function POST(request: NextRequest) {
  const sql = getDb();

  try {
    // Verify webhook token
    const callbackToken = request.headers.get('x-callback-token') || '';
    if (!verifyWebhookToken(callbackToken)) {
      console.error('Webhook: invalid token');
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const eventId = body.id || body.external_id || `evt_${Date.now()}`;
    const eventType = body.status?.toLowerCase() || 'unknown';

    await initBillingTables();

    // Idempotency check
    const existing = await sql`SELECT id FROM webhook_events WHERE event_id = ${eventId} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ success: true, message: 'Already processed' });
    }

    // Log event
    await sql`
      INSERT INTO webhook_events (event_id, event_type, xendit_invoice_id, payload, processing_result)
      VALUES (${eventId}, ${eventType}, ${body.id || null}, ${JSON.stringify(body)}, 'processing')
    `;

    const externalId = body.external_id;
    if (!externalId) {
      await sql`UPDATE webhook_events SET processing_result = 'invalid_payload' WHERE event_id = ${eventId}`;
      return Response.json({ success: true, message: 'No external_id' });
    }

    if (eventType === 'paid' || body.status === 'PAID') {
      // Payment successful — activate subscription
      const txRows = await sql`
        SELECT * FROM transactions WHERE external_id = ${externalId} LIMIT 1
      `;

      if (txRows.length === 0) {
        await sql`UPDATE webhook_events SET processing_result = 'tx_not_found' WHERE event_id = ${eventId}`;
        return Response.json({ success: true });
      }

      const tx = txRows[0];
      const userId = tx.user_id;
      const planId = tx.plan_id;
      const billingCycle = tx.billing_cycle;

      // Update transaction status
      await sql`
        UPDATE transactions SET status = 'paid', paid_at = NOW(), payment_method = ${body.payment_method || null}, payment_channel = ${body.payment_channel || null}
        WHERE external_id = ${externalId}
      `;

      // Create or update subscription
      const existingSub = await sql`SELECT id FROM subscriptions WHERE user_id = ${userId} LIMIT 1`;
      const periodDays = billingCycle === 'yearly' ? 365 : 30;

      if (existingSub.length > 0) {
        await sql`
          UPDATE subscriptions
          SET plan_id = ${planId}, status = 'active', billing_cycle = ${billingCycle},
              current_period_start = NOW(), current_period_end = NOW() + ${periodDays + ' days'}::interval,
              trial_end = NULL, cancelled_at = NULL, updated_at = NOW()
          WHERE user_id = ${userId}
        `;
      } else {
        await sql`
          INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
          VALUES (${userId}, ${planId}, 'active', ${billingCycle}, NOW(), NOW() + ${periodDays + ' days'}::interval)
        `;
      }

      // Update user plan
      await sql`UPDATE users SET plan_id = ${planId}, subscription_status = 'active' WHERE id = ${userId}`;

      await sql`UPDATE webhook_events SET processing_result = 'activated' WHERE event_id = ${eventId}`;

    } else if (eventType === 'expired' || body.status === 'EXPIRED') {
      await sql`UPDATE transactions SET status = 'expired', updated_at = NOW() WHERE external_id = ${externalId}`;
      await sql`UPDATE webhook_events SET processing_result = 'expired' WHERE event_id = ${eventId}`;

    } else if (eventType === 'failed' || body.status === 'FAILED') {
      await sql`UPDATE transactions SET status = 'failed', updated_at = NOW() WHERE external_id = ${externalId}`;
      await sql`UPDATE webhook_events SET processing_result = 'failed' WHERE event_id = ${eventId}`;
    } else {
      await sql`UPDATE webhook_events SET processing_result = 'unknown_event' WHERE event_id = ${eventId}`;
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
}
