import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { generateProposal, IntelligenceReport, ResearchOutput } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { research_id } = body;

    if (!research_id) {
      return Response.json({ success: false, message: 'Research ID is required.', errors: null }, { status: 422 });
    }

    const sql = getDb();

    // Try new company_reports table first
    let research = await sql`SELECT * FROM company_reports WHERE id = ${research_id} AND user_id = ${userId}`;
    
    // Fallback to legacy research_reports
    if (research.length === 0) {
      research = await sql`SELECT * FROM research_reports WHERE id = ${research_id} AND user_id = ${userId}`;
    }

    if (research.length === 0) {
      return Response.json({ success: false, message: 'Research not found.', errors: null }, { status: 404 });
    }

    // Get company profile
    const profiles = await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`;
    const profile = profiles[0];
    const myCompany = profile ? profile.company_name : 'Our company';
    const myProducts = profile?.products_services
      ? (profile.products_services as Array<{name: string; description: string}>).map((p) => `${p.name}: ${p.description}`).join('; ')
      : 'Our services';

    // Generate proposal
    const content = await generateProposal({
      research: research[0].output as unknown as (IntelligenceReport | ResearchOutput),
      company_name: research[0].company_name,
      my_company: myCompany,
      my_products: myProducts,
    });

    // Save
    const result = await sql`
      INSERT INTO proposals (user_id, research_id, company_name, content)
      VALUES (${userId}, ${research_id}, ${research[0].company_name}, ${content})
      RETURNING *
    `;

    return Response.json({ success: true, message: 'Proposal ready!', data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Proposal error:', error);
    return Response.json({ success: false, message: "We couldn't generate the proposal. Please try again.", errors: null }, { status: 500 });
  }
}
