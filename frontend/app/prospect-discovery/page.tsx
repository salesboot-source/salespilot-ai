'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import type { ProspectResult, DiscoveryInsights, SearchHistoryEntry, SortCriterion } from '@/lib/discovery/types';
import Link from 'next/link';

// ============================================================
// UTILITIES
// ============================================================

function fmt(v: number | null): string {
  if (!v) return '—';
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function scoreColor(v: number) {
  if (v >= 75) return 'text-emerald-400';
  if (v >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBadgeBg(v: number) {
  if (v >= 75) return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
  if (v >= 50) return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
  return 'bg-red-500/10 border-red-500/20 text-red-400';
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

const EXAMPLES = [
  'Hotels in Bali',
  'Travel Agency Singapore',
  'Restaurant Bandung',
  'Dental Clinic Australia',
  'Software House Malaysia',
  'Factories Jakarta',
];

const STAGES = [
  'Searching companies',
  'Analyzing markets',
  'Detecting technology',
  'Scoring opportunities',
  'Ranking prospects',
  'Generating insights',
];

// ============================================================
// PROSPECT CARD
// ============================================================

function ProspectCard({ prospect, index, onSave }: { prospect: ProspectResult; index: number; onSave: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const s = prospect.scores;

  const actionColors: Record<string, string> = {
    'Contact Today': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    'Research First': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    'Monitor': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    'Low Priority': 'bg-white/5 text-[var(--text-tertiary)] border-white/10',
    'Skip': 'bg-red-500/10 text-red-400 border-red-500/20',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.3 }}
      className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5 hover:border-indigo-500/20 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center gap-2.5">
            <Stars count={prospect.ai_rating_stars} />
            <h3 className="text-[14px] font-semibold text-[var(--text-primary)]">{prospect.company_name}</h3>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {prospect.location_city && <span className="text-[11px] text-[var(--text-tertiary)]">{prospect.location_city}, {prospect.location_country}</span>}
            {prospect.industry && <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[var(--text-tertiary)]">{prospect.industry}</span>}
          </div>
        </div>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${actionColors[prospect.ai_rating_action] || actionColors['Monitor']}`}>
          {prospect.ai_rating_action}
        </span>
      </div>

      {/* Scores row */}
      <div className="grid grid-cols-5 gap-2 mb-3">
        {prospect.ideal_client_match && (
          <div className="text-center p-2 rounded-lg bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
            <div className="text-sm font-bold text-indigo-400">{prospect.ideal_client_match.score}</div>
            <div className="text-[9px] text-indigo-400/70 uppercase">Match</div>
          </div>
        )}
        <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <div className={`text-sm font-bold ${scoreColor(s.opportunity_score)}`}>{s.opportunity_score}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase">Opportunity</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <div className={`text-sm font-bold ${scoreColor(s.digital_gap)}`}>{s.digital_gap}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase">Digital Gap</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <div className="text-sm font-bold text-[var(--text-primary)]">{fmt(prospect.estimated_deal_value_max)}</div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase">Deal Value</div>
        </div>
        <div className="text-center p-2 rounded-lg bg-[var(--bg-tertiary)]">
          <div className={`text-sm font-bold ${s.buying_intent === 'High' ? 'text-emerald-400' : s.buying_intent === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
            {s.buying_intent}
          </div>
          <div className="text-[9px] text-[var(--text-tertiary)] uppercase">Intent</div>
        </div>
      </div>

      {/* Reasoning + Match reasons */}
      <p className="text-[11px] text-[var(--text-secondary)] mb-2">{prospect.reasoning}</p>
      {prospect.ideal_client_match && prospect.ideal_client_match.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {prospect.ideal_client_match.reasons.map((r, i) => (
            <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">✓ {r}</span>
          ))}
          {prospect.ideal_client_match.closing_chance > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
              {prospect.ideal_client_match.closing_chance}% closing chance
            </span>
          )}
        </div>
      )}

      {/* Tech + Services */}
      <div className="flex flex-wrap gap-1 mb-3">
        {prospect.recommended_services.slice(0, 3).map((s, i) => (
          <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">{s}</span>
        ))}
        {prospect.technology_stack.slice(0, 3).map((t, i) => (
          <span key={`t${i}`} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[var(--text-tertiary)]">{t}</span>
        ))}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link href={`/research?company=${encodeURIComponent(prospect.company_name)}&website=${encodeURIComponent(prospect.website || '')}&industry=${encodeURIComponent(prospect.industry || '')}`}>
          <Button variant="secondary" size="sm">Research</Button>
        </Link>
        <Button variant="ghost" size="sm" onClick={onSave}>Save Lead</Button>
        <button onClick={() => setExpanded(!expanded)} className="ml-auto text-[10px] text-[var(--text-tertiary)] hover:text-indigo-400 transition-colors">
          {expanded ? '− Less' : '+ Details'}
        </button>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 pt-3 border-t border-[var(--border-subtle)]"
          >
            <div className="grid grid-cols-3 gap-2 mb-2">
              <MiniStat label="Website" value={`${s.website_score}`} color={scoreColor(s.website_score)} />
              <MiniStat label="SEO" value={`${s.seo_score}`} color={scoreColor(s.seo_score)} />
              <MiniStat label="AI Ready" value={`${s.ai_readiness}`} color={scoreColor(s.ai_readiness)} />
            </div>
            {prospect.evidence.length > 0 && (
              <div className="space-y-1 mt-2">
                {prospect.evidence.map((e, i) => (
                  <div key={i} className="text-[10px] text-[var(--text-tertiary)] pl-2 border-l border-white/10">{e}</div>
                ))}
              </div>
            )}
            {prospect.website && (
              <a href={`https://${prospect.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noopener noreferrer"
                className="inline-block mt-2 text-[10px] text-indigo-400 hover:text-indigo-300">
                {prospect.website} ↗
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="p-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)] text-center">
      <div className={`text-xs font-bold ${color}`}>{value}</div>
      <div className="text-[8px] text-[var(--text-tertiary)] uppercase">{label}</div>
    </div>
  );
}

// ============================================================
// INSIGHTS PANEL
// ============================================================

function InsightsPanel({ insights }: { insights: DiscoveryInsights }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
        <div className="text-xl font-bold text-[var(--text-primary)]">{insights.total_found}</div>
        <div className="text-[10px] text-emerald-400 uppercase tracking-wider mt-0.5">Companies Found</div>
      </div>
      <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
        <div className="text-xl font-bold text-[var(--text-primary)]">{fmt(insights.total_potential_revenue)}</div>
        <div className="text-[10px] text-indigo-400 uppercase tracking-wider mt-0.5">Potential Revenue</div>
      </div>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="text-xl font-bold text-[var(--text-primary)]">{insights.average_opportunity}</div>
        <div className="text-[10px] text-amber-400 uppercase tracking-wider mt-0.5">Avg Opportunity</div>
      </div>
      <div className="rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
        <div className="text-xl font-bold text-[var(--text-primary)]">{fmt(insights.average_deal_size)}</div>
        <div className="text-[10px] text-purple-400 uppercase tracking-wider mt-0.5">Avg Deal Size</div>
      </div>
    </div>
  );
}

// ============================================================
// PROGRESS INDICATOR
// ============================================================

function ProgressIndicator({ stage }: { stage: number }) {
  return (
    <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-6 mb-6 space-y-3">
      {STAGES.map((s, i) => {
        const isActive = i === stage;
        const isDone = i < stage;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className={`h-1.5 flex-1 rounded-full overflow-hidden ${isDone ? 'bg-indigo-500' : 'bg-[var(--bg-tertiary)]'}`}>
              {isActive && (
                <motion.div
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: '80%' }}
                  transition={{ duration: 4, ease: 'easeOut' }}
                />
              )}
            </div>
            <span className={`text-[11px] w-40 ${isActive ? 'text-indigo-400 font-medium' : isDone ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}`}>
              {isDone ? '✓' : isActive ? '●' : '○'} {s}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

function DiscoveryContent() {
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [stage, setStage] = useState(0);
  const [prospects, setProspects] = useState<ProspectResult[]>([]);
  const [insights, setInsights] = useState<DiscoveryInsights | null>(null);
  const [history, setHistory] = useState<SearchHistoryEntry[]>([]);
  const [sortBy, setSortBy] = useState<SortCriterion>('match');
  const { toast } = useToast();

  useEffect(() => {
    api.get<SearchHistoryEntry[]>('/discover').then(r => setHistory(r.data || [])).catch(() => {});
  }, []);

  const handleSearch = async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q || q.trim().length < 2) return;
    setQuery(q);
    setSearching(true);
    setProspects([]);
    setInsights(null);
    setStage(0);

    const iv = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 5000);

    try {
      const res = await api.post<{ prospects: ProspectResult[]; insights: DiscoveryInsights; search_id: string }>('/discover', { query: q.trim() });
      setProspects(res.data.prospects || []);
      setInsights(res.data.insights || null);
      toast('success', `Found ${res.data.prospects.length} companies`);
      api.get<SearchHistoryEntry[]>('/discover').then(r => setHistory(r.data || [])).catch(() => {});
    } catch (err) {
      toast('error', (err as ApiError).message || 'Discovery failed');
    } finally {
      clearInterval(iv);
      setSearching(false);
    }
  };

  const handleSave = async (prospect: ProspectResult) => {
    try {
      await api.post('/workspace', { prospect });
      toast('success', `${prospect.company_name} saved to workspace`);
    } catch (err) {
      toast('error', (err as ApiError).message || 'Failed to save');
    }
  };

  // Sort
  const sorted = [...prospects].sort((a, b) => {
    switch (sortBy) {
      case 'match': return (b.ideal_client_match?.score || 0) - (a.ideal_client_match?.score || 0);
      case 'closing_chance': return (b.ideal_client_match?.closing_chance || 0) - (a.ideal_client_match?.closing_chance || 0);
      case 'opportunity': return b.scores.opportunity_score - a.scores.opportunity_score;
      case 'revenue': return (b.estimated_deal_value_max || 0) - (a.estimated_deal_value_max || 0);
      case 'buying_intent': return intentVal(b.scores.buying_intent) - intentVal(a.scores.buying_intent);
      case 'employees': return (b.employee_count || 0) - (a.employee_count || 0);
      case 'digital_gap': return b.scores.digital_gap - a.scores.digital_gap;
      case 'ai_rating': return b.ai_rating_stars - a.ai_rating_stars;
      default: return 0;
    }
  });

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        {/* Hero */}
        {prospects.length === 0 && !searching && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center py-12 mb-8">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/20 flex items-center justify-center mb-5">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-indigo-400">
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">AI Prospect Discovery</h1>
            <p className="text-[13px] text-[var(--text-tertiary)] mt-2 max-w-md mx-auto">
              Let AI find your next customers. Search by industry, city, or business type.
            </p>
          </motion.div>
        )}

        {/* Search bar */}
        <div className="mb-6">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="relative">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search companies, industries, cities or services..."
              className="w-full rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] px-6 py-4 text-[15px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:border-indigo-500/50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            <button type="submit" disabled={searching || query.length < 2}
              className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 text-white text-[13px] font-medium shadow-lg shadow-indigo-500/25 disabled:opacity-40 hover:from-indigo-400 hover:to-indigo-500 transition-all">
              {searching ? 'Searching...' : 'Discover'}
            </button>
          </form>

          {/* Examples */}
          {prospects.length === 0 && !searching && (
            <div className="flex flex-wrap gap-2 mt-3 justify-center">
              {EXAMPLES.map(ex => (
                <button key={ex} onClick={() => { setQuery(ex); handleSearch(ex); }}
                  className="text-[11px] px-3 py-1.5 rounded-lg border border-[var(--border-default)] text-[var(--text-tertiary)] hover:text-indigo-400 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Progress */}
        {searching && <ProgressIndicator stage={stage} />}

        {/* Results */}
        {insights && <InsightsPanel insights={insights} />}

        {prospects.length > 0 && (
          <>
            {/* TOP 10 BEST CLIENTS */}
            {sorted.filter(p => p.ideal_client_match?.is_top_10).length > 0 && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-amber-400 text-lg">⭐</span>
                  <h2 className="text-[15px] font-semibold text-[var(--text-primary)]">Top 10 Best Clients For You</h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">AI Curated</span>
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)] mb-4">
                  If you only contact 10 companies this week, these give you the highest chance of winning.
                </p>
                <div className="space-y-3">
                  {sorted
                    .filter(p => p.ideal_client_match?.is_top_10)
                    .sort((a, b) => (b.ideal_client_match?.score || 0) - (a.ideal_client_match?.score || 0))
                    .map((p, i) => (
                      <ProspectCard key={`top-${p.company_name}-${i}`} prospect={p} index={i} onSave={() => handleSave(p)} />
                    ))
                  }
                </div>
              </div>
            )}

            {/* ALL RESULTS */}
            <div className="border-t border-[var(--border-subtle)] pt-6">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[12px] text-[var(--text-tertiary)]">{prospects.length} companies found</span>
              <div className="flex gap-1 flex-wrap">
                {([
                  ['match', 'Best Match'],
                  ['opportunity', 'Opportunity'],
                  ['closing_chance', 'Closing %'],
                  ['revenue', 'Revenue'],
                  ['buying_intent', 'Intent'],
                  ['digital_gap', 'Digital Gap'],
                ] as [SortCriterion, string][]).map(([key, label]) => (
                  <button key={key} onClick={() => setSortBy(key)}
                    className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${sortBy === key ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] border border-transparent'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cards */}
            <div className="space-y-4">
              {sorted.map((p, i) => (
                <ProspectCard key={`${p.company_name}-${i}`} prospect={p} index={i} onSave={() => handleSave(p)} />
              ))}
            </div>
            </div>
          </>
        )}

        {/* Search History */}
        {!searching && prospects.length === 0 && history.length > 0 && (
          <div className="mt-8 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border-subtle)]">
              <span className="text-[12px] font-semibold text-[var(--text-primary)]">Recent Searches</span>
            </div>
            <div className="divide-y divide-[var(--border-subtle)]">
              {history.slice(0, 5).map(h => (
                <button key={h.id} onClick={() => { setQuery(h.keyword); handleSearch(h.keyword); }}
                  className="w-full flex items-center justify-between px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[var(--text-tertiary)]">
                      <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35" strokeLinecap="round"/>
                    </svg>
                    <span className="text-[13px] text-[var(--text-primary)]">{h.keyword}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[var(--text-tertiary)]">{h.companies_found_count} companies</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{new Date(h.search_date).toLocaleDateString()}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function intentVal(intent: string): number {
  if (intent === 'High') return 3;
  if (intent === 'Medium') return 2;
  return 1;
}

export default function ProspectDiscoveryPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
      </div>
    }>
      <DiscoveryContent />
    </Suspense>
  );
}
