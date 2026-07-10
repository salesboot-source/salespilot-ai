'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import type { IntelligenceReportV4, CompanyReportRow, EnrichedScore, ServiceRecommendation } from '@/lib/intelligence/types';

// ============================================================
// UTILITIES
// ============================================================

function scoreColor(v: number) {
  if (v >= 75) return 'text-emerald-400';
  if (v >= 50) return 'text-amber-400';
  return 'text-red-400';
}

function scoreBorder(v: number) {
  if (v >= 75) return 'border-emerald-500/20';
  if (v >= 50) return 'border-amber-500/20';
  return 'border-red-500/20';
}

function scoreBg(v: number) {
  if (v >= 75) return 'bg-emerald-500/5';
  if (v >= 50) return 'bg-amber-500/5';
  return 'bg-red-500/5';
}

function fmt(v: number): string {
  if (v >= 1000000) return `$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `$${(v / 1000).toFixed(0)}K`;
  return `$${v}`;
}

function Stars({ count, size = 'md' }: { count: number; size?: 'sm' | 'md' | 'lg' }) {
  const s = size === 'lg' ? 'text-xl' : size === 'sm' ? 'text-xs' : 'text-sm';
  return (
    <span className={`inline-flex gap-0.5 ${s}`} aria-label={`${count} of 5 stars`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} className={i < count ? 'text-amber-400' : 'text-white/10'}>★</span>
      ))}
    </span>
  );
}

function clip(text: string, toast: (t: 'success' | 'error', m: string) => void, label: string) {
  navigator.clipboard.writeText(text);
  toast('success', `${label} copied`);
}

// ============================================================
// SCORE CARD
// ============================================================

function ScoreCard({ score, label, icon }: { score: EnrichedScore; label: string; icon: React.ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.div
      layout
      className={`rounded-2xl border ${scoreBorder(score.value)} ${scoreBg(score.value)} p-5 transition-all hover:border-opacity-40`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-tertiary)]">{label}</span>
        </div>
        <div className="text-[11px] text-[var(--text-tertiary)]">{score.confidence}% conf.</div>
      </div>
      <div className={`text-3xl font-bold mt-3 ${scoreColor(score.value)}`}>{score.value}</div>
      <p className="text-[12px] text-[var(--text-secondary)] mt-2 leading-relaxed">{score.reason}</p>
      <button onClick={() => setExpanded(!expanded)} className="text-[11px] text-[var(--text-tertiary)] hover:text-indigo-400 mt-2 transition-colors">
        {expanded ? '− Hide evidence' : '+ Evidence'}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.ul
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-2 space-y-1 overflow-hidden"
          >
            {score.evidence.map((e, i) => (
              <li key={i} className="text-[11px] text-[var(--text-tertiary)] pl-3 border-l border-white/10">{e}</li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ============================================================
// SERVICE CARD
// ============================================================

function ServiceCard({ rec, index }: { rec: ServiceRecommendation; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center gap-4 p-4 rounded-xl border border-[var(--border-default)] bg-[var(--bg-secondary)] hover:border-indigo-500/20 transition-all group"
    >
      <div className="flex-shrink-0 h-9 w-9 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
        <span className="text-[11px] font-bold text-indigo-400">#{index + 1}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[13px] font-medium text-[var(--text-primary)]">{rec.service}</span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${
            rec.probability >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
            : rec.probability >= 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            : 'bg-red-500/10 text-red-400 border-red-500/20'
          }`}>{rec.probability}%</span>
        </div>
        <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5 truncate">{rec.reason}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-[13px] font-semibold text-[var(--text-primary)]">{fmt(rec.estimated_value_min)}–{fmt(rec.estimated_value_max)}</div>
        <div className="text-[10px] text-[var(--text-tertiary)]">Est. Value</div>
      </div>
    </motion.div>
  );
}

// ============================================================
// AI DECISION HERO CARD
// ============================================================

