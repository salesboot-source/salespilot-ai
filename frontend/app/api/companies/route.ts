import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();
    const search = request.nextUrl.searchParams.get('search') || '';

    let companies;
    if (search) {
      companies = await sql`
        SELECT * FROM target_companies WHERE user_id = ${userId} AND company_name ILIKE ${'%' + search + '%'}
        ORDER BY created_at DESC
      `;
    } else {
      companies = await sql`SELECT * FROM target_companies WHERE user_id = ${userId} ORDER BY created_at DESC`;
    }

    return Response.json({ success: true, message: 'Success', data: companies });
  } catch (error) {
    console.error('Get companies error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { company_name, website, industry, notes } = body;

    if (!company_name || company_name.trim().length < 2) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { company_name: ['Company name is required (min 2 characters).'] } },
        { status: 422 }
      );
    }

    const sql = getDb();

    // Check duplicate
    const existing = await sql`SELECT id FROM target_companies WHERE user_id = ${userId} AND company_name = ${company_name.trim()}`;
    if (existing.length > 0) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { company_name: ['You already added this company.'] } },
        { status: 422 }
      );
    }

    const result = await sql`
      INSERT INTO target_companies (user_id, company_name, website, industry, notes)
      VALUES (${userId}, ${company_name.trim()}, ${website || null}, ${industry || null}, ${notes || null})
      RETURNING *
    `;

    return Response.json({ success: true, message: 'Company added!', data: result[0] }, { status: 201 });
  } catch (error) {
    console.error('Add company error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}
