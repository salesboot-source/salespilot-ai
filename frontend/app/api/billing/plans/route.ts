import { getAllPlans } from '@/lib/billing/plan-catalog';

export async function GET() {
  const plans = getAllPlans();
  return Response.json({ success: true, data: plans });
}
