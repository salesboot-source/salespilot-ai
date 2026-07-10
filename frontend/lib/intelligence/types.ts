// ============================================================
// REVENUE INTELLIGENCE ENGINE v0.4 — Type Definitions
// ============================================================

export interface EnrichedScore {
  value: number;
  reason: string;
  confidence: number;
  evidence: string[];
}

export interface DealSizeEstimate {
  min: number;
  max: number;
  reason: string;
  confidence: number;
  evidence: string[];
}

export interface ServiceRecommendation {
  service: string;
  probability: number;
  reason: string;
  estimated_value_min: number;
  estimated_value_max: number;
  roi_description: string;
}

export interface RevenueScores {
  revenue_potential: EnrichedScore;
  deal_size: DealSizeEstimate;
  urgency: EnrichedScore;
  decision_maker_confidence: EnrichedScore;
  competition_risk: EnrichedScore;
  // Preserved v0.3
  opportunity_score: EnrichedScore;
  buying_intent: {
    level: 'Low' | 'Medium' | 'High';
    reason: string;
    confidence: number;
    evidence: string[];
  };
  digital_maturity: EnrichedScore;
}

export interface AIVerdict {
  stars: number;
  action_label: string;
  explanation: string;
  top_reason: string;
}

export interface CompanyOverview {
  industry: string;
  business_model: string;
  products_services: string;
  target_market: string;
  estimated_size: 'Startup' | 'SMB' | 'Mid-market' | 'Enterprise';
  growth_stage: 'Early' | 'Growth' | 'Mature' | 'Declining';
}

export interface TechnologyStack {
  website_platform: string;
  analytics: string;
  marketing_tools: string;
  crm: string;
  other_tools: string;
}

export interface DigitalPresence {
  website_quality: 'Poor' | 'Average' | 'Good' | 'Excellent';
  seo_assessment: string;
  social_media: Record<string, string>;
  content_activity: string;
}

export interface BusinessSignals {
  hiring: string;
  funding: string;
  expansion: string;
  partnerships: string;
  news: string;
}

export interface PainPoint {
  pain: string;
  reasoning: string;
  severity: 'High' | 'Medium' | 'Low';
}

export interface SalesStrategy {
  suggested_angle: string;
  value_proposition: string;
  first_message: string;
  best_department: string;
}

export interface Confidence {
  level: 'High' | 'Medium' | 'Low';
  limitations: string;
}

// The complete v0.4 intelligence report output
export interface IntelligenceReportV4 {
  executive_summary: string;
  company_overview: CompanyOverview;
  technology_stack: TechnologyStack;
  digital_presence: DigitalPresence;
  business_signals: BusinessSignals;
  scores: RevenueScores;
  ai_verdict: AIVerdict;
  service_recommendations: ServiceRecommendation[];
  pain_points: PainPoint[];
  sales_strategy: SalesStrategy;
  confidence: Confidence;
}

// Database row shape for company_reports
export interface CompanyReportRow {
  id: string;
  user_id: string;
  target_company_id: string | null;
  company_name: string;
  website: string | null;
  industry: string | null;
  country: string | null;
  input: Record<string, unknown>;
  output: IntelligenceReportV4;
  opportunity_score: number;
  buying_intent: string;
  digital_maturity: number;
  revenue_potential: number;
  deal_size_min: number;
  deal_size_max: number;
  urgency_score: number;
  decision_maker_confidence: number;
  competition_risk: number;
  ai_verdict_stars: number;
  ai_verdict_label: string;
  ai_model: string;
  prompt_version: string;
  version: number;
  created_at: string;
  updated_at: string;
}
