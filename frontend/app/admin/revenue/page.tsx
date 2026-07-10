'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import { formatRupiah } from '@/lib/billing/plan-catalog';

interface RevenueData {
  mrr: number;
  arr: number;
  totalRevenue: number;
  todayRevenue: number;
  activeSubscribers: number;
  trialUsers: number;
  arpu: number;
  planDistribution: Record<string, number>;
  recentTransactions: Array<{
    id: string;
    userName: string;
    email: string;
    amount: number;
    planId: string;
    billingCycle: string;
    paidAt: string;
  }>;
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get<RevenueData>('/billing/admin/revenue')
      .then(res => setData(res.data))
      .catch(err => setError(err.message || 'Access denied'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <AppLayout><div className="max-w-5xl mx-auto space-y-4">{[1,2,3].map(i => <div key={i} className="h-24 skeleton rounded-2xl" />)}</div></AppLayout>;
  if (error) return <AppLayout><div className="text-center py-16 text-red-400">{error}</div></AppLayout>;
  if (!data) return null;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Revenue Dashboard</h1>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="MRR" value={formatRupiah(data.mrr)} color="indigo" />
          <MetricCard label="ARR" value={formatRupiah(data.arr)} color="purple" />
          <MetricCard label="Today" value={formatRupiah(data.todayRevenue)} color="emerald" />
          <MetricCard label="Total Revenue" value={formatRupiah(data.totalRevenue)} color="amber" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Active Subscribers" value={String(data.activeSubscribers)} color="emerald" />
          <MetricCard label="Trial Users" value={String(data.trialUsers)} color="blue" />
          <MetricCard label="ARPU" value={formatRupiah(data.arpu)} color="purple" />
          <MetricCard label="Total Users" value={String(data.activeSubscribers + data.trialUsers)} color="gray" />
        </div>

        {/* Plan Distribution */}
        <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
          <h2 className="text-[13px] font-semibold text-[var(--text-primary)] mb-4">Plan Distribution</h2>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(data.planDistribution).map(([plan, count]) => (
              <div key={plan} className="text-center p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                <div className="text-lg font-bold text-[var(--text-primary)]">{count}</div>
                <div className="text-[10px] text-[var(--text-tertiary)] uppercase capitalize">{plan}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        {data.recentTransactions.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Recent Transactions</h2>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {data.recentTransactions.map(tx => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div>
                    <div className="text-[12px] text-[var(--text-primary)]">{tx.userName}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">{tx.email} · {tx.planId} ({tx.billingCycle})</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-medium text-emerald-400">{formatRupiah(tx.amount)}</div>
                    <div className="text-[10px] text-[var(--text-tertiary)]">{new Date(tx.paidAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  const colors: Record<string, string> = {
    indigo: 'border-indigo-500/20 bg-indigo-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
    emerald: 'border-emerald-500/20 bg-emerald-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    gray: 'border-white/10 bg-white/5',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-4 ${colors[color] || colors.gray}`}>
      <div className="text-lg font-bold text-[var(--text-primary)]">{value}</div>
      <div className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-0.5">{label}</div>
    </motion.div>
  );
}
