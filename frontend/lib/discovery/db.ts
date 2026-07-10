import { getDb } from '@/lib/db';
import type { ProspectResult, SearchHistoryEntry, WorkspaceEntry } from './types';

export async function initDiscoveryTables() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS search_history (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      keyword VARCHAR(500) NOT NULL,
      search_date TIMESTAMP NOT NULL DEFAULT NOW(),
      companies_found_count INTEGER NOT NULL DEFAULT 0,
      average_opportunity_score INTEGER DEFAULT 0,
      total_potential_revenue DECIMAL DEFAULT 0,
      filters_applied JSONB,
      status VARCHAR(20) NOT NULL DEFAULT 'pending'
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS prospect_results (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      search_id UUID NOT NULL REFERENCES search_history(id) ON DELETE CASCADE,
      company_name VARCHAR(300) NOT NULL,
      website VARCHAR(2048),
      location_country VARCHAR(100),
      location_city VARCHAR(100),
      industry VARCHAR(150),
      employee_count INTEGER,
      estimated_revenue_min DECIMAL,
      estimated_revenue_max DECIMAL,
      technology_stack JSONB DEFAULT '[]',
      scores JSONB,
      ai_rating_stars INTEGER DEFAULT 3,
      ai_rating_action VARCHAR(30),
      reasoning TEXT,
      evidence JSONB DEFAULT '[]',
      recommended_services JSONB DEFAULT '[]',
      estimated_deal_value_min DECIMAL DEFAULT 0,
      estimated_deal_value_max DECIMAL DEFAULT 0,
      confidence INTEGER DEFAULT 50,
      signals JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS workspace_prospects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      prospect_data JSONB NOT NULL,
      company_name VARCHAR(300) NOT NULL,
      website VARCHAR(2048),
      status VARCHAR(20) NOT NULL DEFAULT 'New',
      saved_at TIMESTAMP DEFAULT NOW(),
      UNIQUE(user_id, company_name, website)
    )
  `;

  await sql`CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, search_date DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prospect_results_search ON prospect_results(search_id, ai_rating_stars DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_prospect_results_user ON prospect_results(user_id, ai_rating_stars DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_workspace_user ON workspace_prospects(user_id, saved_at DESC)`;
}
