import OpenAI from 'openai';
import type { ProspectResult, IdealClientMatch, UserProfile } from './types';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

const MATCH_PROMPT = `You are an expert Sales Director. Given a user's business profile and a list of discovered companies, evaluate each company as an IDEAL CLIENT MATCH.

Do NOT just rank by opportunity score. Think like a founder:
- Would I personally spend time contacting this company?
- Does their industry match my expertise?
- Do their tech gaps match my services?
- Can they afford my services?
- Are they in my target market?
- Is there urgency?

For each company return:
{
  "score": 0-100 (Ideal Client Match score),
  "closing_chance": 0-100 (predicted probability of closing),
  "reasons": ["reason 1", "reason 2", "reason 3"],
  "match_breakdown": {
    "industry_match": 0-100,
    "service_match": 0-100,
    "technology_match": 0-100,
    "revenue_match": 0-100,
    "location_match": 0-100,
    "budget_match": 0-100,
    "growth_match": 0-100,
    "urgency_match": 0-100
  },
  "is_top_10": true/false
}

RULES:
- is_top_10 should be TRUE for maximum 10 companies that you would PERSONALLY recommend
- Only mark is_top_10=true if you genuinely believe the founder should contact them this week
- Reasons should be specific (e.g., "Uses WordPress, needs redesign" not "good fit")
- A company with high opportunity but bad match should score LOW on match
- A company with moderate opportunity but perfect fit should score HIGH on match

Return {"matches": [...]} with one entry per input company. JSON only.`;

/**
 * Compute Ideal Client Match scores for discovered prospects.
 */
export async function computeClientMatch(
  prospects: ProspectResult[],
  profile: UserProfile
): Promise<ProspectResult[]> {
  if (prospects.length === 0) return prospects;

  const openai = getOpenAI();

  const profileContext = `
USER BUSINESS PROFILE:
- Company: ${profile.company_name}
- Industry: ${profile.industry}
- Services offered: ${profile.services.join(', ')}
${profile.target_market ? `- Target market: ${profile.target_market}` : ''}
${profile.preferred_countries?.length ? `- Preferred countries: ${profile.preferred_countries.join(', ')}` : ''}
${profile.preferred_cities?.length ? `- Preferred cities: ${profile.preferred_cities.join(', ')}` : ''}
${profile.preferred_technology?.length ? `- Technology expertise: ${profile.preferred_technology.join(', ')}` : ''}
${profile.min_project_value ? `- Minimum project value: $${profile.min_project_value}` : ''}
${profile.preferred_client_size?.length ? `- Preferred client size: ${profile.preferred_client_size.join(', ')}` : ''}`;

  const companiesContext = prospects.map((p, i) => ({
    index: i,
    name: p.company_name,
    industry: p.industry,
    location: `${p.location_city || ''}, ${p.location_country || ''}`,
    technology: p.technology_stack.join(', '),
    opportunity: p.scores.opportunity_score,
    digital_gap: p.scores.digital_gap,
    buying_intent: p.scores.buying_intent,
    deal_value: `$${p.estimated_deal_value_min}-$${p.estimated_deal_value_max}`,
    recommended_services: p.recommended_services.join(', '),
    employees: p.employee_count,
  }));

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: MATCH_PROMPT },
        { role: 'user', content: `${profileContext}\n\nCOMPANIES TO EVALUATE:\n${JSON.stringify(companiesContext)}` },
      ],
      temperature: 0.5,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return applyFallbackMatch(prospects, profile);

    const parsed = JSON.parse(content);
    const matches: Array<Record<string, unknown>> = Array.isArray(parsed)
      ? parsed
      : parsed.matches || Object.values(parsed)[0] as Array<Record<string, unknown>>;

    if (!Array.isArray(matches)) return applyFallbackMatch(prospects, profile);

    return prospects.map((p, i) => {
      const m = matches[i] || {};
      const breakdown = (m.match_breakdown || {}) as Record<string, number>;
      
      const match: IdealClientMatch = {
        score: clamp(m.score as number ?? 50),
        closing_chance: clamp(m.closing_chance as number ?? 30),
        reasons: (m.reasons as string[]) || [],
        match_breakdown: {
          industry_match: clamp(breakdown.industry_match ?? 50),
          service_match: clamp(breakdown.service_match ?? 50),
          technology_match: clamp(breakdown.technology_match ?? 50),
          revenue_match: clamp(breakdown.revenue_match ?? 50),
          location_match: clamp(breakdown.location_match ?? 50),
          budget_match: clamp(breakdown.budget_match ?? 50),
          growth_match: clamp(breakdown.growth_match ?? 50),
          urgency_match: clamp(breakdown.urgency_match ?? 50),
        },
        is_top_10: Boolean(m.is_top_10),
      };

      return { ...p, ideal_client_match: match };
    });
  } catch (error) {
    console.error('Match engine error:', error);
    return applyFallbackMatch(prospects, profile);
  }
}

/**
 * Fallback: compute basic match without AI if API fails
 */
function applyFallbackMatch(prospects: ProspectResult[], profile: UserProfile): ProspectResult[] {
  return prospects.map(p => {
    // Simple heuristic matching
    const industryMatch = p.industry?.toLowerCase().includes(profile.industry.toLowerCase()) ? 80 : 40;
    const serviceMatch = p.recommended_services.some(s =>
      profile.services.some(ps => ps.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ps.toLowerCase()))
    ) ? 85 : 40;
    const locationMatch = profile.preferred_countries?.some(c =>
      p.location_country?.toLowerCase().includes(c.toLowerCase())
    ) ? 90 : 50;

    const score = Math.round((industryMatch + serviceMatch + locationMatch + p.scores.opportunity_score) / 4);

    const match: IdealClientMatch = {
      score,
      closing_chance: Math.round(score * 0.7),
      reasons: ['Matched by basic heuristics — AI refinement pending'],
      match_breakdown: {
        industry_match: industryMatch,
        service_match: serviceMatch,
        technology_match: p.scores.technology_fit,
        revenue_match: p.scores.revenue_potential,
        location_match: locationMatch,
        budget_match: 50,
        growth_match: p.scores.growth_signal,
        urgency_match: p.scores.buying_intent === 'High' ? 90 : p.scores.buying_intent === 'Medium' ? 60 : 30,
      },
      is_top_10: score >= 75,
    };

    return { ...p, ideal_client_match: match };
  });
}

function clamp(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}
