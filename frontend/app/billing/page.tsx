'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import { formatRupiah } from '@/lib/billing/plan-catalog';
import type { PlanDefinition, TransactionRecord } from '@/lib/billing/types';
import Link from 'next/link';

interface BillingData {
  subscription: {
    plan_id: string;
    status: string;
    billing_cycle: string;
    current_period_end: string;
    cancelled_at: string | null;
  } | null;
  plan: PlanDefinition | null;
  transactions: TransactionRecord[];
}

export default function BillingPage() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    api.get<BillingData>('/billing/subscription')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until your billing period ends.')) return;
    try {
      await api.put('/billing/subscription', { action: 'cancel' });
      toast('success', 'Subscription cancelled');
      window.location.reload();
    } catch (err) { toast('error', (err as ApiError).message || 'Failed'); }
  };

  const handleResume = async () => {
    try {
      await api.put('/billing/subscription', { action: 'resume' });
      toast('success', 'Subscription resumed');
      window.location.reload();
    } catch (err) { toast('error', (err as ApiError).message || 'Failed'); }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}
        </div>
      </AppLayout>
    );
  }

  const sub = data?.subscription;
  const plan = data?.plan;
  const isPaid = sub?.status === 'active' || sub?.status === 'pending_cancellation';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Billing</h1>

        {/* Current Plan */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-1">Current Plan</div>
              <div className="text-lg font-bold text-[var(--text-primary)]">{plan?.name || 'Free'}</div>
              <div className="text-[12px] text-[var(--text-tertiary)] mt-1">
                {isPaid ? (
                  <>
                    {formatRupiah(sub?.billing_cycle === 'yearly' ? (plan?.yearlyPrice || 0) : (plan?.monthlyPrice || 0))}
                    /{sub?.billing_cycle === 'yearly' ? 'year' : 'month'}
                    {sub?.status === 'pending_cancellation' && (
                      <span className="ml-2 text-amber-400">· Cancels {new Date(sub.current_period_end).toLocaleDateString()}</span>
                    )}
                  </>
                ) : 'No active subscription'}
              </div>
            </div>
            <div className="flex gap-2">
              {isPaid && sub?.status !== 'pending_cancellation' && (
                <Button variant="danger" size="sm" onClick={handleCancel}>Cancel</Button>
              )}
              {sub?.status === 'pending_cancellation' && (
                <Button variant="secondary" size="sm" onClick={handleResume}>Resume</Button>
              )}
              <Link href="/pricing">
                <Button variant="secondary" size="sm">{isPaid ? 'Change Plan' : 'Upgrade'}</Button>
              </Link>
            </div>
          </div>

          {isPaid && sub && (
            <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-[var(--border-subtle)]">
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Status</div>
                <div className={`text-[13px] font-medium mt-0.5 ${sub.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {sub.status === 'active' ? 'Active' : sub.status === 'pending_cancellation' ? 'Cancelling' : sub.status}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Billing Cycle</div>
                <div className="text-[13px] text-[var(--text-primary)] mt-0.5 capitalize">{sub.billing_cycle}</div>
              </div>
              <div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase">Renews</div>
                <div className="text-[13px] text-[var(--text-primary)] mt-0.5">{new Date(sub.current_period_end).toLocaleDateString()}</div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Payment History */}
        {data?.transactions && data.transactions.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Payment History</h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {data.transactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="text-[12px] text-[var(--text-primary)]">{formatRupiah(tx.amount)}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">{new Date(tx.createdAt).toLocaleDateString()}</div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                    tx.status === 'paid' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : tx.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>{tx.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No subscription */}
        {!isPaid && (
          <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-8 text-center">
            <p className="text-[14px] text-[var(--text-primary)] font-medium">Upgrade to unlock premium features</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Get unlimited prospect discovery, AI proposals, and more.</p>
            <Link href="/pricing"><Button className="mt-4" size="sm">View Plans</Button></Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
