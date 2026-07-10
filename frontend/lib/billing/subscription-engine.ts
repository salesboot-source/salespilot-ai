import { getDb } from '@/lib/db';
import { getPlanById, getPriceForCycle } from './plan-catalog';
import type { SubscriptionStatus } from './types';

// ============================================================
// SUBSCRIPTION ENGINE — State machine + lifecycle management
// ============================================================

export interface ProrationResult {
  daysRemaining: number;
  totalDaysInCycle: number;
  creditAmount: number;
  chargeAmount: number;
  netAmount: number;
}

export async function getSubscription(userId: string) {
  const sql = getDb();
  const rows = await sql`SELECT * FROM subscriptions WHERE user_id = ${userId} ORDER BY created_at DESC LIMIT 1`;
  return rows[0] || null;
}

export async function getEffectivePlanId(userId: string): Promise<string> {
  const sub = await getSubscription(userId);
  if (!sub) return 'free';
  if (sub.status === 'free') return 'free';
  if (sub.status === 'trialing') return 'professional';
  return sub.plan_id || 'free';
}

export async function createTrial(userId: string) {
  const sql = getDb();
  const now = new Date();
  const trialEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const existing = await sql`SELECT id FROM subscriptions WHERE user_id = ${userId} LIMIT 1`;
  if (existing.length > 0) {
    await sql`
      UPDATE subscriptions SET plan_id = 'professional', status = 'trialing',
        current_period_start = ${now.toISOString()}, current_period_end = ${trialEnd.toISOString()},
        trial_end = ${trialEnd.toISOString()}, updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  } else {
    await sql`
      INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end, trial_end)
      VALUES (${userId}, 'professional', 'trialing', 'monthly', ${now.toISOString()}, ${trialEnd.toISOString()}, ${trialEnd.toISOString()})
    `;
  }

  await sql`UPDATE users SET plan_id = 'professional', subscription_status = 'trialing' WHERE id = ${userId}`;
  await logTransition(userId, null, 'trialing', 'trial_started');
}

export async function activateSubscription(userId: string, planId: string, cycle: 'monthly' | 'yearly') {
  const sql = getDb();
  const now = new Date();
  const periodDays = cycle === 'yearly' ? 365 : 30;
  const periodEnd = new Date(now.getTime() + periodDays * 24 * 60 * 60 * 1000);

  const existing = await sql`SELECT id, status FROM subscriptions WHERE user_id = ${userId} LIMIT 1`;
  const prevStatus = existing[0]?.status || null;

  if (existing.length > 0) {
    await sql`
      UPDATE subscriptions SET plan_id = ${planId}, status = 'active', billing_cycle = ${cycle},
        current_period_start = ${now.toISOString()}, current_period_end = ${periodEnd.toISOString()},
        trial_end = NULL, cancelled_at = NULL, grace_period_end = NULL, updated_at = NOW()
      WHERE user_id = ${userId}
    `;
  } else {
    await sql`
      INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
      VALUES (${userId}, ${planId}, 'active', ${cycle}, ${now.toISOString()}, ${periodEnd.toISOString()})
    `;
  }

  await sql`UPDATE users SET plan_id = ${planId}, subscription_status = 'active' WHERE id = ${userId}`;
  await logTransition(userId, prevStatus, 'active', `activated_${planId}_${cycle}`);
}

export async function cancelSubscription(userId: string) {
  const sql = getDb();
  const sub = await getSubscription(userId);
  if (!sub || sub.status !== 'active') return null;

  await sql`
    UPDATE subscriptions SET status = 'pending_cancellation', cancelled_at = NOW(), updated_at = NOW()
    WHERE user_id = ${userId} AND status = 'active'
  `;
  await sql`UPDATE users SET subscription_status = 'pending_cancellation' WHERE id = ${userId}`;
  await logTransition(userId, 'active', 'pending_cancellation', 'user_cancelled');
  return await getSubscription(userId);
}

export async function resumeSubscription(userId: string) {
  const sql = getDb();
  await sql`
    UPDATE subscriptions SET status = 'active', cancelled_at = NULL, updated_at = NOW()
    WHERE user_id = ${userId} AND status = 'pending_cancellation'
  `;
  await sql`UPDATE users SET subscription_status = 'active' WHERE id = ${userId}`;
  await logTransition(userId, 'pending_cancellation', 'active', 'user_resumed');
}

export async function expireToFree(userId: string) {
  const sql = getDb();
  await sql`
    UPDATE subscriptions SET plan_id = 'free', status = 'free', updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  await sql`UPDATE users SET plan_id = 'free', subscription_status = 'free' WHERE id = ${userId}`;
  await logTransition(userId, null, 'free', 'expired');
}

export async function enterGracePeriod(userId: string) {
  const sql = getDb();
  const gracePeriodEnd = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  await sql`
    UPDATE subscriptions SET status = 'grace_period', grace_period_end = ${gracePeriodEnd.toISOString()}, updated_at = NOW()
    WHERE user_id = ${userId}
  `;
  await sql`UPDATE users SET subscription_status = 'grace_period' WHERE id = ${userId}`;
  await logTransition(userId, 'active', 'grace_period', 'renewal_failed');
}

export function calculateProration(
  currentPlanId: string, newPlanId: string, cycle: 'monthly' | 'yearly',
  periodStart: Date, periodEnd: Date
): ProrationResult {
  const currentPrice = getPriceForCycle(currentPlanId, cycle);
  const newPrice = getPriceForCycle(newPlanId, cycle);
  const now = new Date();
  const totalDays = Math.max(1, Math.round((periodEnd.getTime() - periodStart.getTime()) / (24 * 60 * 60 * 1000)));
  const daysRemaining = Math.max(0, Math.round((periodEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)));
  const ratio = daysRemaining / totalDays;
  const creditAmount = Math.round(currentPrice * ratio);
  const chargeAmount = Math.round(newPrice * ratio);
  return { daysRemaining, totalDaysInCycle: totalDays, creditAmount, chargeAmount, netAmount: chargeAmount - creditAmount };
}

async function logTransition(userId: string, prevState: string | null, newState: string, reason: string) {
  const sql = getDb();
  const subs = await sql`SELECT id FROM subscriptions WHERE user_id = ${userId} LIMIT 1`;
  if (subs.length === 0) return;
  await sql`
    INSERT INTO subscription_logs (subscription_id, previous_state, new_state, reason)
    VALUES (${subs[0].id}, ${prevState}, ${newState}, ${reason})
  `.catch(() => {}); // Non-critical, don't block main flow
}
