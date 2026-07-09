import { initDb } from '@/lib/db';

export async function GET() {
  try {
    await initDb();
    return Response.json({ success: true, message: 'Database initialized successfully.' });
  } catch (error) {
    console.error('Init DB error:', error);
    return Response.json(
      { success: false, message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
