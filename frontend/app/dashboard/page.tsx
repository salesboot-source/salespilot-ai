'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { AppLayout } from '@/components/layout/AppLayout';
import { api } from '@/lib/api';
import Link from 'next/link';

interface DashboardStats {
  total_reports: number;
  avg_opportunity_score: number;
  total_companies: number;
  total_proposals: number;
}

interface RecentReport {
  id: string;
  company_name: string;
  opportunity_score: number;
  buying_intent: string;
  created_at: string;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({ total_reports: 0, avg_opportunity_score: 0, total_companies: 0, total_proposals: 0 });
  const [recentReports, setRecentReports] = useState<RecentReport[]>([]);
  const [loading, setLoading] = useState(true);

  const profileComplete = user?.has_company_profile ?? false;

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // Load reports for stats
      const reportsRes = await api.get<RecentReport[]>('/research');
      const reports = reportsRes.data || [];
      
      const companiesRes = await api.get<unknown[]>('/companies');
      const companies = companiesRes.data || [];

      const totalReports = reports.length;
      const avgScore = totalReports > 0 
        ? Math.round(reports.reduce((sum, r) => sum + (r.opportunity_score || 0), 0) / totalReports) 
        : 0;

      setStats({
        total_reports: totalReports,
        avg_opportunity_score: avgScore,
        total_companies: companies.length,
        total_proposals: 0,
      });

      setRecentReports(reports.slice(0, 5));
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Greeting */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="mt-1 text-gray-500">
            {stats.total_reports > 0
              ? `You've researched ${stats.total_reports} companies. Keep building your pipeline.`
              : "Let's get your sales engine set up."}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Research Completed" value={loading ? '...' : String(stats.total_reports)} icon="📊" color="blue" />
          <StatCard label="Avg Opportunity" value={loading ? '...' : `${stats.avg_opportunity_score}%`} icon="🎯" color={stats.avg_opportunity_score >= 70 ? 'green' : 'amber'} />
          <StatCard label="Target Companies" value={loading ? '...' : String(stats.total_companies)} icon="🏢" color="gray" />
          <StatCard label="Company Profile" value={profileComplete ? 'Complete' : 'Set Up →'} icon="✓" color={profileComplete ? 'green' : 'gray'} href={profileComplete ? undefined : '/company-profile'} />
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Link href="/research" className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 hover:bg-blue-100 transition-colors">
              <span className="text-2xl">🔍</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">Research Company</div>
                <div className="text-xs text-gray-500">AI intelligence report</div>
              </div>
            </Link>
            <Link href="/companies" className="flex items-center gap-3 p-4 rounded-xl bg-purple-50 border border-purple-100 hover:bg-purple-100 transition-colors">
              <span className="text-2xl">🏢</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">Add Company</div>
                <div className="text-xs text-gray-500">Build your target list</div>
              </div>
            </Link>
            <Link href="/company-profile" className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-100 hover:bg-green-100 transition-colors">
              <span className="text-2xl">⚙️</span>
              <div>
                <div className="font-medium text-gray-900 text-sm">My Business</div>
                <div className="text-xs text-gray-500">Company profile settings</div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Reports */}
        {recentReports.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Recent Intelligence Reports</h2>
              <Link href="/research" className="text-sm text-blue-600 hover:text-blue-700 font-medium">View all →</Link>
            </div>
            <div className="space-y-2">
              {recentReports.map(report => (
                <Link key={report.id} href={`/research`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="font-medium text-gray-900 text-sm">{report.company_name}</div>
                    {report.buying_intent && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        report.buying_intent === 'High' ? 'bg-green-100 text-green-700' 
                        : report.buying_intent === 'Medium' ? 'bg-amber-100 text-amber-700' 
                        : 'bg-red-100 text-red-700'
                      }`}>{report.buying_intent}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {report.opportunity_score > 0 && (
                      <span className={`text-sm font-semibold ${report.opportunity_score >= 75 ? 'text-green-600' : report.opportunity_score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                        {report.opportunity_score}%
                      </span>
                    )}
                    <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Onboarding for new users */}
        {!loading && stats.total_reports === 0 && (
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-2xl flex-shrink-0">🚀</div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Ready to research your first company?</h2>
                <p className="mt-1 text-gray-600">
                  Enter any company name and get a complete intelligence report in under 60 seconds. 
                  AI will analyze their business, identify pain points, and suggest how to approach them.
                </p>
                <Link href="/research" className="inline-flex items-center gap-1 mt-3 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-100 px-4 py-2 rounded-lg">
                  🔍 Research Your First Company →
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function StatCard({ label, value, icon, color = 'gray', href }: { label: string; value: string; icon: string; color?: string; href?: string }) {
  const colorBg = color === 'green' ? 'bg-green-50 border-green-100' 
    : color === 'blue' ? 'bg-blue-50 border-blue-100' 
    : color === 'amber' ? 'bg-amber-50 border-amber-100'
    : 'bg-gray-50 border-gray-100';
  
  const content = (
    <div className={`rounded-2xl border p-5 ${colorBg} ${href ? 'hover:shadow-sm transition-shadow cursor-pointer' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-lg">{icon}</span>
      </div>
      <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );

  if (href) return <Link href={href}>{content}</Link>;
  return content;
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
