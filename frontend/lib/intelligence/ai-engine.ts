import OpenAI from 'openai';
import type { IntelligenceReportV4 } from './types';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

// ============================================================
// AI DECISION ENGINE v0.4 — Revenue Intelligence Prompt
// ============================================================

const SYSTEM_PROMPT = `You are a senior revenue intelligence analyst at a top-tier management consulting firm.
Your task: produce a decisive, data-backed intelligence report that answers four questions:
1. Should I contact this company? (AI Verdict)
2. How valuable is this opportunity? (Revenue Scores)
3. What should I sell them? (Service Recommendations)
4. Why? (Evidence-backed reasoning for every conclusion)

You think like McKinsey. You write with precision. Every score has a reason. Every recommendation has evidence.

CRITICAL RULES:
- All scores must be integers 0-100
- deal_size min/max must be realistic USD values (not percentages)
- service_recommendations must have 3-8 items, ordered by probability descending
- ai_verdict stars must be 1-5, calculated from: Revenue Potential 30% + Urgency 25% + Decision Maker Confidence 20% + (100 - Competition Risk) 15% + min(deal_size.max/1000, 100) 10%, then stars = clamp(1, 5, round(weighted/20))
- pain_points must have at least 5 items with severity ratings
- All evidence arrays must have 2-4 concrete data points
- confidence values must honestly reflect data availability

Respond with this exact JSON structure (all fields required):
{
  "executive_summary": "2-3 sentence decisive summary. Lead with the opportunity size and verdict.",
  "company_overview": {
    "industry": "string",
    "business_model": "B2B | B2C | B2B2C | Marketplace | SaaS | etc.",
    "products_services": "string",
    "target_market": "string",
    "estimated_size": "Startup | SMB | Mid-market | Enterprise",
    "growth_stage": "Early | Growth | Mature | Declining"
  },
  "technology_stack": {
    "website_platform": "string",
    "analytics": "string",
    "marketing_tools": "string",
    "crm": "string",
    "other_tools": "string"
  },
  "digital_presence": {
    "website_quality": "Poor | Average | Good | Excellent",
    "seo_assessment": "string",
    "social_media": { "linkedin": "Active|Inactive|Not found", "instagram": "...", "facebook": "...", "twitter": "..." },
    "content_activity": "string"
  },
  "business_signals": {
    "hiring": "string",
    "funding": "string",
    "expansion": "string",
    "partnerships": "string",
    "news": "string"
  },
  "scores": {
    "revenue_potential": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "deal_size": { "min": 0, "max": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "urgency": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "decision_maker_confidence": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "competition_risk": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "opportunity_score": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] },
    "buying_intent": { "level": "Low|Medium|High", "reason": "string", "confidence": 0, "evidence": ["string"] },
    "digital_maturity": { "value": 0, "reason": "string", "confidence": 0, "evidence": ["string"] }
  },
  "ai_verdict": {
    "stars": 4,
    "action_label": "Pursue Immediately | Strong Opportunity | Worth Exploring | Low Priority | Skip",
    "explanation": "2-4 sentence decisive explanation of why this rating.",
    "top_reason": "Single most important factor in one sentence."
  },
  "service_recommendations": [
    {
      "service": "Service name",
      "probability": 85,
      "reason": "Why this service fits",
      "estimated_value_min": 5000,
      "estimated_value_max": 25000,
      "roi_description": "Expected ROI description"
    }
  ],
  "pain_points": [
    { "pain": "string", "reasoning": "string", "severity": "High|Medium|Low" }
  ],
  "sales_strategy": {
    "suggested_angle": "string",
    "value_proposition": "string",
    "first_message": "string",
    "best_department": "CEO | Marketing | Sales | IT | Operations"
  },
  "confidence": {
    "level": "High | Medium | Low",
    "limitations": "string"
  }
}

IMPORTANT: Respond with valid JSON only. No markdown. No code blocks. No extra text.`;

// ============================================================
// Available service catalog (used when user has no profile)
// ============================================================

const DEFAULT_SERVICE_CATALOG = [
  'Website Development',
  'SEO & Content Marketing',
  'AI Automation',
  'CRM Implementation',
  'ERP System',
  'Booking System',
  'E-Commerce / Marketplace',
  'AI Chatbot',
  'Custom Software Development',
  'Marketing Automation',
  'Mobile App Development',
  'Cloud Migration',
  'Data Analytics & BI',
  'Cybersecurity Audit',
  'UX/UI Redesign',
];

