import OpenAI from 'openai';
import type { ProspectResult } from './types';
import { searchGooglePlaces, NormalizedPlaceResult } from './providers/google-places';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

// ============================================================
// HYBRID DISCOVERY: Google Places + AI Enrichment/Fallback
// ============================================================

export async function discoverProspects(input: {
  query: string;
  user_services?: string[];
  user_industry?: string;
}): Promise<ProspectResult[]> {
  // Step 1: Try Google Places API
  const googleResults = await searchGooglePlaces(input.query);

  if (googleResults && googleResults.length > 0) {
    // Google Places found results — enrich them with AI scoring
    return enrichWithAI(googleResults, input);
  }

  // Step 2: Fallback to pure AI generation
  return generateWithAI(input);
}

// ============================================================
// AI ENRICHMENT (for Google Places results)
// ============================================================

async function enrichWithAI(
  places: NormalizedPlaceResult[],
  input: { query: string; user_services?: string[]; user_industry?: string }
): Promise<ProspectResult[]> {
  const openai = getOpenAI();

  const serviceContext = input.user_services?.length
    ? `User sells: ${input.user_services.join(', ')}`
    : 'User sells digital services (web, SEO, AI, CRM, marketing)';

  const companiesJson = JSON.stringify(
    places.map(p => ({
      name: p.company_name,
      website: p.website,
      location: `${p.location_city || ''}, ${p.location_country || ''}`,
      industry: p.industry,
      google_rating: p.google_rating,
      reviews: p.review_count,
    }))
  );

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: ENRICHMENT_PROMPT },
      { role: 'user', content: `${serviceContext}\n\nCompanies to score:\n${companiesJson}` },
    ],
    temperature: 0.6,
    max_tokens: 6000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) return places.map(p => fallbackProspect(p));

  const parsed = JSON.parse(content);
  const scored: Array<Record<string, unknown>> = Array.isArray(parsed)
    ? parsed
    : parsed.companies || parsed.results || Object.values(parsed)[0] as Array<Record<string, unknown>>;

  if (!Array.isArray(scored)) return places.map(p => fallbackProspect(p));

  // Merge Google data with AI scores
  return places.map((place, i) => {
    const aiData = scored[i] || {};
    return mergeProspect(place, aiData);
  });
}

// ============================================================
// PURE AI GENERATION (fallback when no Google API key)
// ============================================================

async function generateWithAI(input: {
  query: string;
  user_services?: string[];
  user_industry?: string;
}): Promise<ProspectResult[]> {
  const openai = getOpenAI();

  const serviceContext = input.user_services?.length
    ? `\nUser's services: ${input.user_services.join(', ')}`
    : '';

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: GENERATION_PROMPT },
      {
        role: 'user',
        content: `Search: "${input.query}"${serviceContext}\n\nGenerate 15-25 realistic prospect companies. Include a mix of opportunity levels.`,
      },
    ],
    temperature: 0.8,
    max_tokens: 8000,
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return results');

  const parsed = JSON.parse(content);
  const results = Array.isArray(parsed) ? parsed : parsed.companies || parsed.results || Object.values(parsed)[0];

  if (!Array.isArray(results)) throw new Error('Invalid AI response format');

  return results.map((r: Record<string, unknown>) => validateProspect(r));
}

// ============================================================
// PROMPTS
// ============================================================

