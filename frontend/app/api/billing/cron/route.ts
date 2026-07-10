import { NextRequest } from 'next/server';
import { processRenewals } from '@/lib/billing/renewal-cron';
import { initBillingTables } from '@/lib/billing/db';

// Protected by CRON_SECRET — called by external scheduler daily
export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') || request.nextUrl.searchParams.get('secret');
  const expected = process.env.CRON_SECRET;

  if (expected && secret !== expected) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await initBillingTables();
    const result = await processRenewals();
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error('Cron error:', error);
    return Response.json({ success: false, message: 'Cron failed' }, { status: 500 });
  }
}
