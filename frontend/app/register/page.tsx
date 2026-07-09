'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ApiError } from '@/lib/api';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});
    setLoading(true);

    try {
      await register(fullName, email, password, passwordConfirmation);
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
            <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              S
            </div>
            <span className="text-lg font-semibold text-gray-900">SalesPilot</span>
          </Link>

          <h1 className="text-2xl font-bold text-gray-900">Start closing more deals</h1>
          <p className="mt-2 text-sm text-gray-500">Create your free account. No credit card needed.</p>

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Input
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={fieldErrors.full_name}
              placeholder="Alex Johnson"
              required
            />

            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={fieldErrors.email}
              placeholder="alex@company.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={fieldErrors.password}
              placeholder="At least 8 characters"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Re-enter your password"
              required
            />

            <Button type="submit" loading={loading} className="w-full">
              Get Started Free
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign In
              </Link>
            </p>
          </div>

          <div className="mt-4 text-center">
            <Link href="/demo" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
              Or try the demo first →
            </Link>
          </div>
        </div>
      </div>

      {/* Right Panel — Social Proof */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 to-indigo-700 items-center justify-center p-12">
        <div className="max-w-md text-white space-y-8">
          <h2 className="text-3xl font-bold">AI-powered sales in 60 seconds</h2>
          <div className="space-y-4">
            {[
              'Enter any company name',
              'AI researches their business instantly',
              'Get a tailored proposal, email, and WhatsApp message',
              'Copy, send, close the deal',
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {i + 1}
                </div>
                <span className="text-blue-50">{step}</span>
              </div>
            ))}
          </div>
          <div className="pt-4 border-t border-white/20">
            <p className="text-sm text-blue-200">
              Trusted by agencies, software houses, and B2B consultants.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
