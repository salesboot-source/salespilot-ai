import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { initBillingTables } from '@/lib/billing/db';
import { getPlanById } from '@/lib/billing/plan-catalog';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    await initBillingTables();
    const sql = getDb();

    const subs = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
    const transactions = await sql`SELECT * FROM transactions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 10`;

    const sub = subs[0] || null;
    const plan = sub ? getPlanById(sub.plan_id) : getPlanById('free');

    return Response.json({
      success: true,
      data: {
        subscription: sub,
        plan,
        transactions: transactions.map(t => ({
          id: t.id,
          amount: t.amount,
          status: t.status,
          paymentMethod: t.payment_method,
          planId: t.plan_id,
          billingCycle: t.billing_cycle,
          createdAt: t.created_at,
          paidAt: t.paid_at,
        })),
      },
    });
  } catch (error) {
    console.error('Subscription fetch error:', error);
    return Response.json({ success: false, message: 'Failed to load subscription' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { action } = body;

    await initBillingTables();
    const sql = getDb();

    if (action === 'cancel') {
      await sql`
        UPDATE subscriptions SET status = 'pending_cancellation', cancelled_at = NOW(), updated_at = NOW()
        WHERE user_id = ${userId} AND status = 'active'
      `;
      return Response.json({ success: true, message: 'Subscription will cancel at end of billing period' });
    }

    if (action === 'resume') {
      await sql`
        UPDATE subscriptions SET status = 'active', cancelled_at = NULL, updated_at = NOW()
        WHERE user_id = ${userId} AND status = 'pending_cancellation'
      `;
      return Response.json({ success: true, message: 'Subscription resumed' });
    }

    return Response.json({ success: false, message: 'Invalid action' }, { status: 422 });
  } catch (error) {
    console.error('Subscription update error:', error);
    return Response.json({ success: false, message: 'Failed to update subscription' }, { status: 500 });
  }
}
