import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    const sql = getDb();
    const users = await sql`SELECT id, full_name, email FROM users WHERE id = ${userId}`;
    if (users.length === 0) return unauthorized();

    const profiles = await sql`SELECT id FROM company_profiles WHERE user_id = ${userId}`;

    return Response.json({
      success: true,
      message: 'Success',
      data: {
        id: users[0].id,
        full_name: users[0].full_name,
        email: users[0].email,
        has_company_profile: profiles.length > 0,
      },
    });
  } catch (error) {
    console.error('User error:', error);
    return Response.json(
      { success: false, message: 'Something went wrong.', errors: null },
      { status: 500 }
    );
  }
}
