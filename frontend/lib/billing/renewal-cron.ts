import { getDb } from '@/lib/db';
import { expireToFree } from './subscription-engine';

// ============================================================
// RENEWAL CRON — Handles expirations and grace period checks
// Called by external cron service hitting /api/billing/cron
// ============================================================

export async function processRenewals() {
  const sql = getDb();
  const now = new Date().toISOString();

  // 1. Expire trials
  const expiredTrials = await sql`
    SELECT user_id FROM subscriptions WHERE status = 'trialing' AND trial_end <= ${now}
  `;
  for (const row of expiredTrials) {
    await expireToFree(row.user_id);
  }

  // 2. Expire pending cancellations past period end
  const expiredCancels = await sql`
    SELECT user_id FROM subscriptions WHERE status = 'pending_cancellation' AND current_period_end <= ${now}
  `;
  for (const row of expiredCancels) {
    await expireToFree(row.user_id);
  }

  // 3. Expire grace periods
  const expiredGrace = await sql`
    SELECT user_id FROM subscriptions WHERE status = 'grace_period' AND grace_period_end <= ${now}
  `;
  for (const row of expiredGrace) {
    await expireToFree(row.user_id);
  }

  // 4. Process pending downgrades at period end
  const pendingDowngrades = await sql`
    SELECT user_id, downgrade_to_plan_id FROM subscriptions
    WHERE status = 'pending_downgrade' AND current_period_end <= ${now} AND downgrade_to_plan_id IS NOT NULL
  `;
  for (const row of pendingDowngrades) {
    await sql`
      UPDATE subscriptions SET plan_id = ${row.downgrade_to_plan_id}, status = 'active',
        downgrade_to_plan_id = NULL, current_period_start = NOW(),
        current_period_end = NOW() + INTERVAL '30 days', updated_at = NOW()
      WHERE user_id = ${row.user_id}
    `;
    await sql`UPDATE users SET plan_id = ${row.downgrade_to_plan_id} WHERE id = ${row.user_id}`;
  }

  return {
    expiredTrials: expiredTrials.length,
    expiredCancels: expiredCancels.length,
    expiredGrace: expiredGrace.length,
    processedDowngrades: pendingDowngrades.length,
  };
}
