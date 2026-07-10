import { getDb } from '@/lib/db';
import type { IntelligenceReportV4, CompanyReportRow } from './types';

// ============================================================
// DATABASE — Revenue Intelligence v0.4
// ============================================================

/**
 * Run v0.4 schema migration (idempotent).
 * Adds revenue scoring columns and indexes to company_reports.
 */
export async function migrateV4() {
  const sql = getDb();

  // Add new columns (ignore if they already exist)
  await sql`
    DO $$ BEGIN
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS revenue_potential INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS deal_size_min INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS deal_size_max INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS urgency_score INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS decision_maker_confidence INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS competition_risk INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS ai_verdict_stars INTEGER DEFAULT 0;
      ALTER TABLE company_reports ADD COLUMN IF NOT EXISTS ai_verdict_label VARCHAR(30) DEFAULT 'Skip';
    EXCEPTION WHEN duplicate_column THEN NULL;
    END $$;
  `;

  // Create performance indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_verdict ON company_reports(user_id, ai_verdict_stars DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_urgency ON company_reports(user_id, urgency_score DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_revenue ON company_reports(user_id, revenue_potential DESC)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_reports_user_created ON company_reports(user_id, created_at DESC)`;
}

/**
 * Persist a v0.4 intelligence report to the database.
 */
export async function persistReport(params: {
  userId: string;
  targetCompanyId?: string;
  companyName: string;
  website?: string;
  industry?: string;
  country?: string;
  input: Record<string, unknown>;
  output: IntelligenceReportV4;
}): Promise<CompanyReportRow> {
  const sql = getDb();
  const { userId, targetCompanyId, companyName, website, industry, country, input, output } = params;

  // Get next version
  const existing = await sql`
    SELECT COALESCE(MAX(version), 0) as max_version 
    FROM company_reports 
    WHERE user_id = ${userId} AND company_name = ${companyName}
  `;
  const version = Number(existing[0]?.max_version || 0) + 1;

  const result = await sql`
    INSERT INTO company_reports (
      user_id, target_company_id, company_name, website, industry, country,
      input, output,
      opportunity_score, buying_intent, digital_maturity,
      revenue_potential, deal_size_min, deal_size_max,
      urgency_score, decision_maker_confidence, competition_risk,
      ai_verdict_stars, ai_verdict_label,
      ai_model, prompt_version, version
    )
    VALUES (
      ${userId}, ${targetCompanyId || null}, ${companyName},
      ${website || null}, ${industry || null}, ${country || null},
      ${JSON.stringify(input)}, ${JSON.stringify(output)},
      ${output.scores.opportunity_score.value},
      ${output.scores.buying_intent.level},
      ${output.scores.digital_maturity.value},
      ${output.scores.revenue_potential.value},
      ${output.scores.deal_size.min},
      ${output.scores.deal_size.max},
      ${output.scores.urgency.value},
      ${output.scores.decision_maker_confidence.value},
      ${output.scores.competition_risk.value},
      ${output.ai_verdict.stars},
      ${output.ai_verdict.action_label},
      'gpt-4o-mini', '2.0', ${version}
    )
    RETURNING *
  `;

  return result[0] as CompanyReportRow;
}

/**
 * Get all reports for a user, ordered by most recent.
 */
export async function getReportsByUser(userId: string): Promise<CompanyReportRow[]> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM company_reports 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC
  `;
  return rows as CompanyReportRow[];
}

/**
 * Get a single report by ID.
 */
export async function getReportById(reportId: string, userId: string): Promise<CompanyReportRow | null> {
  const sql = getDb();
  const rows = await sql`
    SELECT * FROM company_reports 
    WHERE id = ${reportId} AND user_id = ${userId}
  `;
  return (rows[0] as CompanyReportRow) || null;
}

/**
 * Get dashboard metrics for a user.
 */
export async function getDashboardMetrics(userId: string) {
  const sql = getDb();

  const reports = await sql`
    SELECT id, company_name, opportunity_score, buying_intent, revenue_potential,
           deal_size_min, deal_size_max, urgency_score, ai_verdict_stars, ai_verdict_label,
           created_at
    FROM company_reports 
    WHERE user_id = ${userId} 
    ORDER BY created_at DESC
  `;

  const totalReports = reports.length;
  if (totalReports === 0) {
    return { totalReports: 0, revenuePool: 0, topOpportunity: null, recentReports: [] };
  }

  // Revenue pool: sum of deal_size_max where stars >= 4
  const revenuePool = reports
    .filter(r => (r.ai_verdict_stars || 0) >= 4)
    .reduce((sum, r) => sum + (r.deal_size_max || 0), 0);

  // Top opportunity: highest stars, then highest revenue_potential
  const sorted = [...reports].sort((a, b) => {
    const starDiff = (b.ai_verdict_stars || 0) - (a.ai_verdict_stars || 0);
    if (starDiff !== 0) return starDiff;
    return (b.revenue_potential || 0) - (a.revenue_potential || 0);
  });

  return {
    totalReports,
    revenuePool,
    topOpportunity: sorted[0] || null,
    recentReports: reports.slice(0, 5),
  };
}