const ENRICHMENT_PROMPT = `You are a B2B sales intelligence analyst. Given a list of real companies found via Google, score each one for a digital services agency.

For each company in the array, return a JSON array with scoring:
{
  "scores": {
    "opportunity_score": 0-100,
    "digital_score": 0-100,
    "website_score": 0-100,
    "seo_score": 0-100,
    "buying_intent": "Low"|"Medium"|"High",
    "ai_readiness": 0-100,
    "digital_gap": 0-100,
    "revenue_potential": 0-100,
    "technology_fit": 0-100,
    "growth_signal": 0-100
  },
  "ai_rating_stars": 1-5,
  "ai_rating_action": "Contact Today"|"Research First"|"Monitor"|"Low Priority"|"Skip",
  "reasoning": "2-3 sentences",
  "evidence": ["point1", "point2", "point3"],
  "recommended_services": ["Service1", "Service2"],
  "estimated_deal_value_min": number,
  "estimated_deal_value_max": number,
  "confidence": 0-100,
  "employee_count": number or null,
  "estimated_revenue_min": number or null,
  "estimated_revenue_max": number or null,
  "technology_stack": ["tech1", "tech2"],
  "signals": { "hiring": null, "funding": null, "growth": null }
}

Return {"companies": [...]} with one entry per input company. Respond with valid JSON only.`;

const GENERATION_PROMPT = `You are an AI B2B prospect discovery engine. Given a search query, generate realistic companies that would be prospects for a digital services agency.

Generate 15-25 companies. Each must be unique and realistic for the specified market.

Return {"companies": [...]} where each object has:
{
  "company_name": "Realistic name",
  "website": "domain.com or null",
  "location_country": "Country",
  "location_city": "City",
  "industry": "Specific industry",
  "employee_count": number or null,
  "estimated_revenue_min": number (USD),
  "estimated_revenue_max": number (USD),
  "technology_stack": ["WordPress", etc],
  "scores": {
    "opportunity_score": 0-100,
    "digital_score": 0-100,
    "website_score": 0-100,
    "seo_score": 0-100,
    "buying_intent": "Low"|"Medium"|"High",
    "ai_readiness": 0-100,
    "digital_gap": 0-100,
    "revenue_potential": 0-100,
    "technology_fit": 0-100,
    "growth_signal": 0-100
  },
  "ai_rating_stars": 1-5,
  "ai_rating_action": "Contact Today"|"Research First"|"Monitor"|"Low Priority"|"Skip",
  "reasoning": "2-3 sentences",
  "evidence": ["point1", "point2", "point3"],
  "recommended_services": ["Service1", "Service2"],
  "estimated_deal_value_min": number,
  "estimated_deal_value_max": number,
  "confidence": 0-100,
  "signals": { "hiring": "signal or null", "funding": "signal or null", "growth": "signal or null" }
}

Include a MIX of 1-5 star companies. Respond with valid JSON only.`;

// ============================================================
// HELPERS
// ============================================================

function mergeProspect(place: NormalizedPlaceResult, ai: Record<string, unknown>): ProspectResult {
  const scores = (ai.scores || {}) as Record<string, unknown>;
  return {
    company_name: place.company_name,
    website: place.website,
    location_country: place.location_country,
    location_city: place.location_city,
    industry: place.industry,
    employee_count: (ai.employee_count as number) || null,
    estimated_revenue_min: (ai.estimated_revenue_min as number) || null,
    estimated_revenue_max: (ai.estimated_revenue_max as number) || null,
    technology_stack: (ai.technology_stack as string[]) || [],
    scores: {
      opportunity_score: clamp(scores.opportunity_score as number ?? 50),
      digital_score: clamp(scores.digital_score as number ?? 50),
      website_score: clamp(scores.website_score as number ?? 50),
      seo_score: clamp(scores.seo_score as number ?? 50),
      buying_intent: (scores.buying_intent as 'Low' | 'Medium' | 'High') || 'Medium',
      ai_readiness: clamp(scores.ai_readiness as number ?? 30),
      digital_gap: clamp(scores.digital_gap as number ?? 50),
      revenue_potential: clamp(scores.revenue_potential as number ?? 50),
      technology_fit: clamp(scores.technology_fit as number ?? 50),
      growth_signal: clamp(scores.growth_signal as number ?? 50),
    },
    ai_rating_stars: Math.max(1, Math.min(5, Math.round((ai.ai_rating_stars as number) || 3))),
    ai_rating_action: (ai.ai_rating_action as string) || 'Research First',
    reasoning: (ai.reasoning as string) || '',
    evidence: (ai.evidence as string[]) || [],
    recommended_services: (ai.recommended_services as string[]) || [],
    estimated_deal_value_min: (ai.estimated_deal_value_min as number) || 0,
    estimated_deal_value_max: (ai.estimated_deal_value_max as number) || 0,
    confidence: clamp((ai.confidence as number) || 60),
    signals: {
      hiring: ((ai.signals as Record<string, string | null>)?.hiring) || null,
      funding: ((ai.signals as Record<string, string | null>)?.funding) || null,
      growth: ((ai.signals as Record<string, string | null>)?.growth) || null,
    },
  };
}

