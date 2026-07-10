import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

// ============================================================
// AI COMPANY INTELLIGENCE ENGINE - Full Research Report
// ============================================================

const INTELLIGENCE_SYSTEM_PROMPT = `You are a senior B2B sales intelligence analyst.
Your job is to produce a comprehensive company intelligence report that helps agencies and B2B sales teams decide:
1. Should we contact this company?
2. What problems are they likely facing?
3. What services should we offer?
4. How should we approach them?
5. What should we say first?

Based on the company name, website (if provided), industry, and any additional context, generate a COMPLETE business intelligence report.

When information is unavailable, make educated assumptions based on industry norms and clearly state they are assumptions.

Respond in the following JSON format (all fields required):
{
  "executive_summary": "2-3 sentence business summary",
  "company_overview": {
    "industry": "Their industry",
    "business_model": "B2B, B2C, marketplace, SaaS, etc.",
    "products_services": "Main products and services",
    "target_market": "Who they serve",
    "estimated_size": "Startup / SMB / Mid-market / Enterprise",
    "growth_stage": "Early / Growth / Mature / Declining"
  },
  "technology_stack": {
    "website_platform": "WordPress, Shopify, custom, etc.",
    "analytics": "Google Analytics, etc.",
    "marketing_tools": "Mailchimp, HubSpot, etc.",
    "crm": "Salesforce, HubSpot, none detected, etc.",
    "other_tools": "Any other detectable tools"
  },
  "digital_presence": {
    "website_quality": "Poor / Average / Good / Excellent",
    "seo_assessment": "Brief SEO assessment",
    "social_media": {
      "linkedin": "Active / Inactive / Not found",
      "instagram": "Active / Inactive / Not found",
      "facebook": "Active / Inactive / Not found",
      "other": "Any other platforms"
    },
    "content_activity": "Blog activity, content marketing assessment"
  },
  "business_signals": {
    "hiring": "Any hiring signals",
    "funding": "Any funding or investment signals",
    "expansion": "Growth or expansion signals",
    "partnerships": "Partnership announcements",
    "news": "Recent news or press"
  },
  "scores": {
    "opportunity_score": 75,
    "opportunity_reasoning": "Why this score",
    "buying_intent": "Low / Medium / High",
    "buying_intent_reasoning": "Why this assessment",
    "digital_maturity": 60,
    "digital_maturity_reasoning": "Why this score"
  },
  "pain_points": [
    {
      "pain": "Specific pain point",
      "reasoning": "Why they likely have this problem"
    }
  ],
  "opportunities": [
    {
      "service": "Recommended service (e.g. Website Redesign, SEO, CRM, AI Chatbot)",
      "fit_reason": "Why this service matches their needs"
    }
  ],
  "sales_strategy": {
    "suggested_angle": "How to approach this company",
    "value_proposition": "Strongest value proposition",
    "first_message": "Personalized opening message (2-3 sentences)",
    "best_department": "CEO / Marketing / Sales / IT / Operations",
    "objections": [
      {
        "objection": "Likely objection",
        "response": "How to handle it"
      }
    ],
    "followup_sequence": [
      "Day 1: Email introduction",
      "Day 3: LinkedIn connection",
      "Day 5: WhatsApp follow-up",
      "Day 7: Send proposal"
    ]
  },
  "confidence": {
    "level": "High / Medium / Low",
    "limitations": "What data was limited or assumed"
  }
}

IMPORTANT:
- opportunity_score and digital_maturity must be numbers 0-100
- pain_points must have at least 5 items
- opportunities must have at least 3 items
- objections must have at least 3 items
- Always respond with valid JSON only, no markdown formatting or code blocks`;

// ============================================================
// PROPOSAL GENERATOR
// ============================================================

const PROPOSAL_SYSTEM_PROMPT = `You are a professional B2B sales proposal writer.
Write a compelling, personalized sales proposal based on the intelligence report provided.
The proposal should be professional, concise, and focused on solving the target company's specific problems.

Structure the proposal as:
1. Executive Summary (2-3 sentences)
2. Understanding Their Challenges (reference specific pain points from the report)
3. Our Proposed Solution (map specific services to their needs)
4. Key Benefits (3-5 bullet points)
5. Investment & Next Steps

Write in a professional but warm tone. Keep it under 600 words.
Reference specific data from the intelligence report to show deep understanding.
Do not use markdown headers - use plain text with clear section labels.`;

// ============================================================
// EMAIL GENERATOR
// ============================================================

