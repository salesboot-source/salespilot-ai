'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import { PLANS, formatRupiah } from '@/lib/billing/plan-catalog';
import type { PlanDefinition } from '@/lib/billing/types';

const FEATURES_LIST: Record<string, string[]> = {
  free: ['20 Prospect Discovery', 'Company Research', 'AI Company Summary', 'Basic AI Score', 'Save Prospect'],
  starter: ['200 Prospect Discovery', 'AI Company Research', 'AI Contact Finder', 'AI Lead Score', 'AI Proposal Generator', 'Export CSV', 'Email Support'],
  professional: ['2,000 Prospect Discovery', 'AI Best 10 Recommendation', 'Website Analysis', 'Opportunity Score', 'AI Sales Strategy', 'AI WhatsApp Generator', 'AI Cold Email Generator', 'CRM', 'Unlimited Export', 'Priority Support'],
  business: ['Unlimited Prospect', 'Team Management (10 members)', 'AI Dashboard', 'AI Competitor Analysis', 'Pipeline Prediction', 'API Access', 'White Label', 'Dedicated Support'],
};

export default function PricingPage() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') return;
    setLoading(planId);
    try {
      const res = await api.post<{ checkout_url: string }>('/billing/subscribe', {
        plan_id: planId,
        billing_cycle: cycle,
      });
      window.location.href = res.data.checkout_url;
    } catch (err) {
      toast('error', (err as ApiError).message || 'Failed to start checkout');
      setLoading(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Choose Your Plan</h1>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-2">Scale your sales pipeline with AI-powered prospect discovery</p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <span className={`text-[13px] ${cycle === 'monthly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>Monthly</span>
          <button
            onClick={() => setCycle(c => c === 'monthly' ? 'yearly' : 'monthly')}
            className="relative w-12 h-6 rounded-full bg-[var(--bg-surface)] border border-[var(--border-default)] transition-colors"
            aria-label="Toggle billing cycle"
          >
            <motion.div
              className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-indigo-500"
              animate={{ x: cycle === 'yearly' ? 24 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            />
          </button>
          <span className={`text-[13px] ${cycle === 'yearly' ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)]'}`}>Yearly</span>
          {cycle === 'yearly' && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-medium">
              Save 20%
            </span>
          )}
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan, i) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              cycle={cycle}
              index={i}
              loading={loading === plan.id}
              onSubscribe={() => handleSubscribe(plan.id)}
            />
          ))}
        </div>
      </div>
    </AppLayout>
  );
}

function PricingCard({ plan, cycle, index, loading, onSubscribe }: {
  plan: PlanDefinition; cycle: 'monthly' | 'yearly'; index: number; loading: boolean; onSubscribe: () => void;
}) {
  const price = cycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  const features = FEATURES_LIST[plan.id] || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className={`relative rounded-2xl border p-6 flex flex-col ${
        plan.isRecommended
          ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.06] to-purple-500/[0.03] ring-1 ring-indigo-500/20'
          : 'border-[var(--border-default)] bg-[var(--bg-secondary)]'
      }`}
    >
      {plan.isRecommended && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">
          Most Popular
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--text-primary)]">{plan.name}</h3>
        <div className="mt-2">
          <span className="text-2xl font-bold text-[var(--text-primary)]">{price === 0 ? 'Free' : formatRupiah(price)}</span>
          {price > 0 && <span className="text-[11px] text-[var(--text-tertiary)] ml-1">/{cycle === 'monthly' ? 'mo' : 'yr'}</span>}
        </div>
        {cycle === 'yearly' && plan.monthlyPrice > 0 && (
          <div className="text-[11px] text-[var(--text-tertiary)] mt-1">
            {formatRupiah(plan.monthlyPrice)}/mo billed annually
          </div>
        )}
      </div>

      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-[12px] text-[var(--text-secondary)]">
            <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
            {f}
          </li>
        ))}
      </ul>

      <Button
        onClick={onSubscribe}
        loading={loading}
        variant={plan.isRecommended ? 'primary' : plan.id === 'free' ? 'ghost' : 'secondary'}
        className="w-full"
        size="sm"
      >
        {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
      </Button>
    </motion.div>
  );
}
