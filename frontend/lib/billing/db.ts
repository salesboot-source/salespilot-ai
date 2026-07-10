import { getDb } from '@/lib/db';

// ============================================================
// BILLING DATABASE — Schema migration + queries
// ============================================================

export async function initBillingTables() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS plans (
      id VARCHAR(20) PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      monthly_price INTEGER NOT NULL DEFAULT 0,
      yearly_price INTEGER NOT NULL DEFAULT 0,
      features JSONB NOT NULL DEFAULT '{}',
      is_recommended BOOLEAN DEFAULT FALSE,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    INSERT INTO plans (id, name, monthly_price, yearly_price, features, is_recommended, display_order) VALUES
    ('free', 'Free', 0, 0, '{"prospectDiscoveryLimit":20,"exportLimit":5,"aiCreditsLimit":10,"hasAdvancedAI":false,"hasWhatsAppIntegration":false,"hasPrioritySupport":false,"hasCustomBranding":false,"hasApiAccess":false,"supportLevel":"community"}', false, 1),
    ('starter', 'Starter', 299000, 2870400, '{"prospectDiscoveryLimit":200,"exportLimit":50,"aiCreditsLimit":100,"hasAdvancedAI":false,"hasWhatsAppIntegration":true,"hasPrioritySupport":false,"hasCustomBranding":false,"hasApiAccess":false,"supportLevel":"email"}', false, 2),
    ('professional', 'Professional', 799000, 7670400, '{"prospectDiscoveryLimit":2000,"exportLimit":-1,"aiCreditsLimit":-1,"hasAdvancedAI":true,"hasWhatsAppIntegration":true,"hasPrioritySupport":true,"hasCustomBranding":false,"hasApiAccess":true,"supportLevel":"priority"}', true, 3),
    ('business', 'Business', 1999000, 19190400, '{"prospectDiscoveryLimit":-1,"exportLimit":-1,"aiCreditsLimit":-1,"hasAdvancedAI":true,"hasWhatsAppIntegration":true,"hasPrioritySupport":true,"hasCustomBranding":true,"hasApiAccess":true,"supportLevel":"dedicated"}', false, 4)
    ON CONFLICT (id) DO NOTHING
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      plan_id VARCHAR(20) NOT NULL DEFAULT 'free',
      status VARCHAR(30) NOT NULL DEFAULT 'free',
      billing_cycle VARCHAR(10) NOT NULL DEFAULT 'monthly',
      current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
      current_period_end TIMESTAMP NOT NULL DEFAULT NOW() + INTERVAL '30 days',
      trial_end TIMESTAMP,
      cancelled_at TIMESTAMP,
      downgrade_to_plan_id VARCHAR(20),
      grace_period_end TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      subscription_id UUID,
      xendit_invoice_id VARCHAR(200),
      external_id VARCHAR(200) UNIQUE NOT NULL,
      amount INTEGER NOT NULL,
      currency VARCHAR(3) NOT NULL DEFAULT 'IDR',
      status VARCHAR(20) NOT NULL DEFAULT 'pending',
      payment_method VARCHAR(50),
      payment_channel VARCHAR(50),
      plan_id VARCHAR(20),
      billing_cycle VARCHAR(10),
      type VARCHAR(20) NOT NULL DEFAULT 'new',
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS webhook_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      event_id VARCHAR(200) UNIQUE NOT NULL,
      event_type VARCHAR(50) NOT NULL,
      xendit_invoice_id VARCHAR(200),
      payload JSONB NOT NULL,
      processing_result VARCHAR(30) NOT NULL,
      processed_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Add plan columns to users if not exist
  await sql`
    DO $$ BEGIN
      ALTER TABLE users ADD COLUMN IF NOT EXISTS plan_id VARCHAR(20) DEFAULT 'free';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(30) DEFAULT 'free';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_webhook_event_id ON webhook_events(event_id)`;
}
