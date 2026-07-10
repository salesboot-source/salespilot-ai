import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { initDiscoveryTables } from '@/lib/discovery/db';

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const body = await request.json();
    const { prospect } = body;

    if (!prospect || !prospect.company_name) {
      return Response.json({ success: false, message: 'Invalid prospect data' }, { status: 422 });
    }

    await initDiscoveryTables();
    const sql = getDb();

    // Check duplicate
    const existing = await sql`
      SELECT id FROM workspace_prospects 
      WHERE user_id = ${userId} AND company_name = ${prospect.company_name}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return Response.json({ success: false, message: 'Company already in your workspace' }, { status: 409 });
    }

    await sql`
      INSERT INTO workspace_prospects (user_id, company_name, website, prospect_data, status)
      VALUES (${userId}, ${prospect.company_name}, ${prospect.website || null}, ${JSON.stringify(prospect)}, 'New')
    `;

    return Response.json({ success: true, message: 'Saved to workspace' }, { status: 201 });
  } catch (error) {
    console.error('Workspace save error:', error);
    return Response.json({ success: false, message: 'Failed to save' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    await initDiscoveryTables();
    const sql = getDb();

    const entries = await sql`
      SELECT * FROM workspace_prospects WHERE user_id = ${userId} ORDER BY saved_at DESC
    `;

    return Response.json({ success: true, data: entries });
  } catch (error) {
    console.error('Workspace load error:', error);
    return Response.json({ success: false, message: 'Failed to load workspace' }, { status: 500 });
  }
}