const EMAIL_SYSTEM_PROMPT = `You are a professional B2B sales email writer.
Write a personalized outreach email based on the intelligence report provided.

Requirements:
- Subject line (max 60 characters, compelling, NOT generic)
- Body (max 150 words)
- Reference something SPECIFIC about their company from the report
- Include the strongest value proposition
- Clear single call to action
- No generic fluff or filler

Respond in JSON format:
{
  "subject": "email subject line",
  "body": "email body text"
}

Always respond with valid JSON only, no markdown formatting.`;

// ============================================================
// WHATSAPP GENERATOR
// ============================================================

const WHATSAPP_SYSTEM_PROMPT = `You are a professional B2B sales message writer.
Write a short WhatsApp message based on the intelligence report provided.

Requirements:
- Maximum 400 characters
- Conversational and natural for WhatsApp
- Reference something specific about their company
- Include a brief value hook based on their pain points
- End with a question or soft call to action
- Use 1-2 emojis naturally
- No formal greetings like "Dear" or "Sir"

Respond with just the message text, nothing else.`;

// ============================================================
// TYPES
// ============================================================

export interface CompanyOverview {
  industry: string;
  business_model: string;
  products_services: string;
  target_market: string;
  estimated_size: string;
  growth_stage: string;
}

export interface TechnologyStack {
  website_platform: string;
  analytics: string;
  marketing_tools: string;
  crm: string;
  other_tools: string;
}

export interface SocialMedia {
  linkedin: string;
  instagram: string;
  facebook: string;
  other: string;
}

export interface DigitalPresence {
  website_quality: string;
  seo_assessment: string;
  social_media: SocialMedia;
  content_activity: string;
}

export interface BusinessSignals {
  hiring: string;
  funding: string;
  expansion: string;
  partnerships: string;
  news: string;
}

export interface Scores {
  opportunity_score: number;
  opportunity_reasoning: string;
  buying_intent: string;
  buying_intent_reasoning: string;
  digital_maturity: number;
  digital_maturity_reasoning: string;
}

export interface PainPoint {
  pain: string;
  reasoning: string;
}

export interface Opportunity {
  service: string;
  fit_reason: string;
}

export interface Objection {
  objection: string;
  response: string;
}

export interface SalesStrategy {
  suggested_angle: string;
  value_proposition: string;
  first_message: string;
  best_department: string;
  objections: Objection[];
  followup_sequence: string[];
}

export interface Confidence {
  level: string;
  limitations: string;
}

export interface IntelligenceReport {
  executive_summary: string;
  company_overview: CompanyOverview;
  technology_stack: TechnologyStack;
  digital_presence: DigitalPresence;
  business_signals: BusinessSignals;
  scores: Scores;
  pain_points: PainPoint[];
  opportunities: Opportunity[];
  sales_strategy: SalesStrategy;
  confidence: Confidence;
}

export interface EmailOutput {
  subject: string;
  body: string;
}

// Legacy type for backward compatibility
export interface ResearchOutput {
  company_overview: string;
  products: string;
  target_market: string;
  pain_points: string;
  opportunities: string;
  suggested_sales_angle: string;
}

// ============================================================
// GENERATION FUNCTIONS
// ============================================================

export async function generateIntelligenceReport(input: {
  company_name: string;
  website?: string;
  industry?: string;
  country?: string;
  notes?: string;
}): Promise<IntelligenceReport> {
  const openai = getOpenAI();

  const userPrompt = `Generate a comprehensive business intelligence report for B2B sales purposes:

Company Name: ${input.company_name}
${input.website ? `Website: ${input.website}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.country ? `Country: ${input.country}` : ''}
${input.notes ? `Additional context: ${input.notes}` : ''}

Provide a COMPLETE intelligence report with all sections filled. Be specific, actionable, and data-driven where possible.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: INTELLIGENCE_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');

  try {
    return JSON.parse(content) as IntelligenceReport;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as IntelligenceReport;
    }
    throw new Error('AI returned invalid response format');
  }
}

// Backward-compatible wrapper
export async function generateResearch(input: {
  company_name: string;
  website?: string;
  industry?: string;
  notes?: string;
}): Promise<ResearchOutput> {
  const report = await generateIntelligenceReport(input);
  
  // Convert to legacy format
  return {
    company_overview: report.executive_summary,
    products: report.company_overview.products_services,
    target_market: report.company_overview.target_market,
    pain_points: report.pain_points.map(p => p.pain).join('. '),
    opportunities: report.opportunities.map(o => `${o.service}: ${o.fit_reason}`).join('. '),
    suggested_sales_angle: report.sales_strategy.suggested_angle,
  };
}

