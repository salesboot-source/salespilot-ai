'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, useScroll, useTransform, useInView } from 'framer-motion';
import { useAuth } from '@/lib/auth';

// ============================================================
// ANIMATED SECTION WRAPPER
// ============================================================

function FadeUp({ children, delay = 0, className = '' }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });
  return (
    <motion.div ref={ref} className={className}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >{children}</motion.div>
  );
}

// ============================================================
// AI TERMINAL — Live typing animation
// ============================================================

const AI_LOGS = [
  '> Connecting to company database...',
  '> Company detected: TravelEase Singapore',
  '> Reading website content...',
  '> Detecting industry: Travel & Tourism',
  '> Analyzing business size: Mid-market (80-200 employees)',
  '> Identifying decision makers...',
  '> Found: Sarah Chen, VP Marketing',
  '> Calculating buying intent... 87%',
  '> Detecting technology gaps...',
  '> Website: WordPress 5.9, No CRM detected',
  '> Generating prospect score: ★★★★★',
  '> Building personalized proposal...',
  '> Drafting outreach email...',
  '> ✓ Prospect analysis complete.',
];

function AITerminal() {
  const [lines, setLines] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentLine(prev => {
        const next = (prev + 1) % AI_LOGS.length;
        if (next === 0) setLines([]);
        return next;
      });
    }, 1800);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setLines(prev => [...prev.slice(-8), AI_LOGS[currentLine]]);
  }, [currentLine]);

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0B1220]/90 backdrop-blur-xl p-5 font-mono text-[11px] overflow-hidden">
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-amber-500/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-emerald-500/60" />
        </div>
        <span className="text-[10px] text-slate-500 ml-2">SalesPilot AI Engine</span>
      </div>
      <div className="space-y-1.5 min-h-[160px]">
        {lines.map((line, i) => (
          <motion.div
            key={`${currentLine}-${i}`}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
            className={`${line.includes('✓') ? 'text-emerald-400' : line.includes('★') ? 'text-amber-400' : 'text-slate-400'}`}
          >
            {line}
          </motion.div>
        ))}
        <span className="inline-block w-2 h-3.5 bg-indigo-400 animate-pulse" />
      </div>
    </div>
  );
}

// ============================================================
// ANIMATED COUNTER
// ============================================================

