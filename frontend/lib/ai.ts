import OpenAI from 'openai';

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }
  return new OpenAI({ apiKey });
}

const RESEARCH_SYSTEM_PROMPT = `You are a professional B2B sales researcher.
Generate practical sales intelligence.
Do not invent impossible facts.
When information is unavailable, clearly state assumptions.

Respond in the following JSON format:
{
  "company_overview": "2-3 paragraph overview of the company",
  "products": "Their main products and services",
  "target_market": "Who they serve",
  "pain_points": "Likely challenges and pain points",
  "opportunities": "Opportunities for us to help them",
  "suggested_sales_angle": "The best approach to sell to this company"
}

Always respond with valid JSON only, no markdown formatting.`;

const PROPOSAL_SYSTEM_PROMPT = `You are a professional B2B sales proposal writer.
Write a compelling, personalized sales proposal based on the research provided.
The proposal should be professional, concise, and focused on how your client can solve the target company's problems.

Structure the proposal as:
1. Executive Summary (2-3 sentences)
2. Understanding Their Challenges (reference specific pain points)
3. Our Proposed Solution (map your services to their needs)
4. Key Benefits (3-5 bullet points)
5. Suggested Next Steps

Write in a professional but warm tone. Keep it under 500 words.
Do not use markdown headers - use plain text with clear section labels.`;

const EMAIL_SYSTEM_PROMPT = `You are a professional B2B sales email writer.
Write a personalized outreach email based on the research provided.
The email should be concise, relevant, and have a clear call to action.

Requirements:
- Subject line (max 60 characters, compelling)
- Body (max 150 words)
- Professional but warm tone
- Reference something specific about their company
- Clear single call to action
- No generic fluff

Respond in JSON format:
{
  "subject": "email subject line",
  "body": "email body text"
}

Always respond with valid JSON only, no markdown formatting.`;

const WHATSAPP_SYSTEM_PROMPT = `You are a professional B2B sales message writer.
Write a short WhatsApp message based on the research provided.
The message should feel personal, conversational, and natural for WhatsApp.

Requirements:
- Maximum 300 characters
- Conversational tone
- Include a brief value hook
- End with a question or soft call to action
- Use 1-2 emojis naturally
- No formal greetings like "Dear" or "Sir"

Respond with just the message text, nothing else.`;

export interface ResearchOutput {
  company_overview: string;
  products: string;
  target_market: string;
  pain_points: string;
  opportunities: string;
  suggested_sales_angle: string;
}

export interface EmailOutput {
  subject: string;
  body: string;
}

export async function generateResearch(input: {
  company_name: string;
  website?: string;
  industry?: string;
  notes?: string;
}): Promise<ResearchOutput> {
  const openai = getOpenAI();

  const userPrompt = `Research this company for B2B sales purposes:

Company Name: ${input.company_name}
${input.website ? `Website: ${input.website}` : ''}
${input.industry ? `Industry: ${input.industry}` : ''}
${input.notes ? `Additional context: ${input.notes}` : ''}

Provide practical sales intelligence I can use for outreach.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');

  try {
    return JSON.parse(content) as ResearchOutput;
  } catch {
    // Try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as ResearchOutput;
    }
    throw new Error('AI returned invalid response format');
  }
}

export async function generateProposal(input: {
  research: ResearchOutput;
  company_name: string;
  my_company: string;
  my_products: string;
}): Promise<string> {
  const openai = getOpenAI();

  const userPrompt = `Write a sales proposal for approaching ${input.company_name}.

About the target company (from research):
- Overview: ${input.research.company_overview}
- Pain Points: ${input.research.pain_points}
- Opportunities: ${input.research.opportunities}
- Sales Angle: ${input.research.suggested_sales_angle}

About my company:
- Company: ${input.my_company}
- What we offer: ${input.my_products}

Write a personalized proposal that connects our offerings to their specific needs.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: PROPOSAL_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');
  return content;
}

export async function generateEmail(input: {
  research: ResearchOutput;
  company_name: string;
  my_company: string;
  my_products: string;
  tone?: string;
}): Promise<EmailOutput> {
  const openai = getOpenAI();

  const userPrompt = `Write a ${input.tone || 'formal'} outreach email for ${input.company_name}.

Research insights:
- Overview: ${input.research.company_overview}
- Pain Points: ${input.research.pain_points}
- Opportunities: ${input.research.opportunities}
- Sales Angle: ${input.research.suggested_sales_angle}

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
  research: ResearchOutput;
  company_name: string;
  my_company: string;
  my_products: string;
}): Promise<string> {
  const openai = getOpenAI();

  const userPrompt = `Write a WhatsApp message for reaching out to ${input.company_name}.

Key info from research:
- Pain Points: ${input.research.pain_points}
- Opportunities: ${input.research.opportunities}
- Sales Angle: ${input.research.suggested_sales_angle}

I'm from: ${input.my_company}
We offer: ${input.my_products}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: WHATSAPP_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
    temperature: 0.8,
    max_tokens: 150,
  });

  const content = response.choices[0]?.message?.content;
  if (!content) throw new Error('AI did not return a response');
  return content.replace(/^["']|["']$/g, '').trim();
}
