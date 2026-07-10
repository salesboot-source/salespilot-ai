import { initDb } from '@/lib/db';
import { migrateV4 } from '@/lib/intelligence/db';

export async function GET() {
  try {
    await initDb();
    await migrateV4();
    return Response.json({ success: true, message: 'Database initialized successfully (v0.4).' });
  } catch (error) {
    console.error('Init DB error:', error);
    return Response.json(
      { success: false, message: `Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}
