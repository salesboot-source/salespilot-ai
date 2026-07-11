'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const DEMO_COMPANY = {
  name: 'ABC Travel',
  website: 'www.abctravel.com',
  industry: 'Corporate Travel Management',
  location: 'Amsterdam, Netherlands',
  size: '80-120 employees',
  revenue: '€8-15M ARR',
  verdict_stars: 4,
  verdict_label: 'Strong Opportunity',
  opportunity_score: 82,
  deal_size: '$15,000 - $45,000',
  buying_intent: 'High',
  match_score: 91,
};

const DEMO_RESEARCH = {
  overview: 'ABC Travel is a mid-market travel management company serving corporate clients across Europe. Founded in 2015, they specialize in business travel solutions, offering booking platforms, expense management, and travel policy compliance tools for companies with 200-2000 employees.',
  market: 'They operate in the corporate travel management space, competing with TravelPerk, Navan, and SAP Concur. Their differentiator is personalized service for mid-market companies.',
  signals: 'Recently announced a €5M Series A funding round. Expanding into DACH markets. Launched a new mobile app. Hiring aggressively — 12 open positions on LinkedIn.',
  painPoints: ['Scaling acquisition beyond referrals', 'Competing against well-funded rivals', 'Building brand awareness in DACH markets', 'Website lacks modern SEO optimization'],
};

const DEMO_PROPOSAL = `Executive Summary

We propose a strategic partnership to accelerate ABC Travel's customer acquisition and market expansion efforts. Our AI-powered sales enablement platform can help your team generate 3x more qualified pipeline while reducing manual research time by 70%.

The Challenge

As ABC Travel expands into DACH markets, your sales team faces increasing pressure to research diverse company profiles, create personalized outreach at scale, and compete against well-funded competitors with larger sales teams.

Proposed Solution

1. AI Company Research — Instantly analyze any target company's business and decision-makers.
2. Personalized Proposals — Generate tailored proposals referencing each prospect's challenges.
3. Multi-Channel Outreach — Create personalized emails and messages ready to send in seconds.

Key Benefits

• 3x Pipeline Growth — Your reps spend time selling, not researching
• 70% Time Saved — Eliminate hours of manual research per prospect
• Higher Reply Rates — Personalized outreach that references real company data
• Faster DACH Expansion — Scale outreach without hiring proportionally`;

const DEMO_EMAIL = {
  subject: 'Helping ABC Travel scale outreach for DACH expansion',
  body: `Hi Sarah,

Congratulations on the recent Series A — exciting times for ABC Travel!

I noticed you're expanding into DACH markets and hiring aggressively for sales roles. We work with growing travel-tech companies facing exactly this challenge: scaling personalized outreach without proportionally growing headcount.

Our platform helps sales teams research prospects instantly and generate tailored proposals in seconds. Companies like yours typically see a 3x increase in qualified pipeline within the first quarter.

Would a 15-minute call next week make sense?

Best,
Alex`,
};

