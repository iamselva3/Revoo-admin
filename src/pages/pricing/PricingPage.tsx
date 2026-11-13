import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ChevronLeft, ChevronRight, Filter, Laptop, Search, Smartphone, Tablet, Tag, Tv } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel } from '../../types';
import { resolveImageUrl } from '../../utils/assetUrl';
import { DEVICE_AGE_BANDS } from '../../utils/deviceAge';
import { ModernSelect, SelectOption } from '../../components/common/ModernSelect';
import { PricingRuleModal } from './PricingRuleModal';

type Category = 'phone' | 'laptop' | 'tablet' | 'tv';

const PAGE_SIZE = 20;

const detectCategory = (model: SmartphoneModel): Category => {
  const name = (model.name || '').toLowerCase();
  if (name.includes('tv') || name.includes('bravia') || name.includes('oled tv') || name.includes('qled') || name.includes('crystal')) return 'tv';
  if (name.includes('ipad') || name.includes('tab') || name.includes('pad')) return 'tablet';
  if (
    ['macbook', 'laptop', 'xps', 'alienware', 'thinkpad', 'zenbook', 'vivobook', 'omen', 'predator', 'inspiron', 'spectre'].some((k) =>
      name.includes(k)
    )
  )
    return 'laptop';
  return 'phone';
};

const CATEGORY_TABS: Array<{ id: 'all' | Category; label: string; icon: React.ElementType }> = [
  { id: 'all', label: 'All devices', icon: Filter },
  { id: 'phone', label: 'Phones', icon: Smartphone },
  { id: 'laptop', label: 'Laptops', icon: Laptop },
  { id: 'tablet', label: 'Tablets', icon: Tablet },
  { id: 'tv', label: 'Smart TVs', icon: Tv },
];

const CATEGORY_ICON: Record<Category, React.ElementType> = { phone: Smartphone, laptop: Laptop, tablet: Tablet, tv: Tv };

const brandOf = (m: SmartphoneModel) => (typeof m.brandId === 'object' && m.brandId ? m.brandId : null);
const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;
const upToPrice = (m: SmartphoneModel) => {
  const mods = (m.variants || []).map((v) => Number(v.priceModifier) || 0);
  return (Number(m.basePrice) || 0) + (mods.length ? Math.max(...mods) : 0);
};

