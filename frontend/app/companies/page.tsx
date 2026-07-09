'use client';

import { useState, useEffect } from 'react';
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

  const loadCompanies = async (searchQuery?: string) => {
    try {
      const endpoint = searchQuery ? `/companies?search=${encodeURIComponent(searchQuery)}` : '/companies';
      const res = await api.get<Company[]>(endpoint);
      setCompanies(res.data || []);
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    loadCompanies(value);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFieldErrors({});
    try {
      await api.post('/companies', form);
      toast('success', 'Company added!');
      setForm({ company_name: '', website: '', industry: '', notes: '' });
      setShowAdd(false);
      loadCompanies();
    } catch (err) {
      const error = err as ApiError;
      if (error.errors) {
        const flat: Record<string, string> = {};
        for (const [key, msgs] of Object.entries(error.errors)) flat[key] = msgs[0];
        setFieldErrors(flat);
      } else {
        toast('error', error.message || 'Could not add company.');
      }
    } finally { setSaving(false); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await api.delete(`/companies/${id}`);
      toast('success', 'Company removed.');
      loadCompanies();
    } catch { toast('error', 'Could not remove company.'); }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Target Companies</h1>
            <p className="text-gray-500 mt-1">Companies you want to sell to</p>
          </div>
          <Button onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Cancel' : '+ Add Company'}
          </Button>
        </div>

        {/* Add Form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="rounded-2xl border border-gray-200 bg-white p-6 space-y-4">
            <Input label="Company Name" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} error={fieldErrors.company_name} placeholder="Acme Corp" required />
            <Input label="Website (optional)" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="www.acme.com" />
            <Input label="Industry (optional)" value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="Software, Marketing..." />
            <div className="flex justify-end">
              <Button type="submit" loading={saving}>Add Company</Button>
            </div>
          </form>
        )}

        {/* Search */}
        <Input label="" value={search} onChange={e => handleSearch(e.target.value)} placeholder="Search companies..." />

        {/* List */}
        {loading ? (
          <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-gray-200">
            <p className="text-lg font-medium text-gray-900">No companies yet</p>
            <p className="text-gray-500 mt-1">Add your first target company to start researching</p>
            <Button className="mt-4" onClick={() => setShowAdd(true)}>+ Add Your First Company</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {companies.map(company => (
              <div key={company.id} className="rounded-xl border border-gray-200 bg-white p-4 flex items-center justify-between hover:border-blue-200 transition-colors">
                <div>
                  <Link href={`/research?company=${encodeURIComponent(company.company_name)}&website=${encodeURIComponent(company.website || '')}&industry=${encodeURIComponent(company.industry || '')}&company_id=${company.id}`} className="font-medium text-gray-900 hover:text-blue-600">
                    {company.company_name}
                  </Link>
                  <div className="flex gap-3 mt-1 text-sm text-gray-500">
                    {company.website && <span>{company.website}</span>}
                    {company.industry && <span>• {company.industry}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link href={`/research?company=${encodeURIComponent(company.company_name)}&website=${encodeURIComponent(company.website || '')}&industry=${encodeURIComponent(company.industry || '')}&company_id=${company.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg hover:bg-blue-50">
                    Research
                  </Link>
                  <button onClick={() => handleDelete(company.id, company.company_name)} className="text-sm text-gray-400 hover:text-red-500 px-2 py-1">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