type Tab = 'research' | 'proposal' | 'email';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('research');
  const [copied, setCopied] = useState(false);

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: 'research', label: 'AI Research' },
    { id: 'proposal', label: 'Proposal' },
    { id: 'email', label: 'Email' },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-center py-2.5 text-[12px] font-medium">
        This is a demo with sample data.{' '}
        <Link href="/register" className="underline hover:no-underline">Sign up free</Link>{' '}
        to generate your own.
      </div>

      {/* Header */}
      <header className="border-b border-white/5 px-6 py-4 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/></svg>
            </div>
            <span className="text-[15px] font-semibold">SalesPilot</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 ml-1">Demo</span>
          </div>
          <Link href="/register" className="text-[12px] font-medium bg-gradient-to-b from-indigo-500 to-indigo-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-indigo-500/25">
            Start Free
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* AI Decision Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-lg font-bold">A</div>
                <div>
                  <h1 className="text-lg font-bold">{DEMO_COMPANY.name}</h1>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-slate-400">{DEMO_COMPANY.website}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400">{DEMO_COMPANY.industry}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-amber-400 text-sm">{'★'.repeat(DEMO_COMPANY.verdict_stars)}{'☆'.repeat(5 - DEMO_COMPANY.verdict_stars)}</div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{DEMO_COMPANY.verdict_label}</span>
            </div>
          </div>

          {/* Scores */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="rounded-xl bg-gradient-to-b from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 p-3 text-center">
              <div className="text-lg font-bold text-indigo-400">{DEMO_COMPANY.match_score}</div>
              <div className="text-[9px] text-indigo-400/70 uppercase">Match</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{DEMO_COMPANY.opportunity_score}</div>
              <div className="text-[9px] text-slate-400 uppercase">Opportunity</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-sm font-bold">{DEMO_COMPANY.deal_size}</div>
              <div className="text-[9px] text-slate-400 uppercase">Deal Size</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-lg font-bold text-emerald-400">{DEMO_COMPANY.buying_intent}</div>
              <div className="text-[9px] text-slate-400 uppercase">Intent</div>
            </div>
            <div className="rounded-xl bg-white/[0.03] border border-white/5 p-3 text-center">
              <div className="text-sm font-bold">{DEMO_COMPANY.location}</div>
              <div className="text-[9px] text-slate-400 uppercase">Location</div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-white/[0.03] border border-white/5 mb-6">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-4 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                activeTab === tab.id ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20' : 'text-slate-400 hover:text-white'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-white/10 bg-[#0B1220]/80 p-6 md:p-8">

            {activeTab === 'research' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400 mb-2">Company Overview</h3>
                  <p className="text-[13px] text-slate-300 leading-relaxed">{DEMO_RESEARCH.overview}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400 mb-2">Market Position</h3>
                  <p className="text-[13px] text-slate-300 leading-relaxed">{DEMO_RESEARCH.market}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400 mb-2">Business Signals</h3>
                  <p className="text-[13px] text-slate-300 leading-relaxed">{DEMO_RESEARCH.signals}</p>
                </div>
                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.15em] text-indigo-400 mb-2">Pain Points</h3>
                  <div className="space-y-2">
                    {DEMO_RESEARCH.painPoints.map((p, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                        <span className="text-red-400 text-xs mt-0.5">●</span>
                        <span className="text-[12px] text-slate-300">{p}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/5">
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[9px] text-slate-500 uppercase">Company Size</div>
                    <div className="text-[13px] font-medium mt-0.5">{DEMO_COMPANY.size}</div>
                  </div>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5">
                    <div className="text-[9px] text-slate-500 uppercase">Est. Revenue</div>
                    <div className="text-[13px] font-medium mt-0.5">{DEMO_COMPANY.revenue}</div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'proposal' && (
              <div className="space-y-4">
                <div className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap">{DEMO_PROPOSAL}</div>
                <div className="pt-4 border-t border-white/5">
                  <button onClick={() => copy(DEMO_PROPOSAL)}
                    className="text-[12px] font-medium px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                    {copied ? '✓ Copied' : 'Copy Proposal'}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'email' && (
              <div className="space-y-4">
                <div className="rounded-xl bg-indigo-500/5 border border-indigo-500/10 p-4">
                  <div className="text-[9px] uppercase text-indigo-400 tracking-wider mb-1">Subject</div>
                  <div className="text-[13px] font-medium">{DEMO_EMAIL.subject}</div>
                </div>
                <div className="text-[13px] text-slate-300 leading-relaxed whitespace-pre-wrap p-4 rounded-xl bg-white/[0.02] border border-white/5">
                  {DEMO_EMAIL.body}
                </div>
                <button onClick={() => copy(`Subject: ${DEMO_EMAIL.subject}\n\n${DEMO_EMAIL.body}`)}
                  className="text-[12px] font-medium px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors">
                  {copied ? '✓ Copied' : 'Copy Email'}
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="mt-10 text-center">
          <p className="text-slate-500 text-[13px] mb-4">Like what you see? Generate your own in seconds.</p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-medium px-8 py-3 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-[14px]">
            Start Free
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </Link>
        </div>
      </main>
    </div>
  );
}