/** Pricing Engine: every model in a table; click one to see and change how its price is worked out. */
export const PricingPage: React.FC = () => {
  const [category, setCategory] = useState<'all' | Category>('all');
  const [brandId, setBrandId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<SmartphoneModel | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const { data: models, isLoading } = useQuery<SmartphoneModel[]>({
    queryKey: ['admin-models-list'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/models')).data.data,
  });

  const brandOptions: SelectOption[] = useMemo(() => {
    const seen = new Map<string, string>();
    (models || []).forEach((m) => {
      const b = brandOf(m);
      if (b) seen.set(b._id, b.name);
    });
    return [
      { value: '', label: 'All brands' },
      ...[...seen.entries()].sort((a, b) => a[1].localeCompare(b[1])).map(([value, label]) => ({ value, label })),
    ];
  }, [models]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (models || []).filter((m) => {
      if (category !== 'all' && detectCategory(m) !== category) return false;
      if (brandId && brandOf(m)?._id !== brandId) return false;
      if (!q) return true;
      return `${brandOf(m)?.name || ''} ${m.name}`.toLowerCase().includes(q);
    });
  }, [models, category, brandId, search]);

  useEffect(() => setPage(1), [category, brandId, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Tag className="w-6 h-6 text-emerald-600" /> Pricing Engine
        </h1>
        <p className="text-xs text-slate-500 mt-1">Click a model to see and change how its buyback price is worked out.</p>
      </div>

      {toast && (
        <div className="flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-medium text-green-700" role="status">
          <CheckCircle2 className="h-4 w-4" /> {toast}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORY_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = category === tab.id;
              const count = tab.id === 'all' ? models?.length || 0 : models?.filter((m) => detectCategory(m) === tab.id).length || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  aria-pressed={isActive}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    isActive ? 'bg-[#0f172a] text-white shadow-xs dark:bg-amber-400 dark:text-black' : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 rounded-full ${isActive ? 'bg-slate-700 text-slate-200 dark:bg-black/15 dark:text-black' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
            <div className="w-48">
              <ModernSelect value={brandId} onChange={(v) => setBrandId(String(v))} options={brandOptions} placeholder="All brands" />
            </div>
          </div>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search model or brand (e.g. iPhone 16, Galaxy S24, Predator)"
            aria-label="Search models"
            className="w-full text-xs pl-10 pr-16 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-revoo-500 text-slate-800 placeholder-slate-400"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Model</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5 text-right">Base price</th>
                <th className="px-5 py-3.5 text-right">Best variant (up to)</th>
                <th className="px-5 py-3.5">
                  Phone age % taken off
                  <span className="block text-[10px] font-medium normal-case tracking-normal text-slate-400">
                    &lt;3 · 3–6 · 6–11 · 11+ months
                  </span>
                </th>
                <th className="px-5 py-3.5 text-right">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">
              {isLoading ? (
                [...Array(8)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-5 py-5 bg-slate-50/50" />
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-slate-400">
                    <p className="font-semibold">No models found.</p>
                    <p className="text-[11px] mt-0.5">Try another type, brand or search.</p>
                  </td>
                </tr>
              ) : (
                rows.map((m) => {
                  const cat = detectCategory(m);
                  const Icon = CATEGORY_ICON[cat];
                  const age = m.deviceAgeDeductions || {};
                  const ageSet = DEVICE_AGE_BANDS.some(({ key }) => Number(age[key]) > 0);
                  return (
                    <tr
                      key={m._id}
                      tabIndex={0}
                      onClick={() => setEditing(m)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setEditing(m);
                        }
                      }}
                      className="cursor-pointer transition-colors hover:bg-amber-50/40 focus:bg-amber-50/40 focus:outline-none dark:hover:bg-white/5 dark:focus:bg-white/5"
                    >
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                            {m.imageUrl ? (
                              <img src={resolveImageUrl(m.imageUrl)} alt="" loading="lazy" className="w-full h-full object-contain" />
                            ) : (
                              <Icon className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="block truncate font-bold text-slate-900">{m.name}</span>
                            <span className="block text-[11px] text-slate-500">{brandOf(m)?.name || '—'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          <Icon className="w-3 h-3" /> {cat}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900 whitespace-nowrap">{inr(m.basePrice)}</td>
                      <td className="px-5 py-3 text-right whitespace-nowrap">
                        <span className="font-mono font-bold text-revoo-700 dark:text-amber-400">{inr(upToPrice(m))}</span>
                        <span className="block text-[10px] text-slate-400">
                          {(m.variants || []).length} variant{(m.variants || []).length === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {ageSet ? (
                          <div className="flex items-center gap-1">
                            {DEVICE_AGE_BANDS.map(({ key, label }) => (
                              <span
                                key={key}
                                title={`${label}: ${Number(age[key]) || 0}%`}
                                className={`min-w-[38px] rounded-md px-1.5 py-0.5 text-center font-mono text-[11px] font-bold ${
                                  Number(age[key]) > 0 ? 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300' : 'bg-slate-100 text-slate-500'
                                }`}
                              >
                                {Number(age[key]) || 0}%
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="inline-block rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                            Not set
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-700 whitespace-nowrap">
                          Edit pricing <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
            <span>
              Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage <= 1}
                aria-label="Previous page"
                className="rounded-lg border border-slate-200 p-1.5 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="px-2 font-semibold text-slate-700">
                Page {currentPage} of {pageCount}
              </span>
              <button
                type="button"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= pageCount}
                aria-label="Next page"
                className="rounded-lg border border-slate-200 p-1.5 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {editing && (
        <PricingRuleModal
          model={editing}
          brandName={brandOf(editing)?.name}
          onClose={() => setEditing(null)}
          onSaved={(message) => {
            setEditing(null);
            setToast(message);
          }}
        />
      )}
    </div>
  );
};
