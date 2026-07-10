'use client';

import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function BillingFailedPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="mx-auto h-20 w-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-400">
            <circle cx="12" cy="12" r="10"/>
            <path d="M15 9l-6 6M9 9l6 6" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payment Failed</h1>
        <p className="text-[14px] text-[var(--text-tertiary)] mt-3">
          Your payment could not be processed. Please try again or use a different payment method.
        </p>
        <div className="flex gap-3 justify-center mt-8">
          <Link href="/pricing">
            <Button>Try Again</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary">Back to Dashboard</Button>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
