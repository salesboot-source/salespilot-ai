'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';

interface ResearchOutput {
  company_overview: string;
  products: string;
  target_market: string;
  pain_points: string;
  opportunities: string;
  suggested_sales_angle: string;
}

interface Research {
  id: string;
  company_name: string;
  website: string | null;
  output: ResearchOutput;
  created_at: string;
}

interface Proposal { id: string; content: string; created_at: string; }
interface Email { id: string; subject: string; body: string; tone: string; created_at: string; }
interface WhatsApp { id: string; message: string; created_at: string; }

function ResearchContent() {
  const searchParams = useSearchParams();
  const [companyName, setCompanyName] = useState(searchParams.get('company') || '');
  const [website, setWebsite] = useState(searchParams.get('website') || '');
  const [industry, setIndustry] = useState(searchParams.get('industry') || '');
  const [notes, setNotes] = useState('');
  const companyId = searchParams.get('company_id') || '';

  const [researching, setResearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [research, setResearch] = useState<Research | null>(null);

  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [generatingProposal, setGeneratingProposal] = useState(false);

  const [email, setEmail] = useState<Email | null>(null);
  const [generatingEmail, setGeneratingEmail] = useState(false);
  const [emailTone, setEmailTone] = useState('formal');

  const [whatsapp, setWhatsApp] = useState<WhatsApp | null>(null);
  const [generatingWhatsApp, setGeneratingWhatsApp] = useState(false);

  const [history, setHistory] = useState<Research[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  const { toast } = useToast();

  useEffect(() => { loadHistory(); }, []);

  const loadHistory = async () => {
    try {
      const res = await api.get<Research[]>('/research');
      setHistory(res.data || []);
    } catch { /* ignore */ }
  };

  const statusMessages = [
    'Researching company...',
    'Analyzing their business...',
    'Finding opportunities...',
    'Identifying pain points...',
    'Preparing your report...',
  ];

  const handleResearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setResearching(true);
    setResearch(null);
    setProposal(null);
    setEmail(null);
    setWhatsApp(null);

    // Animate status messages
    let msgIndex = 0;
    setStatusMessage(statusMessages[0]);
    const interval = setInterval(() => {
      msgIndex = (msgIndex + 1) % statusMessages.length;
      setStatusMessage(statusMessages[msgIndex]);
    }, 2500);

    try {
      const res = await api.post<Research>('/research', {
        company_name: companyName,
        website: website || undefined,
        industry: industry || undefined,
        notes: notes || undefined,
        target_company_id: companyId || undefined,
      });
      setResearch(res.data);
      toast('success', 'Research completed! ✓');
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
    if (!research) return;
    setGeneratingProposal(true);
    try {
      const res = await api.post<Proposal>('/proposal', { research_id: research.id });
      setProposal(res.data);
      toast('success', 'Proposal ready! ✓');
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "Couldn't generate proposal.");
    } finally { setGeneratingProposal(false); }
  };

  const handleGenerateEmail = async () => {
    if (!research) return;
    setGeneratingEmail(true);
    try {
      const res = await api.post<Email>('/email', { research_id: research.id, tone: emailTone });
      setEmail(res.data);
      toast('success', 'Email ready! ✓');
    } catch (err) {
      const error = err as ApiError;
      toast('error', error.message || "Couldn't generate email.");
    } finally { setGeneratingEmail(false); }
  };

  const handleGenerateWhatsApp = async () => {
    if (!research) return;
    setGeneratingWhatsApp(true);
    try {
      const res = await api.post<WhatsApp>('/whatsapp', { research_id: research.id });
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

  const loadFromHistory = (item: Research) => {
    setResearch(item);
    setCompanyName(item.company_name);
    setWebsite(item.website || '');
    setProposal(null);
    setEmail(null);
    setWhatsApp(null);
    setShowHistory(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">AI Research</h1>
            <p className="text-gray-500 mt-1">Research any company and generate sales materials</p>
          </div>
          {history.length > 0 && (
            <Button variant="secondary" onClick={() => setShowHistory(!showHistory)}>
              {showHistory ? 'Hide History' : `History (${history.length})`}
            </Button>
          )}
        </div>

        {/* History */}
        {showHistory && history.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-4 space-y-2">
            <h3 className="font-medium text-gray-900 mb-2">Previous Research</h3>
            {history.map(item => (
              <button key={item.id} onClick={() => loadFromHistory(item)} className="w-full text-left p-3 rounded-xl hover:bg-gray-50 transition-colors flex justify-between items-center">
                <span className="font-medium text-gray-900">{item.company_name}</span>
                <span className="text-xs text-gray-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </button>
            ))}
          </div>
        )}

        {/* Research Form */}
        <form onSubmit={handleResearch} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Research a Company</h2>
          <Input label="Company Name" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter any company name" required />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="Website (optional)" value={website} onChange={e => setWebsite(e.target.value)} placeholder="www.company.com" />
            <Input label="Industry (optional)" value={industry} onChange={e => setIndustry(e.target.value)} placeholder="Software, Marketing..." />
          </div>
          <Textarea label="Additional notes (optional)" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any context to help the research..." rows={2} />
          <Button type="submit" loading={researching} className="w-full">
            {researching ? statusMessage : '🔍 Research Company'}
          </Button>
        </form>

        {/* Research Results */}
        {research && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Research: {research.company_name}</h2>
              <div className="flex gap-2">
                <button onClick={() => copyToClipboard(JSON.stringify(research.output, null, 2), 'Research')} className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
                <button onClick={handleResearch} className="text-sm text-gray-500 hover:text-blue-600 px-3 py-1 rounded-lg hover:bg-blue-50">🔄 Regenerate</button>
              </div>
            </div>

            {[
              { key: 'company_overview', title: 'Company Overview' },
              { key: 'products', title: 'Products & Services' },
              { key: 'target_market', title: 'Target Market' },
              { key: 'pain_points', title: 'Pain Points' },
              { key: 'opportunities', title: 'Opportunities' },
              { key: 'suggested_sales_angle', title: 'Suggested Sales Angle' },
            ].map(section => (
              <div key={section.key}>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide mb-1.5">{section.title}</h3>
                <p className="text-gray-600 leading-relaxed">{research.output[section.key as keyof ResearchOutput]}</p>
              </div>
            ))}

            {/* Generate Actions */}
            <div className="border-t border-gray-100 pt-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Generate Sales Materials</h3>
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
                    {generatingEmail ? 'Writing email...' : '✉️ Email'}
                  </Button>
                </div>
                <Button onClick={handleGenerateWhatsApp} loading={generatingWhatsApp} variant="secondary">
                  {generatingWhatsApp ? 'Writing message...' : '💬 WhatsApp'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Proposal */}
        {proposal && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">📄 Proposal</h2>
              <button onClick={() => copyToClipboard(proposal.content, 'Proposal')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
            </div>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{proposal.content}</div>
          </div>
        )}

        {/* Email */}
        {email && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">✉️ Outreach Email</h2>
              <button onClick={() => copyToClipboard(`Subject: ${email.subject}\n\n${email.body}`, 'Email')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Subject</p>
              <p className="font-medium text-gray-900">{email.subject}</p>
            </div>
            <div className="whitespace-pre-wrap text-gray-600 leading-relaxed">{email.body}</div>
          </div>
        )}

        {/* WhatsApp */}
        {whatsapp && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">💬 WhatsApp</h2>
              <button onClick={() => copyToClipboard(whatsapp.message, 'Message')} className="text-sm text-blue-600 hover:text-blue-700 font-medium px-3 py-1 rounded-lg hover:bg-blue-50">📋 Copy</button>
            </div>
            <div className="max-w-sm">
              <div className="rounded-2xl rounded-bl-sm bg-green-100 p-4 text-sm text-gray-800 leading-relaxed">
                {whatsapp.message}
              </div>
              <p className="text-xs text-gray-400 mt-1">{whatsapp.message.length}/500 characters</p>
            </div>
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
