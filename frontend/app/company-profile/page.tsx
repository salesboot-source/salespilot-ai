'use client';

import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/lib/auth';
import { api, ApiError } from '@/lib/api';

interface ProductService {
  name: string;
  description: string;
}

interface CompanyProfileData {
  id: string;
  company_name: string;
  industry: string;
  description: string;
  products_services: ProductService[];
  target_market: string | null;
  value_propositions: string | null;
  updated_at: string;
}

export default function CompanyProfilePage() {
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('');
  const [description, setDescription] = useState('');
  const [products, setProducts] = useState<ProductService[]>([{ name: '', description: '' }]);
  const [targetMarket, setTargetMarket] = useState('');
  const [valuePropositions, setValuePropositions] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get<CompanyProfileData | null>('/company-profile');
      if (response.data) {
        setCompanyName(response.data.company_name);
        setIndustry(response.data.industry);
        setDescription(response.data.description);
        setProducts(
          response.data.products_services.length > 0
            ? response.data.products_services
            : [{ name: '', description: '' }]
        );
        setTargetMarket(response.data.target_market || '');
        setValuePropositions(response.data.value_propositions || '');
      }
    } catch {
      // No profile yet, that's fine
    } finally {
      setPageLoading(false);
    }
  };

  const addProduct = () => {
    setProducts([...products, { name: '', description: '' }]);
  };

  const removeProduct = (index: number) => {
    if (products.length <= 1) return;
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index: number, field: keyof ProductService, value: string) => {
    const updated = [...products];
    updated[index] = { ...updated[index], [field]: value };
    setProducts(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setLoading(true);

    try {
      await api.put('/company-profile', {
        company_name: companyName,
        industry,
        description,
        products_services: products.filter((p) => p.name.trim() !== ''),
        target_market: targetMarket || null,
        value_propositions: valuePropositions || null,
      });
      toast('success', 'Company profile saved successfully!');
      await refreshUser();
    } catch (err) {
      const apiError = err as ApiError;
      if (apiError.errors) {
        const flat: Record<string, string> = {};
        for (const [key, messages] of Object.entries(apiError.errors)) {
          flat[key] = messages[0];
        }
        setFieldErrors(flat);
      } else {
        toast('error', apiError.message || 'Could not save profile. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="h-8 w-48 bg-[var(--bg-surface)] rounded-lg animate-pulse" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Your Company Profile</h1>
          <p className="mt-1 text-[var(--text-tertiary)] text-[13px]">
            The more we know about your business, the better AI can personalize proposals and emails for your prospects.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Business Details</h2>

            <Input
              label="Company Name"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              error={fieldErrors.company_name}
              placeholder="Acme Corp"
              required
            />

            <Input
              label="Industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              error={fieldErrors.industry}
              placeholder="Software Development, Marketing, Consulting..."
              required
            />

            <Textarea
              label="Company Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              error={fieldErrors.description}
              placeholder="What does your company do? Who do you serve?"
              rows={3}
              required
            />
          </div>

          {/* Products & Services */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">Products & Services</h2>
              <button
                type="button"
                onClick={addProduct}
                className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
              >
                + Add another
              </button>
            </div>

            {fieldErrors.products_services && (
              <p className="text-sm text-red-600">{fieldErrors.products_services}</p>
            )}

            {products.map((product, index) => (
              <div key={index} className="space-y-3 p-4 bg-[var(--bg-tertiary)] rounded-xl relative">
                {products.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeProduct(index)}
                    className="absolute top-3 right-3 text-[var(--text-tertiary)] hover:text-red-400 text-lg"
                  >
                    ×
                  </button>
                )}
                <Input
                  label={`Product/Service ${index + 1} Name`}
                  value={product.name}
                  onChange={(e) => updateProduct(index, 'name', e.target.value)}
                  error={fieldErrors[`products_services.${index}.name`]}
                  placeholder="Web Development, AI Consulting..."
                />
                <Textarea
                  label="Description"
                  value={product.description}
                  onChange={(e) => updateProduct(index, 'description', e.target.value)}
                  error={fieldErrors[`products_services.${index}.description`]}
                  placeholder="Brief description of what this product/service offers"
                  rows={2}
                />
              </div>
            ))}
          </div>

          {/* Additional Info */}
          <div className="rounded-2xl border border-[var(--border-default)] bg-[var(--bg-secondary)] p-6 space-y-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Additional Context</h2>

            <Textarea
              label="Target Market"
              value={targetMarket}
              onChange={(e) => setTargetMarket(e.target.value)}
              error={fieldErrors.target_market}
              placeholder="Who are your ideal clients? (e.g., B2B SaaS companies, 50-500 employees)"
              rows={2}
            />

            <Textarea
              label="Key Value Propositions"
              value={valuePropositions}
              onChange={(e) => setValuePropositions(e.target.value)}
              error={fieldErrors.value_propositions}
              placeholder="What makes you different? Why should clients choose you?"
              rows={2}
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <Button type="submit" loading={loading}>
              Save Profile
            </Button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
