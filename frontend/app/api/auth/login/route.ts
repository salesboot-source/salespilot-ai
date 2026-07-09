import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyPassword, createToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return Response.json(
        { success: false, message: 'Please enter your email and password.', errors: null },
        { status: 422 }
      );
    }

    const sql = getDb();
    const users = await sql`SELECT id, full_name, email, password FROM users WHERE email = ${email}`;

    if (users.length === 0 || !verifyPassword(password, users[0].password)) {
      return Response.json(
        { success: false, message: 'Invalid credentials. Please try again.', errors: null },
        { status: 401 }
      );
    }

    const user = users[0];
    const token = createToken(user.id);

    return Response.json({
      success: true,
      message: 'Welcome back!',
      data: { user: { id: user.id, full_name: user.full_name, email: user.email }, token },
    });
  } catch (error) {
    console.error('Login error:', error);
    return Response.json(
      { success: false, message: 'Something went wrong. Please try again.', errors: null },
      { status: 500 }
    );
  }
}