function fallbackProspect(place: NormalizedPlaceResult): ProspectResult {
  return {
    company_name: place.company_name,
    website: place.website,
    location_country: place.location_country,
    location_city: place.location_city,
    industry: place.industry,
    employee_count: null,
    estimated_revenue_min: null,
    estimated_revenue_max: null,
    technology_stack: [],
    scores: {
      opportunity_score: 50, digital_score: 40, website_score: 40, seo_score: 40,
      buying_intent: 'Medium', ai_readiness: 30, digital_gap: 60,
      revenue_potential: 50, technology_fit: 50, growth_signal: 40,
    },
    ai_rating_stars: 3,
    ai_rating_action: 'Research First',
    reasoning: 'Found via Google Places. Further research recommended.',
    evidence: [`Google Rating: ${place.google_rating || 'N/A'}`, `Reviews: ${place.review_count || 0}`],
    recommended_services: [],
    estimated_deal_value_min: 2000,
    estimated_deal_value_max: 15000,
    confidence: 40,
    signals: { hiring: null, funding: null, growth: null },
  };
}

function validateProspect(r: Record<string, unknown>): ProspectResult {
  const scores = (r.scores || {}) as Record<string, unknown>;
  return {
    company_name: (r.company_name as string) || 'Unknown',
    website: (r.website as string) || null,
    location_country: (r.location_country as string) || null,
    location_city: (r.location_city as string) || null,
    industry: (r.industry as string) || null,
    employee_count: (r.employee_count as number) || null,
    estimated_revenue_min: (r.estimated_revenue_min as number) || null,
    estimated_revenue_max: (r.estimated_revenue_max as number) || null,
    technology_stack: (r.technology_stack as string[]) || [],
    scores: {
      opportunity_score: clamp(scores.opportunity_score as number ?? 50),
      digital_score: clamp(scores.digital_score as number ?? 50),
      website_score: clamp(scores.website_score as number ?? 50),
      seo_score: clamp(scores.seo_score as number ?? 50),
      buying_intent: (scores.buying_intent as 'Low' | 'Medium' | 'High') || 'Medium',
      ai_readiness: clamp(scores.ai_readiness as number ?? 30),
      digital_gap: clamp(scores.digital_gap as number ?? 50),
      revenue_potential: clamp(scores.revenue_potential as number ?? 50),
      technology_fit: clamp(scores.technology_fit as number ?? 50),
      growth_signal: clamp(scores.growth_signal as number ?? 50),
    },
    ai_rating_stars: Math.max(1, Math.min(5, Math.round((r.ai_rating_stars as number) || 3))),
    ai_rating_action: (r.ai_rating_action as string) || 'Research First',
    reasoning: (r.reasoning as string) || '',
    evidence: (r.evidence as string[]) || [],
    recommended_services: (r.recommended_services as string[]) || [],
    estimated_deal_value_min: (r.estimated_deal_value_min as number) || 0,
    estimated_deal_value_max: (r.estimated_deal_value_max as number) || 0,
    confidence: clamp((r.confidence as number) || 60),
    signals: {
      hiring: ((r.signals as Record<string, string | null>)?.hiring) || null,
      funding: ((r.signals as Record<string, string | null>)?.funding) || null,
      growth: ((r.signals as Record<string, string | null>)?.growth) || null,
    },
  };
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}
