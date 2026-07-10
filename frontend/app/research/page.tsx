'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';

interface PainPoint { pain: string; reasoning: string; }
interface Opportunity { service: string; fit_reason: string; }
interface Objection { objection: string; response: string; }

interface IntelligenceReport {
  executive_summary: string;
  company_overview: {
    industry: string;
    business_model: string;
    products_services: string;
    target_market: string;
    estimated_size: string;
    growth_stage: string;
  };
  technology_stack: {
    website_platform: string;
    analytics: string;
    marketing_tools: string;
    crm: string;
    other_tools: string;
  };
  digital_presence: {
    website_quality: string;
    seo_assessment: string;
    social_media: {
      linkedin: string;
      instagram: string;
      facebook: string;
      other: string;
    };
    content_activity: string;
  };
  business_signals: {
    hiring: string;
    funding: string;
    expansion: string;
    partnerships: string;
    news: string;
  };
  scores: {
    opportunity_score: number;
    opportunity_reasoning: string;
    buying_intent: string;
    buying_intent_reasoning: string;
    digital_maturity: number;
    digital_maturity_reasoning: string;
  };
  pain_points: PainPoint[];
  opportunities: Opportunity[];
  sales_strategy: {
    suggested_angle: string;
    value_proposition: string;
    first_message: string;
    best_department: string;
    objections: Objection[];
    followup_sequence: string[];
  };
  confidence: {
    level: string;
    limitations: string;
  };
}

interface Report {
  id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  output: IntelligenceReport;
  opportunity_score: number;
  buying_intent: string;
  digital_maturity: number;
  version: number;
  created_at: string;
}

interface Proposal { id: string; content: string; created_at: string; }
interface Email { id: string; subject: string; body: string; tone: string; created_at: string; }
interface WhatsApp { id: string; message: string; created_at: string; }

// Score Badge Component
function ScoreBadge({ score, label, size = 'md' }: { score: number; label: string; size?: 'sm' | 'md' | 'lg' }) {
  const color = score >= 75 ? 'text-green-600 bg-green-50 border-green-200' 
    : score >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' 
    : 'text-red-600 bg-red-50 border-red-200';
  const sizeClass = size === 'lg' ? 'text-3xl font-bold' : size === 'md' ? 'text-xl font-bold' : 'text-lg font-semibold';
  
  return (
    <div className={`rounded-xl border p-4 text-center ${color}`}>
      <div className={sizeClass}>{score}</div>
      <div className="text-xs font-medium mt-1 opacity-75">{label}</div>
    </div>
  );
}

// Intent Badge
function IntentBadge({ intent }: { intent: string }) {
  const color = intent === 'High' ? 'bg-green-100 text-green-700' 
    : intent === 'Medium' ? 'bg-amber-100 text-amber-700' 
    : 'bg-red-100 text-red-700';
  return <span className={`px-3 py-1 rounded-full text-sm font-medium ${color}`}>{intent}</span>;
}

