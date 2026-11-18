import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronDown, ChevronRight, ClipboardCheck, Copy, ExternalLink, Search, TrendingDown } from 'lucide-react';
import { apiClient } from '../../api/client';
import { DoorstepCheck } from '../../types';
import { DifferencePill, DoorstepCheckItem, OutcomePill, inr } from '../../components/doorstep/DoorstepCheckDetails';

const PARTNER_APP_URL = 'https://genietn.in/partner';

const CHANGE_TABS = [
  { label: 'All checks', value: '' },
  { label: 'Price reduced', value: 'reduced' },
  { label: 'Price raised', value: 'increased' },
  { label: 'Same as quote', value: 'same' },
];

const OUTCOME_OPTIONS = [
  { label: 'Any result', value: '' },
  { label: 'Customer agreed', value: 'AGREED' },
  { label: 'Customer declined', value: 'DECLINED' },
  { label: 'Not bought', value: 'NOT_BUYABLE' },
];

/**
 * Every check pickup partners did at the customer's door (partner app). Shows at a glance where a
 * partner lowered the price, by how much, and why.
 */
export const DoorstepChecksPage: React.FC = () => {
  const [params, setParams] = useSearchParams();
  const change = params.get('change') || '';
  const outcome = params.get('outcome') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [search, setSearch] = useState(params.get('search') || '');
  const [open, setOpen] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const setParam = (key: string, value: string) => {
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== 'page') params.delete('page');
    setParams(params);
  };

  const { data, isLoading, isError } = useQuery<{
    data: DoorstepCheck[];
    meta: { total: number; page: number; totalPages: number; reducedCount: number; reducedAmount: number };
  }>({
    queryKey: ['doorstep-checks', change, outcome, page, params.get('search') || ''],
    queryFn: async () => {
      const res = await apiClient.get('/partner/admin/checks', {
        params: { change: change || undefined, outcome: outcome || undefined, page, limit: 20, search: params.get('search') || undefined },
      });
      return res.data;
    },
  });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(PARTNER_APP_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // clipboard blocked: the link is on screen to copy by hand
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ClipboardCheck className="w-6 h-6 text-amber-600" /> Doorstep Checks
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pickup partners check each device at the customer’s door and finalise the price with your Pricing Engine settings.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam('search', search.trim());
          }}
          className="relative w-full md:w-80"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search request #, partner, model..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-revoo-700"
          />
        </form>
      </div>

      {/* Partner app link */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 text-xs text-slate-600">
          <p className="font-bold text-slate-900 text-sm">Partner app link</p>
          <p className="mt-0.5">
            Share with your pickup partners. They sign in with their phone number and the PIN you set in Employee Management → Partner app.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <code className="px-3 py-2 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800">{PARTNER_APP_URL}</code>
          <button type="button" onClick={copyLink} className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50">
            <Copy className="w-3.5 h-3.5" /> {copied ? 'Copied' : 'Copy'}
          </button>
          <a href={PARTNER_APP_URL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800">
            <ExternalLink className="w-3.5 h-3.5" /> Open
          </a>
        </div>
      </div>

      {/* Totals for the current filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-xs text-slate-500">Checks</p>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">{data?.meta.total ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm">
          <p className="text-xs text-rose-700 flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" /> Price reduced at the door
          </p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1">{data?.meta.reducedCount ?? '—'}</p>
        </div>
        <div className="bg-white rounded-xl border border-rose-200 p-4 shadow-sm">
          <p className="text-xs text-rose-700">Total reduced</p>
          <p className="text-2xl font-extrabold text-rose-700 mt-1 font-mono">{data ? inr(data.meta.reducedAmount) : '—'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 border-b border-slate-200 pb-1">
        <div className="flex items-center gap-1.5 overflow-x-auto flex-1">
          {CHANGE_TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setParam('change', t.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                change === t.value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <select
          value={outcome}
          onChange={(e) => setParam('outcome', e.target.value)}
          className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-revoo-700"
          aria-label="Result"
        >
          {OUTCOME_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 w-8" />
                <th className="px-4 py-3.5">Checked on</th>
                <th className="px-4 py-3.5">Request</th>
                <th className="px-4 py-3.5">Partner</th>
                <th className="px-4 py-3.5">Device</th>
                <th className="px-4 py-3.5 text-right">Quote</th>
                <th className="px-4 py-3.5 text-right">Final</th>
                <th className="px-4 py-3.5">Change</th>
                <th className="px-4 py-3.5">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={9} className="px-6 py-4 bg-slate-50/50" />
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={9} className="px-6 py-10 text-center text-rose-600">Couldn’t load the checks. Refresh to try again.</td>
                </tr>
              ) : !data?.data.length ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                    <ClipboardCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No doorstep checks{change || outcome || params.get('search') ? ' matching your filters' : ' yet'}.
                  </td>
                </tr>
              ) : (
                data.data.map((c) => (
                  <React.Fragment key={c._id}>
                    <tr
                      className={`cursor-pointer transition-colors ${c.difference < 0 ? 'bg-rose-50/40 hover:bg-rose-50' : 'hover:bg-slate-50/80'}`}
                      onClick={() => setOpen(open === c._id ? null : c._id)}
                    >
                      <td className="px-4 py-3 text-slate-400">{open === c._id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}</td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {new Date(c.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/requests/${c.requestId}`} onClick={(e) => e.stopPropagation()} className="font-bold text-slate-900 font-mono hover:underline">
                          {c.requestNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">{c.partnerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.partnerCode}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{c.device?.modelName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{c.device?.checkedStorage || c.device?.bookedStorage}</div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">{inr(c.quotedAmount)}</td>
                      <td className={`px-4 py-3 text-right font-mono font-bold ${c.difference < 0 ? 'text-rose-700' : 'text-slate-900'}`}>{inr(c.finalAmount)}</td>
                      <td className="px-4 py-3">
                        <DifferencePill difference={c.difference} />
                      </td>
                      <td className="px-4 py-3">
                        <OutcomePill outcome={c.outcome} />
                      </td>
                    </tr>
                    {open === c._id && (
                      <tr>
                        <td colSpan={9} className="px-4 py-4 bg-slate-50">
                          <DoorstepCheckItem check={c} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
        {data && data.meta.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 text-xs">
            <span className="text-slate-500">
              Page {data.meta.page} of {data.meta.totalPages}
            </span>
            <div className="flex gap-2">
              <button type="button" disabled={page <= 1} onClick={() => setParam('page', String(page - 1))} className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold disabled:opacity-40">
                Previous
              </button>
              <button type="button" disabled={page >= data.meta.totalPages} onClick={() => setParam('page', String(page + 1))} className="px-3 py-1.5 rounded-lg border border-slate-300 font-semibold disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
