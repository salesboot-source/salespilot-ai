'use client';

import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function BillingSuccessPage() {
  return (
    <AppLayout>
      <div className="max-w-lg mx-auto text-center py-16">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="mx-auto h-20 w-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" strokeLinecap="round"/>
              <path d="M22 4L12 14.01l-3-3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Payment Successful!</h1>
          <p className="text-[14px] text-[var(--text-tertiary)] mt-3">
            Your subscription is now active. Welcome to SalesPilot Pro.
          </p>
          <div className="flex gap-3 justify-center mt-8">
            <Link href="/prospect-discovery">
              <Button>Start Discovering</Button>
            </Link>
            <Link href="/billing">
              <Button variant="secondary">View Billing</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
