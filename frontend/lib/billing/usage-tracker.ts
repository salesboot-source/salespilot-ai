import { getDb } from '@/lib/db';
import { getEffectivePlanId, getSubscription } from './subscription-engine';
import { getPlanById } from './plan-catalog';
import type { UsageType, UsageCheckResult, UsageRecord } from './types';

// ============================================================
// USAGE TRACKER — Limit enforcement per plan
// ============================================================

export function getUsageLimitForPlan(planId: string, usageType: UsageType): number {
  const plan = getPlanById(planId);
  if (!plan) return 20;
  switch (usageType) {
    case 'prospect_discovery': return plan.features.prospectDiscoveryLimit;
    case 'export': return plan.features.exportLimit;
    case 'ai_credits': return plan.features.aiCreditsLimit;
    default: return 20;
  }
}

export async function checkUsage(userId: string, usageType: UsageType): Promise<UsageCheckResult> {
  const sql = getDb();
  const planId = await getEffectivePlanId(userId);
  const maxAllowed = getUsageLimitForPlan(planId, usageType);

  // Unlimited
  if (maxAllowed === -1) {
    return { allowed: true, currentCount: 0, maxAllowed: -1, remaining: -1, cycleResetDate: '' };
  }

  // Get or create usage counter
  const rows = await sql`
    SELECT * FROM usage_counters WHERE user_id = ${userId} AND usage_type = ${usageType} LIMIT 1
  `;

  if (rows.length === 0) {
    // Create default counter
    const sub = await getSubscription(userId);
    const cycleEnd = sub?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      INSERT INTO usage_counters (user_id, usage_type, current_count, cycle_start, cycle_end)
      VALUES (${userId}, ${usageType}, 0, NOW(), ${cycleEnd})
      ON CONFLICT (user_id, usage_type) DO NOTHING
    `;
    return { allowed: true, currentCount: 0, maxAllowed, remaining: maxAllowed, cycleResetDate: cycleEnd };
  }

  const record = rows[0];

  // Check if cycle has ended — reset
  if (new Date(record.cycle_end) <= new Date()) {
    const sub = await getSubscription(userId);
    const newCycleEnd = sub?.current_period_end || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await sql`
      UPDATE usage_counters SET current_count = 0, cycle_start = NOW(), cycle_end = ${newCycleEnd}, updated_at = NOW()
      WHERE user_id = ${userId} AND usage_type = ${usageType}
    `;
    return { allowed: true, currentCount: 0, maxAllowed, remaining: maxAllowed, cycleResetDate: newCycleEnd };
  }

  const currentCount = record.current_count || 0;
  const remaining = maxAllowed - currentCount;
  return {
    allowed: currentCount < maxAllowed,
    currentCount,
    maxAllowed,
    remaining: Math.max(0, remaining),
    cycleResetDate: record.cycle_end,
  };
}

export async function incrementUsage(userId: string, usageType: UsageType): Promise<UsageCheckResult> {
  const check = await checkUsage(userId, usageType);
  if (!check.allowed && check.maxAllowed !== -1) return check;

  const sql = getDb();
  await sql`
    UPDATE usage_counters SET current_count = current_count + 1, updated_at = NOW()
    WHERE user_id = ${userId} AND usage_type = ${usageType}
  `;

  return { ...check, currentCount: check.currentCount + 1, remaining: Math.max(0, check.remaining - 1) };
}

export async function getUsageSummary(userId: string): Promise<UsageRecord[]> {
  const planId = await getEffectivePlanId(userId);
  const types: UsageType[] = ['prospect_discovery', 'export', 'ai_credits'];
  const results: UsageRecord[] = [];

  for (const t of types) {
    const check = await checkUsage(userId, t);
    results.push({
      usageType: t,
      currentCount: check.currentCount,
      maxAllowed: check.maxAllowed,
      cycleResetDate: check.cycleResetDate,
    });
  }
  return results;
}
