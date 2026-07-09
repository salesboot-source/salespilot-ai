'use client';

import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuth();

  const profileComplete = user?.has_company_profile ?? false;

  // Onboarding steps
  const steps = [
    {
      id: 'profile',
      title: 'Set up your company profile',
      description: 'Tell us about your business so AI can personalize everything',
      complete: profileComplete,
      href: '/company-profile',
      cta: 'Set Up Profile',
    },
    {
      id: 'company',
      title: 'Add your first target company',
      description: 'Enter any company name and watch AI do the research',
      complete: false,
      href: '#',
      cta: 'Coming Soon',
      disabled: true,
    },
    {
      id: 'proposal',
      title: 'Generate your first proposal',
      description: 'Get a professional, personalized proposal in seconds',
      complete: false,
      href: '#',
      cta: 'Coming Soon',
      disabled: true,
    },
  ];

  const completedSteps = steps.filter((s) => s.complete).length;
  const progress = Math.round((completedSteps / steps.length) * 100);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-gray-500">
            {profileComplete
              ? "Your sales engine is ready. Let's find some clients."
              : "Let's get your sales engine set up."}
          </p>
        </div>

        {/* Onboarding Progress */}
        {!profileComplete && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Getting started</h2>
              <span className="text-sm text-gray-500">{completedSteps}/{steps.length} complete</span>
            </div>

            {/* Progress Bar */}
            <div className="h-2 bg-gray-100 rounded-full mb-6 overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 rounded-xl p-4 transition-colors ${
                    step.complete ? 'bg-green-50' : 'bg-gray-50'
                  }`}
                >
                  {/* Status Icon */}
                  <div
                    className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      step.complete
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {step.complete ? '✓' : index + 1}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${step.complete ? 'text-green-800' : 'text-gray-900'}`}>
                      {step.title}
                    </p>
                    <p className="text-sm text-gray-500 mt-0.5">{step.description}</p>
                  </div>

                  {/* Action */}
                  {!step.complete && (
                    <Link
                      href={step.href}
                      className={`flex-shrink-0 text-sm font-medium px-4 py-2 rounded-lg transition-colors ${
                        step.disabled
                          ? 'text-gray-400 bg-gray-100 cursor-not-allowed pointer-events-none'
                          : 'text-blue-600 bg-blue-50 hover:bg-blue-100'
                      }`}
                    >
                      {step.cta}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* When profile is complete — Ready State */}
        {profileComplete && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">
                🚀
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">You&apos;re all set!</h2>
                <p className="mt-1 text-gray-600">
                  Your company profile is ready. AI features (research, proposals, emails) are coming in the next update. We&apos;ll notify you when they&apos;re live.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Company Profile"
            value={profileComplete ? '✓ Complete' : 'Incomplete'}
            color={profileComplete ? 'green' : 'gray'}
          />
          <StatCard
            label="Target Companies"
            value="0"
            sublabel="Coming soon"
            color="gray"
          />
          <StatCard
            label="Proposals Generated"
            value="0"
            sublabel="Coming soon"
            color="gray"
          />
        </div>

        {/* Demo Teaser */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <div className="flex items-start gap-4">
            <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center text-lg flex-shrink-0">
              ✨
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">See what&apos;s coming</h3>
              <p className="mt-1 text-sm text-gray-500">
                Curious about AI proposals and emails? Check out the demo with sample data.
              </p>
              <Link
                href="/demo"
                className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
              >
                View Demo →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  label,
  value,
  sublabel,
  color = 'gray',
}: {
  label: string;
  value: string;
  sublabel?: string;
  color?: 'green' | 'gray' | 'blue';
}) {
  const colorClasses = {
    green: 'text-green-700',
    gray: 'text-gray-900',
    blue: 'text-blue-700',
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <p className="text-sm text-gray-500">{label}</p>
      <p className={`mt-1 text-xl font-semibold ${colorClasses[color]}`}>{value}</p>
      {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
    </div>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
