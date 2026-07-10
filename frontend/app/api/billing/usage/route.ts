import { NextRequest } from 'next/server';
import { getUserIdFromRequest, unauthorized } from '@/lib/auth-server';
import { getUsageSummary } from '@/lib/billing/usage-tracker';
import { initBillingTables } from '@/lib/billing/db';

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) return unauthorized();

    await initBillingTables();
    const usage = await getUsageSummary(userId);
    return Response.json({ success: true, data: usage });
  } catch (error) {
    console.error('Usage fetch error:', error);
    return Response.json({ success: false, message: 'Failed to load usage' }, { status: 500 });
  }
}
