'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { api, ApiError } from '@/lib/api';
import Link from 'next/link';

interface Company {
  id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  notes: string | null;
  created_at: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ company_name: '', website: '', industry: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();

  useEffect(() => { loadCompanies(); }, []);

  const loadCompanies = async (q?: string) => {
    try {
      const endpoint = q ? `/companies?search=${encodeURIComponent(q)}` : '/companies';
      const res = await api.get<Company[]>(endpoint);
      setCompanies(res.data || []);
    } catch {} finally { setLoading(false); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post('/companies', form);
      toast('success', 'Company added');
      setForm({ company_name: '', website: '', industry: '', notes: '' });
      setShowAdd(false);
      loadCompanies();
    } catch (err) {
      const error = err as ApiError;
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [k, m] of Object.entries(error.errors)) flat[k] = m[0];
        setFieldErrors(flat);
      } else toast('error', error.message || 'Failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}?`)) return;
    try { await api.delete(`/companies/${id}`); toast('success', 'Removed'); loadCompanies(); }
    catch { toast('error', 'Failed'); }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)] tracking-tight">Companies</h1>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-0.5">Target companies for your pipeline</p>
          </div>
          <Button variant={showAdd ? 'ghost' : 'primary'} size="sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add'}
          </Button>
        </div>

        {/* Add Form */}
        <AnimatePresence>
          {showAdd && (
            <motion.form
              onSubmit={handleAdd}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 space-y-4 overflow-hidden"
            >
              <Input label="Company Name" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} error={fieldErrors.company_name} placeholder="Acme Corp" required />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.acme.com" />
                <Input label="Industry" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Software" />
              </div>
              <div className="flex justify-end">
                <Button type="submit" loading={saving} size="sm">Add Company</Button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Search */}
        <Input value={search} onChange={e => { setSearch(e.target.value); loadCompanies(e.target.value); }} placeholder="Search companies..." />

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-14 skeleton" />)}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-[var(--border-default)]">
            <div className="mx-auto h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center mb-3">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h5" strokeLinecap="round"/></svg>
            </div>
            <p className="text-[14px] font-medium text-[var(--text-primary)]">No companies yet</p>
            <p className="text-[12px] text-[var(--text-tertiary)] mt-1">Add your first target company</p>
            <Button className="mt-4" size="sm" onClick={() => setShowAdd(true)}>+ Add Company</Button>
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] overflow-hidden divide-y divide-[var(--border-subtle)]">
            {companies.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between px-5 py-3.5 hover:bg-white/[0.02] transition-colors"
              >
                <div>
                  <Link href={`/research?company=${encodeURIComponent(c.company_name)}&website=${encodeURIComponent(c.website || '')}&industry=${encodeURIComponent(c.industry || '')}&company_id=${c.id}`}
                    className="text-[13px] font-medium text-[var(--text-primary)] hover:text-indigo-400 transition-colors">
                    {c.company_name}
                  </Link>
                  <div className="flex gap-2 mt-0.5">
                    {c.website && <span className="text-[11px] text-[var(--text-tertiary)]">{c.website}</span>}
                    {c.industry && <span className="text-[11px] text-[var(--text-tertiary)]">· {c.industry}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link href={`/research?company=${encodeURIComponent(c.company_name)}&website=${encodeURIComponent(c.website || '')}&industry=${encodeURIComponent(c.industry || '')}&company_id=${c.id}`}>
                    <Button variant="ghost" size="sm">Research</Button>
                  </Link>
                  <button onClick={() => handleDelete(c.id, c.company_name)} className="text-[var(--text-tertiary)] hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" strokeLinecap="round"/></svg>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
