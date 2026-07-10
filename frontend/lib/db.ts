import { neon } from '@neondatabase/serverless';

export function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return neon(databaseUrl);
}

// Initialize database tables
export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      full_name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS company_profiles (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(255) NOT NULL,
      industry VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      products_services JSONB NOT NULL DEFAULT '[]',
      target_market TEXT,
      value_propositions TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS target_companies (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      company_name VARCHAR(200) NOT NULL,
      website VARCHAR(500),
      industry VARCHAR(255),
      notes TEXT,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, company_name)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS research_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_company_id UUID REFERENCES target_companies(id) ON DELETE SET NULL,
      company_name VARCHAR(200) NOT NULL,
      website VARCHAR(500),
      industry VARCHAR(255),
      input JSONB,
      output JSONB NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Full Intelligence Reports table (v0.4 with revenue scoring)
  await sql`
    CREATE TABLE IF NOT EXISTS company_reports (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      target_company_id UUID REFERENCES target_companies(id) ON DELETE SET NULL,
      company_name VARCHAR(200) NOT NULL,
      website VARCHAR(500),
      industry VARCHAR(255),
      country VARCHAR(100),
      input JSONB,
      output JSONB NOT NULL,
      opportunity_score INTEGER DEFAULT 0,
      buying_intent VARCHAR(20) DEFAULT 'Medium',
      digital_maturity INTEGER DEFAULT 0,
      revenue_potential INTEGER DEFAULT 0,
      deal_size_min INTEGER DEFAULT 0,
      deal_size_max INTEGER DEFAULT 0,
      urgency_score INTEGER DEFAULT 0,
      decision_maker_confidence INTEGER DEFAULT 0,
      competition_risk INTEGER DEFAULT 0,
      ai_verdict_stars INTEGER DEFAULT 0,
      ai_verdict_label VARCHAR(30) DEFAULT 'Skip',
      ai_model VARCHAR(50) DEFAULT 'gpt-4o-mini',
      prompt_version VARCHAR(20) DEFAULT '2.0',
      version INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Performance indexes for dashboard queries
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_verdict ON company_reports(user_id, ai_verdict_stars DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_created ON company_reports(user_id, created_at DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_revenue ON company_reports(user_id, revenue_potential DESC)`;

  await sql`
    CREATE TABLE IF NOT EXISTS proposals (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      research_id UUID REFERENCES research_reports(id) ON DELETE SET NULL,
      company_name VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS outreach_emails (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      research_id UUID REFERENCES research_reports(id) ON DELETE SET NULL,
      company_name VARCHAR(200) NOT NULL,
      subject VARCHAR(200) NOT NULL,
      body TEXT NOT NULL,
      tone VARCHAR(20) DEFAULT 'formal',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS whatsapp_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      research_id UUID REFERENCES research_reports(id) ON DELETE SET NULL,
      company_name VARCHAR(200) NOT NULL,
      message VARCHAR(500) NOT NULL,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `;
}
