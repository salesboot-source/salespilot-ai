'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: unknown) {
      const apiError = err as ApiError;
      if (apiError?.errors && typeof apiError.errors === 'object') {
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(apiError.errors)) {
          flat[key] = messages[0];
        }
        setFieldErrors(flat);
      } else if (apiError?.message && apiError.message !== 'Failed to fetch') {
        setError(apiError.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left Panel — Form */}
      <div className="flex flex-1 flex-col justify-center px-6 py-12 lg:px-20">
        <div className="w-full max-w-sm mx-auto">
          {/* Logo */}
          <Link href="/" className="inline-flex items-center gap-2 mb-10">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-[var(--text-primary)]">SalesPilot</span>
          </Link>

          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Welcome back</h1>
          <p className="mt-2 text-[13px] text-[var(--text-tertiary)]">Sign in to continue generating sales content</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3 text-[13px] text-red-400">
                {error}
              </div>
            )}

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              placeholder="you@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              placeholder="••••••••"
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Sign In
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[13px] text-[var(--text-tertiary)]">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Get Started Free
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/demo" className="text-[13px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
              Or try the demo →
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel — Branding */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-indigo-600 to-purple-700 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <blockquote className="text-2xl font-medium leading-relaxed">
            &ldquo;I used to spend 2 hours researching each prospect. Now I enter a company name and get everything I need in 30 seconds.&rdquo;
          </blockquote>
          <div className="mt-6 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium">
              M
            </div>
            <div>
              <p className="font-medium">Marcus Chen</p>
              <p className="text-sm text-indigo-200">Sales Director, TechFlow</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
