import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();
    const profiles = await sql`SELECT * FROM company_profiles WHERE user_id = ${userId}`;

    return Response.json({
      success: true,
      message: profiles.length > 0 ? 'Success' : 'No company profile yet',
      data: profiles[0] || null,
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { company_name, industry, description, products_services, target_market, value_propositions } = body;

    // Validation
    const errors: Record<string, string[]> = {};
    if (!company_name) errors.company_name = ['Company name is required.'];
    if (!industry) errors.industry = ['Industry is required.'];
    if (!description) errors.description = ['Company description is required.'];
    if (!products_services || !Array.isArray(products_services) || products_services.length === 0) {
      errors.products_services = ['Add at least one product or service.'];
    }

    if (Object.keys(errors).length > 0) {
      return Response.json({ success: false, message: 'Please check your input.', errors }, { status: 422 });
    }

    const sql = getDb();
    const existing = await sql`SELECT id FROM company_profiles WHERE user_id = ${userId}`;

    let profile;
    if (existing.length > 0) {
      const result = await sql`
        UPDATE company_profiles
        SET company_name = ${company_name}, industry = ${industry}, description = ${description},
            products_services = ${JSON.stringify(products_services)}, target_market = ${target_market || null},
            value_propositions = ${value_propositions || null}, updated_at = NOW()
        WHERE user_id = ${userId}
        RETURNING *
      `;
      profile = result[0];
    } else {
      const result = await sql`
        INSERT INTO company_profiles (user_id, company_name, industry, description, products_services, target_market, value_propositions)
        VALUES (${userId}, ${company_name}, ${industry}, ${description}, ${JSON.stringify(products_services)}, ${target_market || null}, ${value_propositions || null})
        RETURNING *
      `;
      profile = result[0];
    }

    return Response.json({ success: true, message: 'Company profile saved!', data: profile });
  } catch (error) {
    console.error('Save profile error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}