export async function generateProposal(input: {
  research: ResearchOutput | IntelligenceReport;
  company_name: string;
  my_company: string;
  my_products: string;
}): Promise<string> {
  const openai = getOpenAI();

  // Handle both legacy and new format
  let researchContext: string;
  if ('executive_summary' in input.research) {
    const report = input.research as IntelligenceReport;
    researchContext = `
Executive Summary: ${report.executive_summary}
Industry: ${report.company_overview.industry}
Business Model: ${report.company_overview.business_model}
Size: ${report.company_overview.estimated_size}
Pain Points: ${report.pain_points.map(p => `- ${p.pain}: ${p.reasoning}`).join('\n')}
Opportunities: ${report.opportunities.map(o => `- ${o.service}: ${o.fit_reason}`).join('\n')}
Sales Angle: ${report.sales_strategy.suggested_angle}
Value Proposition: ${report.sales_strategy.value_proposition}
Opportunity Score: ${report.scores.opportunity_score}/100`;
  } else {
    const legacy = input.research as ResearchOutput;
    researchContext = `
Overview: ${legacy.company_overview}
Pain Points: ${legacy.pain_points}
Opportunities: ${legacy.opportunities}
Sales Angle: ${legacy.suggested_sales_angle}`;
  }

  const userPrompt = `Write a sales proposal for approaching ${input.company_name}.

Intelligence Report:
${researchContext}

About my company:
- Company: ${input.my_company}
- What we offer: ${input.my_products}

Write a personalized proposal that connects our specific offerings to their documented pain points and opportunities.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROPOSAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');
  return content;
}

export async function generateEmail(input: {
  research: ResearchOutput | IntelligenceReport;
  company_name: string;
  my_company: string;
  my_products: string;
  tone?: string;
}): Promise<EmailOutput> {
  const openai = getOpenAI();

  let researchContext: string;
  if ('executive_summary' in input.research) {
    const report = input.research as IntelligenceReport;
    researchContext = `
Company: ${input.company_name}
Summary: ${report.executive_summary}
Pain Points: ${report.pain_points.slice(0, 3).map(p => p.pain).join(', ')}
Best Angle: ${report.sales_strategy.suggested_angle}
Value Prop: ${report.sales_strategy.value_proposition}
Department to Contact: ${report.sales_strategy.best_department}`;
  } else {
    const legacy = input.research as ResearchOutput;
    researchContext = `
Overview: ${legacy.company_overview}
Pain Points: ${legacy.pain_points}
Sales Angle: ${legacy.suggested_sales_angle}`;
  }

  const toneInstruction = input.tone === 'friendly' 
    ? 'Use a warm, conversational tone. Be approachable.'
    : input.tone === 'direct'
    ? 'Be direct and concise. Get to the point fast.'
    : 'Use a professional, formal tone.';

  const userPrompt = `Write a ${input.tone || 'formal'} outreach email for ${input.company_name}.
${toneInstruction}

Intelligence:
${researchContext}

I'm from: ${input.my_company}
We offer: ${input.my_products}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: EMAIL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');

  try {
    return JSON.parse(content) as EmailOutput;
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as EmailOutput;
    }
    throw new Error('AI returned invalid response format');
  }
}

export async function generateWhatsApp(input: {
  research: ResearchOutput | IntelligenceReport;
  company_name: string;
  my_company: string;
  my_products: string;
}): Promise<string> {
  const openai = getOpenAI();

  let researchContext: string;
  if ('executive_summary' in input.research) {
    const report = input.research as IntelligenceReport;
    researchContext = `
Company: ${input.company_name}
Key Pain: ${report.pain_points[0]?.pain || 'General business challenges'}
Opportunity: ${report.opportunities[0]?.service || 'Digital services'}
Angle: ${report.sales_strategy.suggested_angle}`;
  } else {
    const legacy = input.research as ResearchOutput;
    researchContext = `
Pain Points: ${legacy.pain_points}
Opportunities: ${legacy.opportunities}
Sales Angle: ${legacy.suggested_sales_angle}`;
  }

  const userPrompt = `Write a WhatsApp message for reaching out to ${input.company_name}.

Intelligence:
${researchContext}

I'm from: ${input.my_company}
We offer: ${input.my_products}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: WHATSAPP_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 200,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');
  return content.replace(/^["']|["']$/g, '').trim();
}
