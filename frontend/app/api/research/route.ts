import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { generateIntelligenceReport } from '@/lib/ai';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();

    // Support both legacy research_reports and new company_reports
    const reports = await sql`
      SELECT * FROM company_reports WHERE user_id = ${userId} ORDER BY created_at DESC
    `;

    // Fallback to legacy table if no reports in new table
    if (reports.length === 0) {
      const legacyReports = await sql`
        SELECT * FROM research_reports WHERE user_id = ${userId} ORDER BY created_at DESC
      `;
      return Response.json({ success: true, message: 'Success', data: legacyReports });
    }

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
    const { company_name, website, industry, country, notes, target_company_id } = body;

    if (!company_name || company_name.trim().length < 2) {
      return Response.json(
        { success: false, message: 'Please enter a company name.', errors: null },
        { status: 422 }
      );
    }

    // Generate full AI intelligence report
    const output = await generateIntelligenceReport({
      company_name: company_name.trim(),
      website: website || undefined,
      industry: industry || undefined,
      country: country || undefined,
      notes: notes || undefined,
    });

    // Save to new company_reports table
    const sql = getDb();

    // Get version number
    const existingReports = await sql`
      SELECT COUNT(*) as count FROM company_reports 
      WHERE user_id = ${userId} AND company_name = ${company_name.trim()}
    `;
    const version = Number(existingReports[0]?.count || 0) + 1;

    const result = await sql`
      INSERT INTO company_reports (
        user_id, target_company_id, company_name, website, industry, country,
        input, output, opportunity_score, buying_intent, digital_maturity,
        ai_model, prompt_version, version
      )
      VALUES (
        ${userId}, ${target_company_id || null}, ${company_name.trim()}, 
        ${website || null}, ${industry || null}, ${country || null},
        ${JSON.stringify({ company_name, website, industry, country, notes })}, 
        ${JSON.stringify(output)},
        ${output.scores?.opportunity_score || 0},
        ${output.scores?.buying_intent || 'Medium'},
        ${output.scores?.digital_maturity || 0},
        'gpt-4o-mini', '1.0', ${version}
      )
      RETURNING *
    `;

    // Also save to legacy research_reports for backward compatibility
    const legacyOutput = {
      company_overview: output.executive_summary,
      products: output.company_overview.products_services,
      target_market: output.company_overview.target_market,
      pain_points: output.pain_points.map(p => p.pain).join('. '),
      opportunities: output.opportunities.map(o => `${o.service}: ${o.fit_reason}`).join('. '),
      suggested_sales_angle: output.sales_strategy.suggested_angle,
    };

    await sql`
      INSERT INTO research_reports (user_id, target_company_id, company_name, website, industry, input, output)
      VALUES (${userId}, ${target_company_id || null}, ${company_name.trim()}, ${website || null}, ${industry || null},
              ${JSON.stringify({ company_name, website, industry, notes })}, ${JSON.stringify(legacyOutput)})
    `;

    return Response.json({
      success: true,
      message: 'Intelligence report complete!',
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