// Collapsible Section
function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        <span className={`text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-5 pb-5 border-t border-gray-100 pt-4">{children}</div>}
    </div>
  );
}

function ResearchContent() {
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState(searchParams.get('company') || '');
  const [website, setWebsite] = useState(searchParams.get('website') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [country, setCountry] = useState('');
  const [notes, setNotes] = useState('');
  const companyId = searchParams.get('company_id') || '';

  const [researching, setResearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [report, setReport] = useState<Report | null>(null);

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);
  const [email, setEmail] = useState<Email | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailTone, setEmailTone] = useState('formal');
  const [whatsapp, setWhatsApp] = useState<WhatsApp | null>(null);
  const [generatingWhatsApp, setGeneratingWhatsApp] = useState(false);

  const [history, setHistory] = useState<Report[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const { toast } = useToast();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get<Report[]>('/research');
      setHistory(res.data || []);
    } catch { /* ignore */ }
  };

  const statusMessages = [
    'Analyzing company profile...',
    'Detecting technology stack...',
    'Evaluating digital presence...',
    'Identifying business signals...',
    'Calculating opportunity score...',
    'Detecting pain points...',
    'Mapping service opportunities...',
    'Building sales strategy...',
    'Preparing intelligence report...',
  ];

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearching(true);
    setReport(null);
    setProposal(null);
    setEmail(null);
    setWhatsApp(null);

    let msgIndex = 0;
    setStatusMessage(statusMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setStatusMessage(statusMessages[msgIndex]);
    }, 3000);

    try {
      const res = await api.post<Report>('/research', {
        company_name: companyName,
        website: website || undefined,
        industry: industry || undefined,
        country: country || undefined,
        notes: notes || undefined,
        target_company_id: companyId || undefined,
      });
      setReport(res.data);
      toast('success', 'Intelligence report complete! ✓');
      loadHistory();
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "We couldn't complete the research. Try again.");
    } finally {
      clearInterval(interval);
      setResearching(false);
      setStatusMessage('');
    }
  };

  const handleGenerateProposal = async () => {
    if (!report) return;
    setGeneratingProposal(true);
    try {
      const res = await api.post<Proposal>('/proposal', { research_id: report.id });
      setProposal(res.data);
      toast('success', 'Proposal ready! ✓');
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "Couldn't generate proposal.");
    } finally { setGeneratingProposal(false); }
  };

  const handleGenerateEmail = async () => {
    if (!report) return;
    setGeneratingEmail(true);
    try {
      const res = await api.post<Email>('/email', { research_id: report.id });
      setEmail(res.data);
      toast('success', 'Email ready! ✓');
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "Couldn't generate email.");
    } finally { setGeneratingEmail(false); }
  };

  const handleGenerateWhatsApp = async () => {
    if (!report) return;
    setGeneratingWhatsApp(true);
    try {
      const res = await api.post<WhatsApp>('/whatsapp', { research_id: report.id });
      setWhatsApp(res.data);
      toast('success', 'Message ready! ✓');
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "Couldn't generate message.");
    } finally { setGeneratingWhatsApp(false); }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast('success', `${label} copied! ✓`);
  };

  const exportMarkdown = () => {
    if (!report) return;
    const r = report.output;
    const md = `# Intelligence Report: ${report.company_name}
Generated: ${new Date(report.created_at).toLocaleDateString()}

## Executive Summary
${r.executive_summary}

## Company Overview
- Industry: ${r.company_overview.industry}
- Business Model: ${r.company_overview.business_model}
- Products/Services: ${r.company_overview.products_services}
- Target Market: ${r.company_overview.target_market}
- Size: ${r.company_overview.estimated_size}
- Growth Stage: ${r.company_overview.growth_stage}

## Scores
- Opportunity Score: ${r.scores.opportunity_score}/100
- Buying Intent: ${r.scores.buying_intent}
- Digital Maturity: ${r.scores.digital_maturity}/100

## Pain Points
${r.pain_points.map(p => `- ${p.pain}: ${p.reasoning}`).join('\n')}

## Opportunities
${r.opportunities.map(o => `- ${o.service}: ${o.fit_reason}`).join('\n')}

## Sales Strategy
- Angle: ${r.sales_strategy.suggested_angle}
- Value Prop: ${r.sales_strategy.value_proposition}
- Contact: ${r.sales_strategy.best_department}
- First Message: ${r.sales_strategy.first_message}
`;
    navigator.clipboard.writeText(md);
    toast('success', 'Report copied as Markdown! ✓');
  };

  const loadFromHistory = (item: Report) => {
    setReport(item);
    setCompanyName(item.company_name);
    setWebsite(item.website || '');
    setIndustry(item.industry || '');
    setProposal(null);
    setEmail(null);
    setWhatsApp(null);
    setShowHistory(false);
  };

  // Navigation items for report sections
  const navItems = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'tech', label: 'Tech Stack', icon: '💻' },
    { id: 'digital', label: 'Digital', icon: '🌐' },
    { id: 'signals', label: 'Signals', icon: '📡' },
    { id: 'pain', label: 'Pain Points', icon: '🎯' },
    { id: 'opportunities', label: 'Opportunities', icon: '💡' },
    { id: 'strategy', label: 'Strategy', icon: '🗺️' },
    { id: 'materials', label: 'Materials', icon: '📄' },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Company Intelligence</h1>
            <p className="text-gray-500 mt-1">Complete business intelligence for B2B sales</p>
          </div>
          <div className="flex gap-2">
            {history.length > 0 && (
              <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
                {showHistory ? 'Hide' : `History (${history.length})`}
              </Button>
            )}
          </div>
        </div>

        {/* History Panel */}
        {showHistory && history.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="font-medium text-gray-900 mb-2">Previous Reports</h3>
            {history.map(item => (
              <button key={item.id} onClick={() => loadFromHistory(item)} 
                className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center">
                <div>
                  <span className="font-medium text-gray-900">{item.company_name}</span>
                  {item.opportunity_score > 0 && (
                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${item.opportunity_score >= 75 ? 'bg-green-100 text-green-700' : item.opportunity_score >= 50 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                      {item.opportunity_score}%
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}

        {/* Research Form */}
        <form onSubmit={handleResearch} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Research a Company</h2>
          <Input label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter any company name" required />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input label="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" />
            <Input label="Industry (optional)" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Software, Farmasi..." />
            <Input label="Country (optional)" value={country} onChange={e => setCountry(e.target.value)} placeholder="Indonesia" />
          </div>
          <Textarea label="Additional notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Klien untuk jasa perbaikan website, target marketing manager..." rows={2} />
          <Button type="submit" loading={researching} className="w-full">
            {researching ? statusMessage : '🔍 Research Company'}
          </Button>
          {researching && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              <span className="text-sm text-blue-700 font-medium">{statusMessage}</span>
            </div>
          )}
        </form>

        {/* Intelligence Report */}
        {report && report.output && (
          <div className="space-y-4 animate-fade-in">
            {/* Report Header with Scores */}
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{report.company_name}</h2>
                  <p className="text-sm text-gray-500 mt-1">{report.output.executive_summary}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={exportMarkdown} className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50">📋 Export</button>
                  <button onClick={handleResearch} className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50">🔄 Regenerate</button>
                </div>
              </div>

              {/* Score Cards */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <ScoreBadge score={report.output.scores.opportunity_score} label="Opportunity" size="lg" />
                <div className="rounded-xl border p-4 text-center bg-gray-50 border-gray-200">
                  <IntentBadge intent={report.output.scores.buying_intent} />
                  <div className="text-xs font-medium mt-2 text-gray-500">Buying Intent</div>
                </div>
                <ScoreBadge score={report.output.scores.digital_maturity} label="Digital Maturity" size="lg" />
              </div>

              {/* Confidence */}
              <div className="mt-4 p-3 rounded-lg bg-gray-50 flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${report.output.confidence.level === 'High' ? 'bg-green-100 text-green-700' : report.output.confidence.level === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {report.output.confidence.level} Confidence
                </span>
                <span className="text-xs text-gray-500">{report.output.confidence.limitations}</span>
              </div>
            </div>

            {/* Section Navigation */}
            <div className="flex gap-1 overflow-x-auto pb-1">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                    activeSection === item.id ? 'bg-blue-100 text-blue-700' : 'text-gray-500 hover:bg-gray-100'
                  }`}>
                  <span>{item.icon}</span> {item.label}
                </button>
              ))}
            </div>

            {/* Company Overview Section */}
            {activeSection === 'overview' && (
              <Section title="Company Overview" icon="📊" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Industry', value: report.output.company_overview.industry },
                    { label: 'Business Model', value: report.output.company_overview.business_model },
                    { label: 'Products & Services', value: report.output.company_overview.products_services },
                    { label: 'Target Market', value: report.output.company_overview.target_market },
                    { label: 'Estimated Size', value: report.output.company_overview.estimated_size },
                    { label: 'Growth Stage', value: report.output.company_overview.growth_stage },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm text-gray-900 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Technology Stack */}
            {activeSection === 'tech' && (
              <Section title="Technology Stack" icon="💻" defaultOpen={true}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Website Platform', value: report.output.technology_stack.website_platform },
                    { label: 'Analytics', value: report.output.technology_stack.analytics },
                    { label: 'Marketing Tools', value: report.output.technology_stack.marketing_tools },
                    { label: 'CRM', value: report.output.technology_stack.crm },
                    { label: 'Other Tools', value: report.output.technology_stack.other_tools },
                  ].map(item => (
                    <div key={item.label} className="p-3 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase tracking-wide">{item.label}</div>
                      <div className="text-sm text-gray-900 mt-1">{item.value}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Digital Presence */}
            {activeSection === 'digital' && (
              <Section title="Digital Presence" icon="🌐" defaultOpen={true}>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase">Website Quality</div>
                      <div className="text-sm text-gray-900 mt-1">{report.output.digital_presence.website_quality}</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase">SEO Assessment</div>
                      <div className="text-sm text-gray-900 mt-1">{report.output.digital_presence.seo_assessment}</div>
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="text-xs font-medium text-gray-400 uppercase mb-2">Social Media</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {Object.entries(report.output.digital_presence.social_media).map(([platform, status]) => (
                        <div key={platform} className="text-center p-2 rounded-lg bg-white border border-gray-100">
                          <div className="text-xs capitalize text-gray-500">{platform}</div>
                          <div className={`text-xs font-medium mt-0.5 ${status === 'Active' ? 'text-green-600' : 'text-gray-400'}`}>{status}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-gray-50">
                    <div className="text-xs font-medium text-gray-400 uppercase">Content Activity</div>
                    <div className="text-sm text-gray-900 mt-1">{report.output.digital_presence.content_activity}</div>
                  </div>
                </div>
              </Section>
            )}

            {/* Business Signals */}
            {activeSection === 'signals' && (
              <Section title="Business Signals" icon="📡" defaultOpen={true}>
                <div className="space-y-3">
                  {[
                    { label: 'Hiring', value: report.output.business_signals.hiring, icon: '👥' },
                    { label: 'Funding', value: report.output.business_signals.funding, icon: '💰' },
                    { label: 'Expansion', value: report.output.business_signals.expansion, icon: '📈' },
                    { label: 'Partnerships', value: report.output.business_signals.partnerships, icon: '🤝' },
                    { label: 'News', value: report.output.business_signals.news, icon: '📰' },
                  ].map(item => (
                    <div key={item.label} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
                      <span className="text-lg">{item.icon}</span>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{item.label}</div>
                        <div className="text-sm text-gray-600 mt-0.5">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Pain Points */}
            {activeSection === 'pain' && (
              <Section title="Pain Points" icon="🎯" defaultOpen={true}>
                <div className="space-y-3">
                  {report.output.pain_points.map((point, i) => (
                    <div key={i} className="p-4 rounded-lg bg-red-50 border border-red-100">
                      <div className="font-medium text-gray-900 text-sm">{point.pain}</div>
                      <div className="text-sm text-gray-600 mt-1">{point.reasoning}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Opportunities */}
            {activeSection === 'opportunities' && (
              <Section title="Service Opportunities" icon="💡" defaultOpen={true}>
                <div className="space-y-3">
                  {report.output.opportunities.map((opp, i) => (
                    <div key={i} className="p-4 rounded-lg bg-green-50 border border-green-100">
                      <div className="font-medium text-gray-900 text-sm">{opp.service}</div>
                      <div className="text-sm text-gray-600 mt-1">{opp.fit_reason}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Sales Strategy */}
            {activeSection === 'strategy' && (
              <Section title="Sales Strategy" icon="🗺️" defaultOpen={true}>
                <div className="space-y-4">
                  {/* Approach */}
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="text-xs font-medium text-blue-600 uppercase">Sales Angle</div>
                    <div className="text-sm text-gray-900 mt-1">{report.output.sales_strategy.suggested_angle}</div>
                  </div>
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-100">
                    <div className="text-xs font-medium text-blue-600 uppercase">Value Proposition</div>
                    <div className="text-sm text-gray-900 mt-1">{report.output.sales_strategy.value_proposition}</div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase">Best Department</div>
                      <div className="text-sm text-gray-900 mt-1 font-medium">{report.output.sales_strategy.best_department}</div>
                    </div>
                    <div className="p-4 rounded-lg bg-gray-50">
                      <div className="text-xs font-medium text-gray-400 uppercase">First Message</div>
                      <div className="text-sm text-gray-900 mt-1">{report.output.sales_strategy.first_message}</div>
                      <button onClick={() => copyToClipboard(report.output.sales_strategy.first_message, 'First message')} className="text-xs text-blue-600 mt-2 hover:underline">Copy message</button>
                    </div>
                  </div>

                  {/* Objections */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Predicted Objections & Responses</h4>
                    <div className="space-y-2">
                      {report.output.sales_strategy.objections.map((obj, i) => (
                        <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                          <div className="text-sm font-medium text-gray-900">❓ {obj.objection}</div>
                          <div className="text-sm text-gray-600 mt-1">💬 {obj.response}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Follow-up Sequence */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommended Follow-up Sequence</h4>
                    <div className="space-y-2">
                      {report.output.sales_strategy.followup_sequence.map((step, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                          <div className="h-6 w-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">{i + 1}</div>
                          <span className="text-sm text-gray-700">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* Generate Materials Section */}
            {activeSection === 'materials' && (
              <div className="space-y-4">
                <Section title="Generate Sales Materials" icon="📄" defaultOpen={true}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <Button onClick={handleGenerateProposal} loading={generatingProposal} variant="secondary">
                      {generatingProposal ? 'Writing proposal...' : '📄 Generate Proposal'}
                    </Button>
                    <div className="flex gap-2">
                      <select value={emailTone} onChange={e => setEmailTone(e.target.value)} className="rounded-lg border border-gray-200 px-2 text-sm">
                        <option value="formal">Formal</option>
                        <option value="friendly">Friendly</option>
                        <option value="direct">Direct</option>
                      </select>
                      <Button onClick={handleGenerateEmail} loading={generatingEmail} variant="secondary" className="flex-1">
                        {generatingEmail ? 'Writing...' : '✉️ Email'}
                      </Button>
                    </div>
                    <Button onClick={handleGenerateWhatsApp} loading={generatingWhatsApp} variant="secondary">
                      {generatingWhatsApp ? 'Writing...' : '💬 WhatsApp'}
                    </Button>
                  </div>
                </Section>

                {/* Proposal */}
                {proposal && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">📄 Proposal</h3>
                      <button onClick={() => copyToClipboard(proposal.content, 'Proposal')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">{proposal.content}</div>
                  </div>
                )}

                {/* Email */}
                {email && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">✉️ Outreach Email</h3>
                      <button onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, 'Email')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-3">
                      <p className="text-xs text-gray-400 uppercase">Subject</p>
                      <p className="font-medium text-gray-900 text-sm">{email.subject}</p>
                    </div>
                    <div className="whitespace-pre-wrap text-sm text-gray-600 leading-relaxed">{email.body}</div>
                  </div>
                )}

                {/* WhatsApp */}
                {whatsapp && (
                  <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">💬 WhatsApp</h3>
                      <button onClick={() => copyToClipboard(whatsapp.message, 'Message')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
                    </div>
                    <div className="max-w-sm">
                      <div className="rounded-2xl rounded-bl-sm bg-green-100 p-4 text-sm text-gray-800 leading-relaxed">{whatsapp.message}</div>
                      <p className="text-xs text-gray-400 mt-1">{whatsapp.message.length}/500 characters</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ResearchPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" /></div>}>
      <ResearchContent />
    </Suspense>
  );
}
