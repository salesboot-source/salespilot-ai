// ============================================================
// AI PROSPECT DISCOVERY ENGINE v0.5 — Types
// ============================================================

export interface ProspectResult {
  id?: string;
  search_id?: string;
  company_name: string;
  website: string | null;
  location_country: string | null;
  location_city: string | null;
  industry: string | null;
  employee_count: number | null;
  estimated_revenue_min: number | null;
  estimated_revenue_max: number | null;
  technology_stack: string[];
  scores: ProspectScores;
  ai_rating_stars: number;
  ai_rating_action: string;
  reasoning: string;
  evidence: string[];
  recommended_services: string[];
  estimated_deal_value_min: number;
  estimated_deal_value_max: number;
  confidence: number;
  signals: ProspectSignals;
  created_at?: string;
}

export interface ProspectScores {
  opportunity_score: number;
  digital_score: number;
  website_score: number;
  seo_score: number;
  buying_intent: 'Low' | 'Medium' | 'High';
  ai_readiness: number;
  digital_gap: number;
  revenue_potential: number;
  technology_fit: number;
  growth_signal: number;
}

export interface ProspectSignals {
  hiring: string | null;
  funding: string | null;
  growth: string | null;
}

export interface SearchHistoryEntry {
  id: string;
  keyword: string;
  search_date: string;
  companies_found_count: number;
  average_opportunity_score: number;
  total_potential_revenue: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface WorkspaceEntry {
  id: string;
  user_id: string;
  prospect_data: ProspectResult;
  status: 'New' | 'Researched' | 'Contacted' | 'Qualified';
  saved_at: string;
}

export interface DiscoveryInsights {
  total_found: number;
  average_opportunity: number;
  total_potential_revenue: number;
  average_deal_size: number;
  industries: string[];
  best_location: string;
  suggested_campaign: string;
}

export type SortCriterion =
  | 'opportunity'
  | 'revenue'
  | 'buying_intent'
  | 'newest'
  | 'employees'
  | 'digital_gap'
  | 'ai_rating';
