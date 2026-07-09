'use client';

import { useState } from 'react';
import Link from 'next/link';

const DEMO_COMPANY = {
  name: 'ABC Travel',
  website: 'www.abctravel.com',
};

const DEMO_RESEARCH = {
  overview: 'ABC Travel is a mid-market travel management company serving corporate clients across Europe. Founded in 2015, they specialize in business travel solutions, offering booking platforms, expense management, and travel policy compliance tools for companies with 200-2000 employees.',
  industry: 'They operate in the corporate travel management space, competing with TravelPerk, Navan, and SAP Concur. Their differentiator is personalized service for mid-market companies that find enterprise solutions too complex and consumer tools too basic.',
  news: 'Recently announced a €5M Series A funding round (Q3 2024). Expanding into DACH markets. Launched a new mobile app for traveler self-service. Hiring aggressively for sales and product roles — 12 open positions on LinkedIn.',
  painPoints: 'Based on their job postings and recent content, they likely face challenges with: (1) Scaling customer acquisition beyond referrals, (2) Competing against well-funded rivals with limited marketing budget, (3) Building brand awareness in new markets (DACH expansion).',
  size: 'Estimated 80-120 employees based on LinkedIn data. Revenue likely €8-15M ARR based on funding stage and team size.',
};

const DEMO_PROPOSAL = `# Sales Proposal for ABC Travel

## Executive Summary

We propose a strategic partnership to accelerate ABC Travel's customer acquisition and market expansion efforts. Our AI-powered sales enablement platform can help your team generate 3x more qualified pipeline while reducing manual research and outreach time by 70%.

## The Challenge

As ABC Travel expands into DACH markets, your sales team faces increasing pressure to:
- Research and understand diverse company profiles across new regions
- Create personalized outreach at scale without sacrificing quality
- Compete against well-funded competitors with larger sales teams
- Build brand awareness while maintaining unit economics

## Proposed Solution

Our platform integrates seamlessly with your existing workflow to:

**1. AI Company Research** — Instantly analyze any target company's business, tech stack, and decision-makers.

**2. Personalized Proposals** — Generate tailored proposals that reference each prospect's specific challenges and opportunities.

**3. Multi-Channel Outreach** — Create personalized emails and messages for each prospect, ready to send in seconds.

## Key Benefits

- **3x Pipeline Growth** — Your reps spend time selling, not researching
- **70% Time Saved** — Eliminate hours of manual research per prospect
- **Higher Reply Rates** — Personalized outreach that references real company data
- **Faster DACH Expansion** — Scale outreach without hiring proportionally

## Suggested Next Steps

1. 30-minute demo tailored to ABC Travel's workflow
2. 14-day pilot with your DACH expansion team
3. Review results and discuss full rollout
`;

const DEMO_EMAIL = {
  subject: 'Helping ABC Travel scale outreach for DACH expansion',
  body: `Hi Sarah,

Congratulations on the recent Series A — exciting times for ABC Travel! 

I noticed you're expanding into DACH markets and hiring aggressively for sales roles. We work with growing travel-tech companies facing exactly this challenge: scaling personalized outreach without proportionally growing headcount.

Our platform helps sales teams research prospects instantly and generate tailored proposals in seconds. Companies like yours typically see a 3x increase in qualified pipeline within the first quarter.

Would a 15-minute call next week make sense? I'd love to show you how it could support your DACH expansion.

Best,
Alex`,
};

const DEMO_WHATSAPP = `Hi Sarah! 👋 Congrats on ABC Travel's Series A. I saw you're expanding into DACH markets — we help travel-tech companies scale outreach with AI-powered personalization. Would love to share how in a quick 10-min chat. Open this week?`;

type Tab = 'research' | 'proposal' | 'email' | 'whatsapp';

export default function DemoPage() {
  const [activeTab, setActiveTab] = useState<Tab>('research');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabs: { id: Tab; label: string; emoji: string }[] = [
    { id: 'research', label: 'Research', emoji: '🔍' },
    { id: 'proposal', label: 'Proposal', emoji: '📄' },
    { id: 'email', label: 'Email', emoji: '✉️' },
    { id: 'whatsapp', label: 'WhatsApp', emoji: '💬' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-blue-600 text-white text-center py-2.5 text-sm font-medium">
        This is a demo with sample data.{' '}
        <Link href="/register" className="underline hover:no-underline">
          Sign up free
        </Link>{' '}
        to generate your own.
      </div>

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">SalesPilot</span>
            <span className="ml-2 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
              Demo
            </span>
          </div>
          <Link
            href="/register"
            className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2 rounded-xl"
          >
            Get Started Free
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Company Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
              A
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">{DEMO_COMPANY.name}</h1>
              <p className="text-sm text-gray-500">{DEMO_COMPANY.website}</p>
            </div>
            <div className="ml-auto">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                Research Complete
              </span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.emoji}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 md:p-8">
          {activeTab === 'research' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Company Overview</h3>
                <p className="text-gray-600 leading-relaxed">{DEMO_RESEARCH.overview}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Market Position</h3>
                <p className="text-gray-600 leading-relaxed">{DEMO_RESEARCH.industry}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Recent News</h3>
                <p className="text-gray-600 leading-relaxed">{DEMO_RESEARCH.news}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Potential Pain Points</h3>
                <p className="text-gray-600 leading-relaxed">{DEMO_RESEARCH.painPoints}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-2">Company Size</h3>
                <p className="text-gray-600 leading-relaxed">{DEMO_RESEARCH.size}</p>
              </div>
            </div>
          )}

          {activeTab === 'proposal' && (
            <div className="space-y-4">
              <div className="prose prose-sm max-w-none text-gray-600 leading-relaxed whitespace-pre-wrap">
                {DEMO_PROPOSAL}
              </div>
              <div className="pt-4 border-t border-gray-100">
                <button
                  onClick={() => copyToClipboard(DEMO_PROPOSAL)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Proposal'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'email' && (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 p-5 bg-gray-50">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Subject</p>
                <p className="font-medium text-gray-900">{DEMO_EMAIL.subject}</p>
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{DEMO_EMAIL.body}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(`Subject: ${DEMO_EMAIL.subject}\n\n${DEMO_EMAIL.body}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  {copied ? '✓ Copied!' : '📋 Copy Email'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'whatsapp' && (
            <div className="space-y-4">
              <div className="max-w-sm">
                <div className="rounded-2xl rounded-bl-sm bg-green-100 p-4 text-sm text-gray-800 leading-relaxed">
                  {DEMO_WHATSAPP}
                </div>
                <p className="mt-2 text-xs text-gray-400">{DEMO_WHATSAPP.length}/500 characters</p>
              </div>
              <button
                onClick={() => copyToClipboard(DEMO_WHATSAPP)}
                className="inline-flex items-center gap-2 rounded-xl bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
              >
                {copied ? '✓ Copied!' : '📋 Copy Message'}
              </button>
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 mb-4">Like what you see? Generate your own in seconds.</p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/25"
          >
            Get Started Free →
          </Link>
        </div>
      </main>
    </div>
  );
}
