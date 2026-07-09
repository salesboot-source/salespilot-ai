'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-100 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">SalesPilot</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/demo"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Try Demo
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors px-5 py-2 rounded-xl"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-medium text-blue-700 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
            AI-Powered Sales Engine
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight tracking-tight">
            Turn any company into
            <br />
            <span className="text-blue-600">a closed deal.</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Research companies, generate tailored proposals, write personalized emails — all with AI. In seconds, not hours.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3.5 text-base font-medium text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
            >
              Start Free →
            </Link>
            <Link
              href="/demo"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-gray-200 px-8 py-3.5 text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See it in action
            </Link>
          </div>
          <p className="mt-4 text-sm text-gray-400">No credit card required</p>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">From company name to closed deal</h2>
            <p className="mt-3 text-lg text-gray-500">Four steps. Under 60 seconds.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Enter a company', desc: 'Type any company name or website URL' },
              { step: '2', title: 'AI researches', desc: 'We analyze their business, challenges, and opportunities' },
              { step: '3', title: 'Get a proposal', desc: 'Receive a personalized, professional proposal' },
              { step: '4', title: 'Send outreach', desc: 'Copy AI-written emails and WhatsApp messages' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="font-semibold text-gray-900">{item.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900">Everything you need to close more deals</h2>
            <p className="mt-3 text-lg text-gray-500">No more staring at blank screens. Let AI do the heavy lifting.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '🔍', title: 'AI Company Research', desc: 'Instantly understand any company — their business, challenges, and how you can help.' },
              { icon: '📄', title: 'Proposal Generator', desc: 'Professional, personalized proposals in seconds. Tailored to each prospect.' },
              { icon: '✉️', title: 'Email Writer', desc: 'Outreach emails that get replies. Choose your tone — formal, friendly, or direct.' },
              { icon: '💬', title: 'WhatsApp Messages', desc: 'Short, punchy messages perfect for WhatsApp. Ready to copy and send.' },
              { icon: '📊', title: 'Lead Pipeline', desc: 'Track every opportunity from prospect to closed deal. Simple and visual.' },
              { icon: '⚡', title: 'Instant Results', desc: 'No setup, no training. Enter a company name and get results in under a minute.' },
            ].map((feature) => (
              <div
                key={feature.title}
                className="rounded-2xl border border-gray-200 p-6 hover:border-blue-200 hover:shadow-sm transition-all"
              >
                <span className="text-2xl">{feature.icon}</span>
                <h3 className="mt-3 font-semibold text-gray-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900">Simple pricing</h2>
          <p className="mt-3 text-lg text-gray-500">Start free. Upgrade when you&apos;re ready.</p>
          <div className="mt-10 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="inline-flex items-center rounded-full bg-green-50 px-3 py-1 text-sm font-medium text-green-700 mb-4">
              Early Access
            </div>
            <h3 className="text-2xl font-bold text-gray-900">Free during beta</h3>
            <p className="mt-2 text-gray-500">Full access to all features while we&apos;re in beta.</p>
            <div className="mt-6">
              <Link
                href="/register"
                className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-8 py-3 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
              >
                Get Started Free
              </Link>
            </div>
            <p className="mt-4 text-xs text-gray-400">Paid plans coming soon. Early users get special pricing.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
              S
            </div>
            <span className="text-sm font-medium text-gray-500">SalesPilot AI</span>
          </div>
          <p className="text-sm text-gray-400">© 2024 SalesPilot. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
