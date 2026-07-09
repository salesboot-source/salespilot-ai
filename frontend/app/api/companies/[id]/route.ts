import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const { id } = await params;
    const body = await request.json();
    const { company_name, website, industry, notes } = body;

    const sql = getDb();
    const result = await sql`
      UPDATE target_companies
      SET company_name = ${company_name}, website = ${website || null}, industry = ${industry || null}, notes = ${notes || null}, updated_at = NOW()
      WHERE id = ${id} AND user_id = ${userId}
      RETURNING *
    `;

    if (result.length === 0) {
      return Response.json({ success: false, message: 'Company not found.', errors: null }, { status: 404 });
    }

    return Response.json({ success: true, message: 'Company updated!', data: result[0] });
  } catch (error) {
    console.error('Update company error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const { id } = await params;
    const sql = getDb();
    await sql`DELETE FROM target_companies WHERE id = ${id} AND user_id = ${userId}`;

    return Response.json({ success: true, message: 'Company removed.', data: null });
  } catch (error) {
    console.error('Delete company error:', error);
    return Response.json({ success: false, message: 'Something went wrong.', errors: null }, { status: 500 });
  }
}
