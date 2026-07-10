// ============================================================
// SUBSCRIPTION & BILLING SYSTEM — Types
// ============================================================

export interface PlanDefinition {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: PlanFeatures;
  isRecommended: boolean;
  displayOrder: number;
}

export interface PlanFeatures {
  prospectDiscoveryLimit: number; // -1 = unlimited
  exportLimit: number;
  aiCreditsLimit: number;
  hasAdvancedAI: boolean;
  hasWhatsAppIntegration: boolean;
  hasPrioritySupport: boolean;
  hasCustomBranding: boolean;
  hasApiAccess: boolean;
  supportLevel: 'community' | 'email' | 'priority' | 'dedicated';
}

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'pending_cancellation'
  | 'pending_downgrade'
  | 'grace_period'
  | 'free';

export interface Subscription {
  id: string;
  userId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  cancelledAt: string | null;
  downgradeToPlanId: string | null;
  gracePeriodEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export type UsageType = 'prospect_discovery' | 'export' | 'ai_credits';

export interface UsageRecord {
  usageType: UsageType;
  currentCount: number;
  maxAllowed: number;
  cycleResetDate: string;
}

export interface UsageCheckResult {
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  remaining: number;
  cycleResetDate: string;
}

export interface TransactionRecord {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string | null;
  planId: string;
  billingCycle: string;
  createdAt: string;
  paidAt: string | null;
}
