import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { initBillingTables } from '@/lib/billing/db';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();
    await initBillingTables();

    // Check admin role
    const users = await sql`SELECT role FROM users WHERE id = ${userId}`;
    if (!users[0] || users[0].role !== 'admin') {
      return Response.json({ success: false, message: 'Admin access required' }, { status: 403 });
    }

    // Active subscribers
    const activeSubs = await sql`SELECT plan_id, billing_cycle FROM subscriptions WHERE status = 'active'`;
    const trialSubs = await sql`SELECT COUNT(*) as count FROM subscriptions WHERE status = 'trialing'`;

    // Calculate MRR
    let mrr = 0;
    const planDistribution: Record<string, number> = { free: 0, starter: 0, professional: 0, business: 0 };
    const PRICES: Record<string, { monthly: number; yearly: number }> = {
      starter: { monthly: 299000, yearly: 2870400 },
      professional: { monthly: 799000, yearly: 7670400 },
      business: { monthly: 1999000, yearly: 19190400 },
    };

    for (const sub of activeSubs) {
      const p = PRICES[sub.plan_id];
      if (p) {
        mrr += sub.billing_cycle === 'yearly' ? Math.round(p.yearly / 12) : p.monthly;
      }
      planDistribution[sub.plan_id] = (planDistribution[sub.plan_id] || 0) + 1;
    }

    // Total revenue (all paid transactions)
    const revenueResult = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'paid'`;
    const todayRevenue = await sql`SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE status = 'paid' AND paid_at >= CURRENT_DATE`;

    // Recent transactions
    const recentTx = await sql`
      SELECT t.*, u.full_name, u.email FROM transactions t
      JOIN users u ON t.user_id = u.id
      WHERE t.status = 'paid'
      ORDER BY t.paid_at DESC LIMIT 20
    `;

    const activeCount = activeSubs.length;
    const trialCount = Number(trialSubs[0]?.count || 0);

    return Response.json({
      success: true,
      data: {
        mrr,
        arr: mrr * 12,
        totalRevenue: Number(revenueResult[0]?.total || 0),
        todayRevenue: Number(todayRevenue[0]?.total || 0),
        activeSubscribers: activeCount,
        trialUsers: trialCount,
        arpu: activeCount > 0 ? Math.round(mrr / activeCount) : 0,
        planDistribution,
        recentTransactions: recentTx.map(t => ({
          id: t.id,
          userName: t.full_name,
          email: t.email,
          amount: t.amount,
          planId: t.plan_id,
          billingCycle: t.billing_cycle,
          paidAt: t.paid_at,
        })),
      },
    });
  } catch (error) {
    console.error('Admin revenue error:', error);
    return Response.json({ success: false, message: 'Failed to load metrics' }, { status: 500 });
  }
}
