import type { PlanDefinition } from './types';

// ============================================================
// PLAN CATALOG — Static plan definitions
// ============================================================

export const PLANS: PlanDefinition[] = [
  {
    id: 'free',
    name: 'Free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: {
      prospectDiscoveryLimit: 20,
      exportLimit: 5,
      aiCreditsLimit: 10,
      hasAdvancedAI: false,
      hasWhatsAppIntegration: false,
      hasPrioritySupport: false,
      hasCustomBranding: false,
      hasApiAccess: false,
      supportLevel: 'community',
    },
    isRecommended: false,
    displayOrder: 1,
  },
  {
    id: 'starter',
    name: 'Starter',
    monthlyPrice: 299000,
    yearlyPrice: 2870400,
    features: {
      prospectDiscoveryLimit: 200,
      exportLimit: 50,
      aiCreditsLimit: 100,
      hasAdvancedAI: false,
      hasWhatsAppIntegration: true,
      hasPrioritySupport: false,
      hasCustomBranding: false,
      hasApiAccess: false,
      supportLevel: 'email',
    },
    isRecommended: false,
    displayOrder: 2,
  },
  {
    id: 'professional',
    name: 'Professional',
    monthlyPrice: 799000,
    yearlyPrice: 7670400,
    features: {
      prospectDiscoveryLimit: 2000,
      exportLimit: -1,
      aiCreditsLimit: -1,
      hasAdvancedAI: true,
      hasWhatsAppIntegration: true,
      hasPrioritySupport: true,
      hasCustomBranding: false,
      hasApiAccess: true,
      supportLevel: 'priority',
    },
    isRecommended: true,
    displayOrder: 3,
  },
  {
    id: 'business',
    name: 'Business',
    monthlyPrice: 1999000,
    yearlyPrice: 19190400,
    features: {
      prospectDiscoveryLimit: -1,
      exportLimit: -1,
      aiCreditsLimit: -1,
      hasAdvancedAI: true,
      hasWhatsAppIntegration: true,
      hasPrioritySupport: true,
      hasCustomBranding: true,
      hasApiAccess: true,
      supportLevel: 'dedicated',
    },
    isRecommended: false,
    displayOrder: 4,
  },
];

export function getAllPlans(): PlanDefinition[] {
  return PLANS;
}

export function getPlanById(planId: string): PlanDefinition | null {
  return PLANS.find(p => p.id === planId) || null;
}

export function getPriceForCycle(planId: string, cycle: 'monthly' | 'yearly'): number {
  const plan = getPlanById(planId);
  if (!plan) return 0;
  return cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
}

export function formatRupiah(amount: number): string {
  return `Rp${amount.toLocaleString('id-ID')}`;
}
