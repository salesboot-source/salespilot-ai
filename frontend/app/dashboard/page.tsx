'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';
import type { CompanyReportRow } from '@/lib/intelligence/types';

function formatCurrency(value: number): string {
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
  return `$${value}`;
}

function Stars({ count }: { count: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={`text-xs ${i < count ? 'text-amber-400' : 'text-white/10'}`}>★</span>
      ))}
    </span>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<CompanyReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<CompanyReportRow[]>('/research')
      .then(res => setReports(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalReports = reports.length;
  const revenuePool = reports
    .filter(r => (r.ai_verdict_stars || 0) >= 4)
    .reduce((sum, r) => sum + (r.deal_size_max || 0), 0);
  const highIntentCount = reports.filter(
    r => r.buying_intent === 'High' && (r.urgency_score || 0) > 70
  ).length;
  const topOpp = [...reports]
    .sort((a, b) => (b.ai_verdict_stars || 0) - (a.ai_verdict_stars || 0) || (b.revenue_potential || 0) - (a.revenue_potential || 0))
    [0] || null;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="animate-fade-up">
          <h1 className="text-2xl font-semibold text-[var(--text-primary)] tracking-tight">
            {getGreeting()}, {user?.full_name?.split(' ')[0]}
          </h1>
          <p className="mt-1 text-[13px] text-[var(--text-tertiary)]">
            {totalReports > 0
              ? `${totalReports} companies analyzed · ${formatCurrency(revenuePool)} in your pipeline`
              : 'Start by researching your first target company'}
          </p>
        </div>

        {/* Hero Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-up">
          <MetricCard
            label="Revenue Pipeline"
            value={loading ? '—' : formatCurrency(revenuePool)}
            sub="4-5 star companies"
            gradient="from-indigo-500/10 to-purple-500/10"
            border="border-indigo-500/20"
            icon={<PipelineIcon />}
          />
          <MetricCard
            label="High Intent"
            value={loading ? '—' : String(highIntentCount)}
            sub="Ready to buy"
            gradient="from-emerald-500/10 to-teal-500/10"
            border="border-emerald-500/20"
            icon={<IntentIcon />}
          />
          <MetricCard
            label="Reports Generated"
            value={loading ? '—' : String(totalReports)}
            sub="Companies analyzed"
            gradient="from-amber-500/10 to-orange-500/10"
            border="border-amber-500/20"
            icon={<ReportsIcon />}
          />
        </div>

        {/* Top Opportunity */}
        {topOpp && topOpp.ai_verdict_stars >= 3 && (
          <div className="animate-fade-up">
            <Link href="/research" className="block group">
              <div className="rounded-2xl border border-[var(--border-default)] bg-gradient-to-r from-indigo-500/[0.04] to-purple-500/[0.04] p-6 hover:border-indigo-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase tracking-[0.15em] text-indigo-400 font-semibold mb-2">Top Opportunity</div>
                    <div className="text-lg font-semibold text-[var(--text-primary)] group-hover:text-indigo-300 transition-colors">{topOpp.company_name}</div>
                    <div className="flex items-center gap-3 mt-2">
                      <Stars count={topOpp.ai_verdict_stars} />
                      <span className="text-[12px] text-[var(--text-tertiary)]">{topOpp.ai_verdict_label}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--text-primary)]">{formatCurrency(topOpp.deal_size_max || 0)}</div>
                    <div className="text-[11px] text-[var(--text-tertiary)] mt-0.5">Est. Deal Size</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-up">
          <Link href="/research" className="group flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 hover:border-indigo-500/30 hover:bg-[var(--bg-tertiary)] transition-all duration-200">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">AI Decision Report</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Analyze a company</div>
            </div>
          </Link>
          <Link href="/companies" className="group flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 hover:border-purple-500/30 hover:bg-[var(--bg-tertiary)] transition-all duration-200">
            <div className="h-10 w-10 rounded-xl bg-purple-500/10 flex items-center justify-center group-hover:bg-purple-500/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400">
                <rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h5" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">Companies</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Manage targets</div>
            </div>
          </Link>
          <Link href="/company-profile" className="group flex items-center gap-4 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 hover:border-emerald-500/30 hover:bg-[var(--bg-tertiary)] transition-all duration-200">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400">
                <circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-medium text-[var(--text-primary)]">Settings</div>
              <div className="text-[11px] text-[var(--text-tertiary)]">Company profile</div>
            </div>
          </Link>
        </div>

        {/* Recent Reports */}
        {reports.length > 0 && (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden animate-fade-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <h2 className="text-[13px] font-semibold text-[var(--text-primary)]">Recent Reports</h2>
              <Link href="/research" className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {reports.slice(0, 5).map((r, i) => (
                <div key={r.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <Link href="/research" className="flex items-center justify-between px-6 py-3.5 hover:bg-white/[0.02] transition-colors">
                    <div className="flex items-center gap-3">
                      <Stars count={r.ai_verdict_stars || 0} />
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{r.company_name}</span>
                      {r.ai_verdict_label && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                          r.ai_verdict_stars >= 4 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : r.ai_verdict_stars >= 3 ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-white/5 text-[var(--text-tertiary)] border border-white/10'
                        }`}>{r.ai_verdict_label}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[12px] font-medium text-[var(--text-secondary)]">
                        {formatCurrency(r.deal_size_max || 0)}
                      </span>
                      <span className="text-[11px] text-[var(--text-tertiary)]">
                        {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && totalReports === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--border-default)] p-12 text-center animate-fade-up">
            <div className="mx-auto h-14 w-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Generate your first AI Decision Report</h2>
            <p className="mt-2 text-[13px] text-[var(--text-tertiary)] max-w-sm mx-auto">
              Enter any company name and get a professional revenue intelligence analysis in under 60 seconds.
            </p>
            <Link href="/research" className="inline-flex items-center gap-2 mt-6 text-[13px] font-medium text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-5 py-2.5 rounded-xl border border-indigo-500/20 hover:border-indigo-500/30 transition-all">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Research a Company
            </Link>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// Metric Card
function MetricCard({ label, value, sub, gradient, border, icon }: {
  label: string; value: string; sub: string; gradient: string; border: string; icon: React.ReactNode;
}) {
  return (
    <div className={`rounded-2xl border ${border} bg-gradient-to-br ${gradient} p-5`}>
      <div className="flex items-start justify-between mb-3">
        {icon}
      </div>
      <div className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">{value}</div>
      <div className="text-[12px] font-medium text-[var(--text-secondary)] mt-1">{label}</div>
      <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{sub}</div>
    </div>
  );
}

function PipelineIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function IntentIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-emerald-400"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/><path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/></svg>;
}
function ReportsIcon() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-amber-400"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeLinecap="round"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" strokeLinecap="round"/></svg>;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}
