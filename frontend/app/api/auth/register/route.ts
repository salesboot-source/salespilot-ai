import { NextRequest } from 'next/server';
import { getDb } from '@/lib/db';
import { hashPassword, createToken } from '@/lib/auth-server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { full_name, email, password, password_confirmation } = body;

    // Validation
    if (!full_name || !email || !password) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { email: ['All fields are required.'] } },
        { status: 422 }
      );
    }

    if (password !== password_confirmation) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { password: ['Passwords do not match.'] } },
        { status: 422 }
      );
    }

    if (password.length < 8) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { password: ['Password must be at least 8 characters.'] } },
        { status: 422 }
      );
    }

    const sql = getDb();

    // Check existing user
    const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
    if (existing.length > 0) {
      return Response.json(
        { success: false, message: 'Please check your input.', errors: { email: ['This email is already registered.'] } },
        { status: 422 }
      );
    }

    // Create user
    const hashedPassword = hashPassword(password);
    const result = await sql`
      INSERT INTO users (full_name, email, password)
      VALUES (${full_name}, ${email}, ${hashedPassword})
      RETURNING id, full_name, email
    `;

    const user = result[0];
    const token = createToken(user.id);

    return Response.json({
      success: true,
      message: 'Account created successfully!',
      data: { user: { id: user.id, full_name: user.full_name, email: user.email }, token },
    }, { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return Response.json(
      { success: false, message: 'Something went wrong. Please try again.', errors: null },
      { status: 500 }
    );
  }
}