function DecisionHero({ report }: { report: IntelligenceReportV4 }) {
  const v = report.ai_verdict;
  const s = report.scores;
  const top = report.service_recommendations[0];

  const glowColor = v.stars >= 4 ? 'shadow-emerald-500/10' : v.stars >= 3 ? 'shadow-amber-500/10' : 'shadow-red-500/10';
  const accentColor = v.stars >= 4 ? 'from-emerald-500 to-teal-500' : v.stars >= 3 ? 'from-amber-500 to-orange-500' : 'from-red-500 to-pink-500';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`rounded-3xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-8 shadow-2xl ${glowColor}`}
    >
      {/* Badge + Stars */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${accentColor}`} />
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--text-tertiary)]">AI Decision</span>
        </div>
        <Stars count={v.stars} size="lg" />
      </div>

      {/* Action Label */}
      <h2 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">{v.action_label}</h2>
      <p className="text-[14px] text-[var(--text-secondary)] mt-3 leading-relaxed max-w-2xl">{v.explanation}</p>

      {/* Metrics strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-center border border-[var(--border-subtle)]">
          <div className={`text-2xl font-bold ${scoreColor(s.revenue_potential.value)}`}>{s.revenue_potential.value}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">Revenue</div>
        </div>
        <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-center border border-[var(--border-subtle)]">
          <div className="text-2xl font-bold text-[var(--text-primary)]">{fmt(s.deal_size.max)}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">Deal Size</div>
        </div>
        <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-center border border-[var(--border-subtle)]">
          <div className={`text-2xl font-bold ${scoreColor(s.urgency.value)}`}>{s.urgency.value}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">Urgency</div>
        </div>
        <div className="rounded-xl bg-[var(--bg-tertiary)] p-4 text-center border border-[var(--border-subtle)]">
          <div className="text-sm font-semibold text-[var(--text-primary)] leading-tight">{top?.service || '—'}</div>
          <div className="text-[10px] uppercase tracking-wider text-[var(--text-tertiary)] mt-1">Top Service</div>
        </div>
      </div>

      {/* Key factor */}
      <div className="mt-6 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
        <div className="text-[10px] uppercase tracking-[0.15em] text-indigo-400 font-medium mb-1">Key Factor</div>
        <p className="text-[13px] text-[var(--text-secondary)]">{v.top_reason}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// COLLAPSIBLE SECTION
// ============================================================

function Section({ id, title, children, onCopy }: {
  id: string; title: string; children: React.ReactNode; onCopy?: () => void;
}) {
  const [open, setOpen] = useState(true);
  return (
    <section id={id} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.01] transition-colors"
      >
        <span className="text-[13px] font-semibold text-[var(--text-primary)]">{title}</span>
        <div className="flex items-center gap-2">
          {onCopy && (
            <span
              onClick={(e) => { e.stopPropagation(); onCopy(); }}
              className="text-[11px] text-[var(--text-tertiary)] hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-500/10 cursor-pointer transition-colors"
            >
              Copy
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={`text-[var(--text-tertiary)] transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
            <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 border-t border-[var(--border-subtle)]">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ============================================================
// SIDEBAR NAV
// ============================================================

const NAV = [
  { id: 'decision', label: 'AI Decision' },
  { id: 'scores', label: 'Revenue Scores' },
  { id: 'services', label: 'Services' },
  { id: 'overview', label: 'Company' },
  { id: 'pain', label: 'Pain Points' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'signals', label: 'Signals' },
];

function ReportNav({ active }: { active: string }) {
  return (
    <nav className="hidden lg:block sticky top-8 space-y-0.5 w-44 flex-shrink-0">
      {NAV.map(n => (
        <button
          key={n.id}
          onClick={() => document.getElementById(n.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          className={`w-full text-left px-3 py-1.5 rounded-lg text-[12px] transition-all ${
            active === n.id
              ? 'text-indigo-400 bg-indigo-500/10 font-medium'
              : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-white/[0.02]'
          }`}
        >
          {n.label}
        </button>
      ))}
    </nav>
  );
}

// ============================================================
// LOADING STATE
// ============================================================

const STAGES = [
  'Analyzing company profile',
  'Evaluating market position',
  'Calculating revenue potential',
  'Assessing decision makers',
  'Scoring competitive landscape',
  'Identifying service opportunities',
  'Computing AI verdict',
  'Finalizing report',
];

function LoadingState({ stage }: { stage: number }) {
  const pct = Math.min(((stage + 1) / STAGES.length) * 100, 95);
  const label = STAGES[Math.min(stage, STAGES.length - 1)];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-indigo-500/20 bg-indigo-500/[0.03] p-6 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
        <span className="text-[13px] font-medium text-indigo-300">{label}...</span>
      </div>
      <div className="h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        />
      </div>
      <p className="text-[11px] text-[var(--text-tertiary)]">Typically 20–40 seconds</p>
    </motion.div>
  );
}

// ============================================================
// EXPORT
// ============================================================

function exportMd(name: string, r: IntelligenceReportV4, date: string): string {
  const s = r.scores;
  return `# AI Decision Report: ${name}
Generated: ${new Date(date).toLocaleDateString()}

## AI VERDICT: ${r.ai_verdict.action_label} ${'★'.repeat(r.ai_verdict.stars)}
${r.ai_verdict.explanation}
Key Factor: ${r.ai_verdict.top_reason}

## Revenue Scores
- Revenue Potential: ${s.revenue_potential.value}/100
- Deal Size: ${fmt(s.deal_size.min)}–${fmt(s.deal_size.max)}
- Urgency: ${s.urgency.value}/100
- Decision Maker: ${s.decision_maker_confidence.value}/100
- Competition Risk: ${s.competition_risk.value}/100

## Services
${r.service_recommendations.map((x, i) => `${i+1}. ${x.service} (${x.probability}%) — ${fmt(x.estimated_value_min)}–${fmt(x.estimated_value_max)}`).join('\n')}

## Pain Points
${r.pain_points.map(p => `- [${p.severity}] ${p.pain}`).join('\n')}

## Strategy
- Angle: ${r.sales_strategy.suggested_angle}
- Value Prop: ${r.sales_strategy.value_proposition}
- Target: ${r.sales_strategy.best_department}
- Message: ${r.sales_strategy.first_message}
`;
}

// ============================================================
// MAIN CONTENT
// ============================================================

function ResearchContent() {
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState(searchParams.get('company') || '');
  const [website, setWebsite] = useState(searchParams.get('website') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const companyId = searchParams.get('company_id') || '';

  const [researching, setResearching] = useState(false);
  const [stage, setStage] = useState(0);
  const [report, setReport] = useState<CompanyReportRow | null>(null);
  const [history, setHistory] = useState<CompanyReportRow[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSection, setActiveSection] = useState('decision');

  const { toast } = useToast();

  useEffect(() => {
    api.get<CompanyReportRow[]>('/research').then(r => setHistory(r.data || [])).catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!report) return;
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const idx = NAV.findIndex(n => n.id === activeSection);
      if (e.key === 'j' && idx < NAV.length - 1) {
        const next = NAV[idx + 1].id;
        setActiveSection(next);
        document.getElementById(next)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'k' && idx > 0) {
        const prev = NAV[idx - 1].id;
        setActiveSection(prev);
        document.getElementById(prev)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } else if (e.key === 'e' && report) {
        const o = report.output as IntelligenceReportV4;
        if (o?.ai_verdict) {
          navigator.clipboard.writeText(exportMd(report.company_name, o, report.created_at));
          toast('success', 'Report exported');
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [report, activeSection, toast]);

  // Intersection observer
  useEffect(() => {
    if (!report) return;
    const obs = new IntersectionObserver(
      entries => { for (const e of entries) if (e.isIntersecting) setActiveSection(e.target.id); },
      { rootMargin: '-20% 0px -60% 0px' }
    );
    NAV.forEach(n => { const el = document.getElementById(n.id); if (el) obs.observe(el); });
    return () => obs.disconnect();
  }, [report]);

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearching(true);
    setReport(null);
    setStage(0);
    let s = 0;
    const iv = setInterval(() => { s++; setStage(s); }, 4500);
    try {
      const res = await api.post<CompanyReportRow>('/research', {
        company_name: companyName, website: website || undefined, industry: industry || undefined,
        country: country || undefined, notes: notes || undefined, target_company_id: companyId || undefined,
      });
      setReport(res.data);
      toast('success', 'Report ready');
      api.get<CompanyReportRow[]>('/research').then(r => setHistory(r.data || [])).catch(() => {});
    } catch (err) {
      toast('error', (err as ApiError).message || 'Research failed');
    } finally { clearInterval(iv); setResearching(false); }
  };

  const output = report?.output as IntelligenceReportV4 | undefined;
  const isV4 = output && 'ai_verdict' in output && output.ai_verdict;

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">AI Decision Engine</h1>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Revenue intelligence analysis</p>
          </div>
          {history.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Close' : `History · ${history.length}`}
            </Button>
          )}
        </div>

        {/* History */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden"
            >
              <div className="p-4 max-h-60 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {history.map(h => (
                  <button key={h.id} onClick={() => { setReport(h); setCompanyName(h.company_name); setShowHistory(false); }}
                    className="w-full flex items-center justify-between py-2.5 px-2 hover:bg-white/[0.02] rounded-lg transition-colors">
                    <div className="flex items-center gap-2.5">
                      <Stars count={h.ai_verdict_stars || 0} size="sm" />
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">{h.company_name}</span>
                    </div>
                    <span className="text-[11px] text-[var(--text-tertiary)]">{new Date(h.created_at).toLocaleDateString()}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form */}
        <form onSubmit={handleResearch} className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 mb-6">
          <div className="space-y-4">
            <Input label="Company" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter any company name" required />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="Website" value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" />
              <Input label="Industry" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Software, SaaS..." />
              <Input label="Country" value={country} onChange={e => setCountry(e.target.value)} placeholder="United States" />
            </div>
            <Textarea label="Context" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Decision maker, deal context, services to pitch..." rows={2} />
            <Button type="submit" loading={researching} className="w-full" size="lg">
              {researching ? 'Analyzing...' : 'Generate AI Decision Report'}
            </Button>
          </div>
        </form>

        {/* Loading */}
        {researching && <LoadingState stage={stage} />}

        {/* Report */}
        {isV4 && report && (
          <div className="flex gap-8 mt-8">
            <ReportNav active={activeSection} />

            <div className="flex-1 space-y-5 min-w-0">
              {/* DECISION */}
              <div id="decision"><DecisionHero report={output} /></div>

              {/* SUMMARY */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6">
                <p className="text-[13px] text-[var(--text-secondary)] leading-relaxed">{output.executive_summary}</p>
                <div className="flex items-center gap-3 mt-4 pt-4 border-t border-[var(--border-subtle)]">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                    output.confidence.level === 'High' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                    : output.confidence.level === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                  }`}>{output.confidence.level} Confidence</span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">{output.confidence.limitations}</span>
                </div>
              </div>

              {/* SCORES */}
              <Section id="scores" title="Revenue Intelligence" onCopy={() => clip(
                `Revenue: ${output.scores.revenue_potential.value} | Deal: ${fmt(output.scores.deal_size.min)}–${fmt(output.scores.deal_size.max)} | Urgency: ${output.scores.urgency.value}`,
                toast, 'Scores'
              )}>
                {/* Deal Size */}
                <div className="mb-5 p-5 rounded-xl bg-gradient-to-r from-indigo-500/[0.05] to-purple-500/[0.05] border border-indigo-500/10">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-indigo-400 font-medium mb-1">Estimated Deal Size</div>
                  <div className="text-3xl font-bold text-[var(--text-primary)]">{fmt(output.scores.deal_size.min)} – {fmt(output.scores.deal_size.max)}</div>
                  <p className="text-[12px] text-[var(--text-secondary)] mt-2">{output.scores.deal_size.reason}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {output.scores.deal_size.evidence.map((e, i) => (
                      <span key={i} className="text-[10px] bg-[var(--bg-tertiary)] px-2 py-1 rounded-md border border-[var(--border-subtle)] text-[var(--text-tertiary)]">{e}</span>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <ScoreCard score={output.scores.revenue_potential} label="Revenue Potential" icon={<DollarIcon />} />
                  <ScoreCard score={output.scores.urgency} label="Urgency" icon={<ClockIcon />} />
                  <ScoreCard score={output.scores.decision_maker_confidence} label="Decision Maker" icon={<UserIcon />} />
                  <ScoreCard score={output.scores.competition_risk} label="Competition Risk" icon={<ShieldIcon />} />
                </div>
                {/* Legacy scores */}
                <div className="mt-5 pt-5 border-t border-[var(--border-subtle)]">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-[var(--text-tertiary)] font-medium mb-3">Additional Metrics</div>
                  <div className="grid grid-cols-3 gap-3">
                    <MiniScore value={output.scores.opportunity_score.value} label="Opportunity" />
                    <div className="rounded-xl border border-[var(--border-default)] bg-[var(--bg-tertiary)] p-3 text-center">
                      <div className={`text-sm font-bold ${output.scores.buying_intent.level === 'High' ? 'text-emerald-400' : output.scores.buying_intent.level === 'Medium' ? 'text-amber-400' : 'text-red-400'}`}>
                        {output.scores.buying_intent.level}
                      </div>
                      <div className="text-[9px] uppercase text-[var(--text-tertiary)] mt-1">Intent</div>
                    </div>
                    <MiniScore value={output.scores.digital_maturity.value} label="Digital" />
                  </div>
                </div>
              </Section>

              {/* SERVICES */}
              <Section id="services" title="Recommended Services" onCopy={() => clip(
                output.service_recommendations.map((r, i) => `${i+1}. ${r.service} (${r.probability}%) — ${fmt(r.estimated_value_min)}–${fmt(r.estimated_value_max)}`).join('\n'),
                toast, 'Services'
              )}>
                <div className="space-y-2">
                  {output.service_recommendations.map((rec, i) => <ServiceCard key={i} rec={rec} index={i} />)}
                </div>
                <div className="mt-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                  <div className="text-[10px] uppercase tracking-[0.15em] text-indigo-400 font-medium mb-1">Total Pipeline</div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">
                    {fmt(output.service_recommendations.reduce((s, r) => s + r.estimated_value_min, 0))} – {fmt(output.service_recommendations.reduce((s, r) => s + r.estimated_value_max, 0))}
                  </div>
                </div>
              </Section>

              {/* COMPANY */}
              <Section id="overview" title="Company Profile">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { l: 'Industry', v: output.company_overview.industry },
                    { l: 'Model', v: output.company_overview.business_model },
                    { l: 'Products', v: output.company_overview.products_services },
                    { l: 'Market', v: output.company_overview.target_market },
                    { l: 'Size', v: output.company_overview.estimated_size },
                    { l: 'Growth', v: output.company_overview.growth_stage },
                  ].map(x => (
                    <div key={x.l} className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)]">{x.l}</div>
                      <div className="text-[12px] text-[var(--text-primary)] mt-1 font-medium">{x.v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(output.technology_stack).map(([k, v]) => (
                    <div key={k} className="p-2.5 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-subtle)]">
                      <div className="text-[9px] uppercase text-[var(--text-tertiary)]">{k.replace(/_/g, ' ')}</div>
                      <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">{v}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {Object.entries(output.digital_presence.social_media).map(([p, s]) => (
                    <span key={p} className={`text-[10px] px-2 py-1 rounded-md border ${
                      s === 'Active' ? 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5' : 'border-[var(--border-subtle)] text-[var(--text-tertiary)]'
                    }`}>{p}: {s}</span>
                  ))}
                </div>
              </Section>

              {/* PAIN POINTS */}
              <Section id="pain" title="Pain Points" onCopy={() => clip(output.pain_points.map(p => `[${p.severity}] ${p.pain}`).join('\n'), toast, 'Pain points')}>
                <div className="space-y-2">
                  {output.pain_points.map((p, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                      className={`p-4 rounded-xl border ${p.severity === 'High' ? 'border-red-500/20 bg-red-500/[0.03]' : p.severity === 'Medium' ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-[var(--border-default)] bg-[var(--bg-tertiary)]'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded ${p.severity === 'High' ? 'bg-red-500/15 text-red-400' : p.severity === 'Medium' ? 'bg-amber-500/15 text-amber-400' : 'bg-white/5 text-[var(--text-tertiary)]'}`}>{p.severity}</span>
                        <span className="text-[12px] font-medium text-[var(--text-primary)]">{p.pain}</span>
                      </div>
                      <p className="text-[11px] text-[var(--text-tertiary)] mt-1">{p.reasoning}</p>
                    </motion.div>
                  ))}
                </div>
              </Section>

              {/* STRATEGY */}
              <Section id="strategy" title="Sales Strategy" onCopy={() => clip(
                `Angle: ${output.sales_strategy.suggested_angle}\nValue Prop: ${output.sales_strategy.value_proposition}\nFirst Message: ${output.sales_strategy.first_message}`,
                toast, 'Strategy'
              )}>
                <div className="space-y-3">
                  <div className="p-4 rounded-xl bg-gradient-to-r from-indigo-500/[0.04] to-purple-500/[0.04] border border-indigo-500/10">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-indigo-400 font-medium">Sales Angle</div>
                    <p className="text-[13px] text-[var(--text-primary)] mt-1 font-medium">{output.sales_strategy.suggested_angle}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                    <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">Value Proposition</div>
                    <p className="text-[12px] text-[var(--text-secondary)] mt-1">{output.sales_strategy.value_proposition}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      <div className="text-[9px] uppercase tracking-[0.15em] text-[var(--text-tertiary)]">Target</div>
                      <div className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">{output.sales_strategy.best_department}</div>
                    </div>
                    <div className="p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                      <div className="flex items-center justify-between">
                        <div className="text-[9px] uppercase tracking-[0.15em] text-indigo-400">First Message</div>
                        <button onClick={() => clip(output.sales_strategy.first_message, toast, 'Message')} className="text-[10px] text-indigo-400/60 hover:text-indigo-400 transition-colors">Copy</button>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1 leading-relaxed">{output.sales_strategy.first_message}</p>
                    </div>
                  </div>
                </div>
              </Section>

              {/* SIGNALS */}
              <Section id="signals" title="Business Signals">
                <div className="space-y-2">
                  {[
                    { l: 'Hiring', v: output.business_signals.hiring },
                    { l: 'Funding', v: output.business_signals.funding },
                    { l: 'Expansion', v: output.business_signals.expansion },
                    { l: 'Partnerships', v: output.business_signals.partnerships },
                    { l: 'News', v: output.business_signals.news },
                  ].map(x => (
                    <div key={x.l} className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-subtle)]">
                      <div className="text-[9px] uppercase tracking-wider text-[var(--text-tertiary)] w-20 flex-shrink-0 pt-0.5">{x.l}</div>
                      <div className="text-[12px] text-[var(--text-secondary)]">{x.v}</div>
                    </div>
                  ))}
                </div>
              </Section>

              {/* Footer */}
              <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    v{report.version} · {new Date(report.created_at).toLocaleString()} · {report.ai_model} · Prompt v{report.prompt_version}
                  </span>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(exportMd(report.company_name, output, report.created_at)); toast('success', 'Copied'); }}>Copy</Button>
                    <Button variant="ghost" size="sm" onClick={() => {
                      const blob = new Blob([exportMd(report.company_name, output, report.created_at)], { type: 'text/markdown' });
                      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
                      a.download = `${report.company_name.replace(/\s+/g, '-').toLowerCase()}-report.md`; a.click();
                    }}>Download</Button>
                    <Button variant="ghost" size="sm" onClick={handleResearch}>Regenerate</Button>
                  </div>
                </div>
                <div className="text-[10px] text-[var(--text-tertiary)] mt-2">Keyboard: j/k navigate · e export</div>
              </div>
            </div>
          </div>
        )}

        {/* Legacy fallback */}
        {report && !isV4 && (
          <div className="mt-8 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
            <p className="text-[13px] text-amber-300 mb-3">This report uses an older format. Regenerate for the full AI Decision analysis.</p>
            <Button variant="secondary" onClick={handleResearch}>Upgrade Report</Button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ============================================================
// MINI COMPONENTS
// ============================================================

function MiniScore({ value, label }: { value: number; label: string }) {
  return (
    <div className={`rounded-xl border ${scoreBorder(value)} ${scoreBg(value)} p-3 text-center`}>
      <div className={`text-lg font-bold ${scoreColor(value)}`}>{value}</div>
      <div className="text-[9px] uppercase text-[var(--text-tertiary)] mt-0.5">{label}</div>
    </div>
  );
}

function DollarIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" strokeLinecap="round"/></svg>; }
function ClockIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-amber-400"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2" strokeLinecap="round"/></svg>; }
function UserIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round"/><circle cx="12" cy="7" r="4"/></svg>; }
function ShieldIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round"/></svg>; }

// ============================================================
// PAGE
// ============================================================

export default function ResearchPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
        <div className="h-4 w-4 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
      </div>
    }>
      <ResearchContent />
    </Suspense>
  );
}
