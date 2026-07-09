import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { generateResearch } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();
    const reports = await sql`
      SELECT * FROM research_reports WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    return Response.json({ success: true, message: 'Success', data: reports });
  } catch (error) {
    console.error('Get research error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { company_name, website, industry, notes, target_company_id } = body;

    if (!company_name || company_name.trim().length < 2) {
      return Response.json(
        { success: false, message: 'Please enter a company name.', errors: null },
        { status: 422 }
      );
    }

    // Generate AI research
    const output = await generateResearch({
      company_name: company_name.trim(),
      website: website || undefined,
      industry: industry || undefined,
      notes: notes || undefined,
    });

    // Save to database
    const sql = getDb();
    const result = await sql`
      INSERT INTO research_reports (user_id, target_company_id, company_name, website, industry, input, output)
      VALUES (${userId}, ${target_company_id || null}, ${company_name.trim()}, ${website || null}, ${industry || null},
              ${JSON.stringify({ company_name, website, industry, notes })}, ${JSON.stringify(output)})
      RETURNING *
    `;

    return Response.json({
      success: true,
      message: 'Research completed!',
      data: result[0],
    }, { status: 201 });
  } catch (error) {
    console.error('Research error:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong';
    if (message.includes('API key') || message.includes('OPENAI')) {
      return Response.json({ success: false, message: 'AI service is not configured. Please set OPENAI_API_KEY.', errors: null }, { status: 503 });
    }
    return Response.json({ success: false, message: `We couldn't complete the research. ${message}`, errors: null }, { status: 500 });
  }
}
