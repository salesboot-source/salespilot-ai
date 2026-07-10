import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { generateDecisionReport } from '@/lib/intelligence/ai-engine';
import { persistReport, getReportsByUser } from '@/lib/intelligence/db';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const reports = await getReportsByUser(userId);
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

    // Load user's company profile for service catalog
    const sql = getDb();
    const profiles = await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`;
    const userProfile = profiles[0] || null;

    let userServices: string[] | undefined;
    if (userProfile?.products_services) {
      const parsed = typeof userProfile.products_services === 'string'
        ? JSON.parse(userProfile.products_services)
        : userProfile.products_services;
      if (Array.isArray(parsed) && parsed.length > 0) {
        userServices = parsed.map((p: { name: string }) => p.name).filter(Boolean);
      }
    }

    // Generate the v0.4 AI Decision Report
    const output = await generateDecisionReport({
      company_name: company_name.trim(),
      website: website || undefined,
      industry: industry || undefined,
      country: country || undefined,
      notes: notes || undefined,
      user_services: userServices,
    });

    // Persist to database with all indexed scores
    const report = await persistReport({
      userId,
      targetCompanyId: target_company_id || undefined,
      companyName: company_name.trim(),
      website: website || undefined,
      industry: industry || undefined,
      country: country || undefined,
      input: { company_name, website, industry, country, notes },
      output,
    });

    return Response.json({
      success: true,
      message: 'Intelligence report complete!',
      data: report,
    }, { status: 201 });
  } catch (error) {
    console.error('Research error:', error);
    const message = error instanceof Error ? error.message : 'Something went wrong';
    if (message.includes('API key') || message.includes('OPENAI')) {
      return Response.json(
        { success: false, message: 'AI service is not configured. Please set OPENAI_API_KEY.', errors: null },
        { status: 503 }
      );
    }
    return Response.json(
      { success: false, message: `Research failed. ${message}`, errors: null },
      { status: 500 }
    );
  }
}