function AnimatedCounter({ value, suffix = '', prefix = '' }: { value: number; suffix?: string; prefix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!isInView) return;
    const duration = 2000;
    const steps = 60;
    const increment = value / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= value) { setCount(value); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [isInView, value]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

// ============================================================
// LANDING PAGE
// ============================================================

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { scrollY } = useScroll();
  const navBg = useTransform(scrollY, [0, 50], ['rgba(5,8,22,0)', 'rgba(5,8,22,0.85)']);

  useEffect(() => {
    if (!loading && user) router.push('/prospect-discovery');
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#050816]">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-400/30 border-t-indigo-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050816] text-white overflow-x-hidden">
      {/* BACKGROUND */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-indigo-600/10 rounded-full blur-[80px] md:blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] md:w-[500px] h-[250px] md:h-[500px] bg-purple-600/8 rounded-full blur-[80px] md:blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-cyan-500/5 rounded-full blur-[100px] md:blur-[150px]" />
      </div>

      {/* NAVBAR */}
      <motion.nav style={{ backgroundColor: navBg }} className="fixed top-0 w-full z-50 border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/></svg>
            </div>
            <span className="text-[15px] font-semibold tracking-tight">SalesPilot</span>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 ml-1">AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-[13px] text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how" className="text-[13px] text-slate-400 hover:text-white transition-colors">How It Works</a>
            <a href="#pricing" className="text-[13px] text-slate-400 hover:text-white transition-colors">Pricing</a>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-[13px] text-slate-400 hover:text-white transition-colors px-3 py-2">Sign In</Link>
            <Link href="/register" className="text-[13px] font-medium bg-gradient-to-b from-indigo-500 to-indigo-600 text-white px-5 py-2 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all">Start Free</Link>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="md:hidden text-white p-2 min-h-[44px] min-w-[44px] flex items-center justify-center" aria-label="Open menu">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round"/></svg>
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-[60] bg-[#050816]/95 backdrop-blur-xl flex flex-col p-6">
          <div className="flex justify-end">
            <button onClick={() => setMobileMenuOpen(false)} className="text-white p-3 min-h-[44px]" aria-label="Close menu">
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
            </button>
          </div>
          <div className="flex flex-col items-center justify-center flex-1 gap-8">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium min-h-[48px] flex items-center">Features</a>
            <a href="#how" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium min-h-[48px] flex items-center">How It Works</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-2xl font-medium min-h-[48px] flex items-center">Pricing</a>
            <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-lg text-slate-400 min-h-[48px] flex items-center">Sign In</Link>
            <Link href="/register" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium bg-indigo-500 text-white px-8 py-3 rounded-xl min-h-[48px]">Start Free</Link>
          </div>
        </motion.div>
      )}

      {/* HERO */}
      <section className="relative pt-28 md:pt-32 pb-16 md:pb-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left */}
            <div>
              <FadeUp>
                <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 px-4 py-1.5 text-[12px] font-medium text-indigo-300 mb-6">
                  <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse" />
                  AI Revenue Intelligence Platform
                </div>
              </FadeUp>
              <FadeUp delay={0.1}>
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight">
                  Turn Any Company<br />
                  <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">Into Your Next Customer</span>
                </h1>
              </FadeUp>
              <FadeUp delay={0.2}>
                <p className="mt-6 text-[15px] md:text-[16px] text-slate-400 leading-relaxed max-w-lg">
                  SalesPilot AI finds companies ready to buy your services, researches them, scores buying intent, writes personalized outreach, and helps you close deals faster.
                </p>
              </FadeUp>
              <FadeUp delay={0.3}>
                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-medium px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-[14px] min-h-[48px]">
                    Start Free <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </Link>
                  <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-white/10 text-slate-300 font-medium px-7 py-3.5 rounded-xl hover:bg-white/5 transition-all text-[14px] min-h-[48px]">
                    See Demo
                  </Link>
                </div>
              </FadeUp>
              <FadeUp delay={0.4}>
                <div className="mt-8 flex items-center gap-3">
                  <div className="flex -space-x-2">
                    {['A', 'B', 'C', 'D'].map((l, i) => (
                      <div key={i} className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 border-2 border-[#050816] flex items-center justify-center text-[9px] font-bold">{l}</div>
                    ))}
                  </div>
                  <div>
                    <div className="flex text-amber-400 text-xs">★★★★★</div>
                    <span className="text-[11px] text-slate-500">Trusted by 500+ agencies & freelancers</span>
                  </div>
                </div>
              </FadeUp>
            </div>

            {/* Right — AI Terminal */}
            <FadeUp delay={0.3} className="hidden lg:block">
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-3xl blur-xl" />
                <div className="relative">
                  <AITerminal />
                </div>
              </div>
            </FadeUp>
          </div>
        </div>
      </section>

      {/* CREDIBILITY METRICS */}
      <section className="relative py-16 px-6 border-y border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {[
              { value: 200, suffix: 'M+', label: 'Companies Indexed' },
              { value: 95, suffix: '%', label: 'Faster Research' },
              { value: 10, suffix: '×', label: 'More Qualified Leads' },
              { value: 50, suffix: '+', label: 'Countries Covered' },
            ].map((m, i) => (
              <FadeUp key={m.label} delay={i * 0.1} className="text-center">
                <div className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                  <AnimatedCounter value={m.value} suffix={m.suffix} />
                </div>
                <div className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{m.label}</div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="relative py-20 md:py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <FadeUp className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Everything you need to close deals</h2>
            <p className="mt-3 text-slate-400 text-[14px] md:text-[15px] max-w-xl mx-auto">AI-powered tools that replace an entire sales team. From discovery to close.</p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🔍', title: 'AI Prospect Discovery', desc: 'Find 200+ ideal companies instantly. AI searches, scores, and ranks them for you.' },
              { icon: '📊', title: 'Revenue Intelligence', desc: 'Every company scored with deal size, urgency, buying intent, and competition risk.' },
              { icon: '💡', title: 'Service Recommendations', desc: 'AI recommends exactly what to sell each company with probability and value.' },
              { icon: '⚡', title: 'AI Decision Engine', desc: '1-5 star verdict: Should you contact them? How much is this deal worth?' },
              { icon: '📄', title: 'Proposal Generator', desc: 'Professional sales proposals written by AI. Personalized for each prospect.' },
              { icon: '✉️', title: 'Email & WhatsApp', desc: 'AI-written outreach that gets replies. Perfect tone for every channel.' },
              { icon: '🎯', title: 'Ideal Client Match', desc: 'AI matches prospects to your exact profile. Top 10 best fits highlighted.' },
              { icon: '📈', title: 'Revenue Dashboard', desc: 'Pipeline value, opportunity trends, and daily AI recommendations.' },
            ].map((f, i) => (
              <FadeUp key={f.title} delay={i * 0.05}>
                <div className="group rounded-2xl border border-white/5 bg-white/[0.02] p-5 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all duration-300 h-full">
                  <span className="text-2xl">{f.icon}</span>
                  <h3 className="mt-3 text-[13px] md:text-[14px] font-semibold text-white">{f.title}</h3>
                  <p className="mt-1.5 text-[11px] md:text-[12px] text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="relative py-20 md:py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <FadeUp className="text-center mb-12 md:mb-16">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">How it works</h2>
            <p className="mt-3 text-slate-400 text-[14px] md:text-[15px]">From search to signed contract in 4 steps</p>
          </FadeUp>
          <div className="space-y-4 md:space-y-6">
            {[
              { step: '01', title: 'Search', desc: 'Type "Hotels in Bali" or "Travel Agency Singapore". AI discovers 200+ real companies.' },
              { step: '02', title: 'AI Analyzes', desc: 'Each company gets scored: opportunity, buying intent, deal size, technology gaps, growth signals.' },
              { step: '03', title: 'AI Recommends', desc: 'Top 10 best-fit companies highlighted. Know exactly who to contact and what to sell.' },
              { step: '04', title: 'Close Deals', desc: 'Generate personalized proposals, emails, and WhatsApp messages. Walk into meetings prepared.' },
            ].map((s, i) => (
              <FadeUp key={s.step} delay={i * 0.1}>
                <div className="flex items-start gap-4 md:gap-6 p-5 md:p-6 rounded-2xl border border-white/5 bg-white/[0.02] hover:border-indigo-500/20 transition-all">
                  <div className="flex-shrink-0 h-10 w-10 md:h-12 md:w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-xs md:text-sm">
                    {s.step}
                  </div>
                  <div>
                    <h3 className="text-[15px] md:text-[16px] font-semibold text-white">{s.title}</h3>
                    <p className="mt-1 text-[12px] md:text-[13px] text-slate-400">{s.desc}</p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="relative py-20 md:py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <FadeUp className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-400 text-[14px] md:text-[15px]">Start free. Scale as you grow.</p>
          </FadeUp>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-5">
            {[
              { name: 'Free', price: 'Rp 0', desc: 'Get started', features: ['20 Prospect Discovery', 'AI Company Research', 'Basic Scoring', 'Save Prospects'], popular: false },
              { name: 'Professional', price: 'Rp 799K', desc: '/month', features: ['2,000 Prospects', 'AI Best 10 Match', 'Opportunity Scoring', 'Proposal Generator', 'Email & WhatsApp AI', 'CRM', 'Priority Support'], popular: true },
              { name: 'Business', price: 'Rp 1.99M', desc: '/month', features: ['Unlimited Prospects', 'Team Management', 'AI Competitor Analysis', 'API Access', 'White Label', 'Dedicated Support'], popular: false },
            ].map((p, i) => (
              <FadeUp key={p.name} delay={i * 0.08}>
                <div className={`relative rounded-2xl border p-6 md:p-7 h-full flex flex-col ${p.popular ? 'border-indigo-500/40 bg-gradient-to-b from-indigo-500/[0.06] to-purple-500/[0.03] ring-1 ring-indigo-500/20' : 'border-white/5 bg-white/[0.02]'}`}>
                  {p.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] font-semibold px-3 py-1 rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30">Most Popular</span>}
                  <h3 className="text-[15px] font-semibold">{p.name}</h3>
                  <div className="mt-3"><span className="text-2xl font-bold">{p.price}</span><span className="text-[12px] text-slate-400 ml-1">{p.desc}</span></div>
                  <ul className="mt-5 space-y-2.5 flex-1">
                    {p.features.map(f => (<li key={f} className="flex items-start gap-2 text-[12px] text-slate-300"><span className="text-emerald-400 mt-0.5">✓</span>{f}</li>))}
                  </ul>
                  <Link href="/register" className={`mt-6 block text-center text-[13px] font-medium py-3 rounded-xl transition-all min-h-[44px] ${p.popular ? 'bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/25' : 'border border-white/10 text-slate-300 hover:bg-white/5'}`}>
                    {p.name === 'Free' ? 'Start Free' : 'Subscribe'}
                  </Link>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative py-20 md:py-24 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-indigo-500/10 rounded-full blur-[80px] md:blur-[100px]" />
          </div>
          <FadeUp>
            <h2 className="relative text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
              Start Closing More Deals<br /><span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">with AI Today</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="relative mt-4 text-slate-400 text-[14px] md:text-[15px]">Join 500+ agencies using AI to find and close their ideal clients.</p>
          </FadeUp>
          <FadeUp delay={0.2}>
            <div className="relative mt-8 flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register" className="inline-flex items-center justify-center gap-2 bg-gradient-to-b from-indigo-500 to-indigo-600 text-white font-medium px-8 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all text-[14px] min-h-[48px]">Start Free</Link>
              <Link href="/demo" className="inline-flex items-center justify-center gap-2 border border-white/10 text-slate-300 font-medium px-8 py-3.5 rounded-xl hover:bg-white/5 transition-all text-[14px] min-h-[48px]">Book Demo</Link>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-10 md:py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M8 1L14 4.5V11.5L8 15L2 11.5V4.5L8 1Z" fill="white" fillOpacity="0.9"/></svg>
                </div>
                <span className="text-[13px] font-semibold">SalesPilot AI</span>
              </div>
              <p className="text-[11px] text-slate-500">AI-powered revenue intelligence for B2B sales.</p>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Product</h4>
              <div className="space-y-2">
                <a href="#features" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Features</a>
                <Link href="/pricing" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Pricing</Link>
                <Link href="/demo" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Demo</Link>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Company</h4>
              <div className="space-y-2">
                <a href="#" className="block text-[12px] text-slate-500 hover:text-white transition-colors">About</a>
                <a href="#" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3">Legal</h4>
              <div className="space-y-2">
                <a href="#" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Privacy</a>
                <a href="#" className="block text-[12px] text-slate-500 hover:text-white transition-colors">Terms</a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-[11px] text-slate-600">© 2026 SalesPilot AI. All rights reserved.</p>
            <p className="text-[11px] text-slate-600">Built with AI</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