// ============================================================
// Main generation function
// ============================================================

export async function generateDecisionReport(input: {
  company_name: string;
  website?: string;
  industry?: string;
  country?: string;
  notes?: string;
  user_services?: string[];
}): Promise<IntelligenceReportV4> {
  const openai = getOpenAI();

  const serviceCatalog = input.user_services && input.user_services.length > 0
    ? input.user_services
    : DEFAULT_SERVICE_CATALOG;

  const userPrompt = `Generate a revenue intelligence report for:

Company: ${input.company_name}
${input.website ? `Website: ${input.website}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.country ? `Country: ${input.country}` : ''}
${input.notes ? `Context: ${input.notes}` : ''}

Available services to recommend from (pick 3-8 most relevant):
${serviceCatalog.join(', ')}

Produce a COMPLETE, DECISIVE intelligence report. Be specific. Be actionable. Back every score with evidence.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.6,
    max_tokens: 5000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');

  const parsed = JSON.parse(content) as IntelligenceReportV4;

  // Validate and clamp scores
  return validateReport(parsed);
}

// ============================================================
// Validation & clamping
// ============================================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.round(value)));
}

function validateReport(raw: IntelligenceReportV4): IntelligenceReportV4 {
  const scores = raw.scores;

  // Clamp all enriched scores to [0, 100]
  scores.revenue_potential.value = clamp(scores.revenue_potential.value, 0, 100);
  scores.urgency.value = clamp(scores.urgency.value, 0, 100);
  scores.decision_maker_confidence.value = clamp(scores.decision_maker_confidence.value, 0, 100);
  scores.competition_risk.value = clamp(scores.competition_risk.value, 0, 100);
  scores.opportunity_score.value = clamp(scores.opportunity_score.value, 0, 100);
  scores.digital_maturity.value = clamp(scores.digital_maturity.value, 0, 100);
  scores.revenue_potential.confidence = clamp(scores.revenue_potential.confidence, 0, 100);
  scores.urgency.confidence = clamp(scores.urgency.confidence, 0, 100);
  scores.decision_maker_confidence.confidence = clamp(scores.decision_maker_confidence.confidence, 0, 100);
  scores.competition_risk.confidence = clamp(scores.competition_risk.confidence, 0, 100);

  // Ensure deal size min <= max and both non-negative
  scores.deal_size.min = Math.max(0, Math.round(scores.deal_size.min));
  scores.deal_size.max = Math.max(0, Math.round(scores.deal_size.max));
  if (scores.deal_size.min > scores.deal_size.max) {
    [scores.deal_size.min, scores.deal_size.max] = [scores.deal_size.max, scores.deal_size.min];
  }

  // Validate verdict stars using weighted formula
  const weightedScore =
    scores.revenue_potential.value * 0.30 +
    scores.urgency.value * 0.25 +
    scores.decision_maker_confidence.value * 0.20 +
    (100 - scores.competition_risk.value) * 0.15 +
    Math.min(scores.deal_size.max / 1000, 100) * 0.10;

  const computedStars = clamp(Math.round(weightedScore / 20), 1, 5);
  raw.ai_verdict.stars = computedStars;

  const ACTION_LABELS: Record<number, string> = {
    5: 'Pursue Immediately',
    4: 'Strong Opportunity',
    3: 'Worth Exploring',
    2: 'Low Priority',
    1: 'Skip',
  };
  raw.ai_verdict.action_label = ACTION_LABELS[computedStars] || 'Skip';

  // Validate service recommendations ordering
  raw.service_recommendations.sort((a, b) => b.probability - a.probability);

  // Clamp service probabilities
  for (const rec of raw.service_recommendations) {
    rec.probability = clamp(rec.probability, 0, 100);
    rec.estimated_value_min = Math.max(0, Math.round(rec.estimated_value_min));
    rec.estimated_value_max = Math.max(0, Math.round(rec.estimated_value_max));
    if (rec.estimated_value_min > rec.estimated_value_max) {
      [rec.estimated_value_min, rec.estimated_value_max] = [rec.estimated_value_max, rec.estimated_value_min];
    }
  }

  return raw;
}
