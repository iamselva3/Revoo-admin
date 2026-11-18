import React from 'react';
import { Ban, CheckCircle2, ClipboardCheck, TrendingDown, TrendingUp, XCircle } from 'lucide-react';
import { DoorstepCheck, DoorstepOutcome } from '../../types';

export const inr = (n: number | undefined | null) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** "−₹1,200" / "+₹500" / "No change" */
export const signedInr = (difference: number) =>
  difference === 0 ? 'No change' : `${difference < 0 ? '−' : '+'}${inr(Math.abs(difference))}`;

const OUTCOMES: Record<DoorstepOutcome, { label: string; icon: React.ElementType; cls: string }> = {
  AGREED: { label: 'Customer agreed', icon: CheckCircle2, cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  DECLINED: { label: 'Customer declined', icon: XCircle, cls: 'bg-slate-100 text-slate-700 border-slate-300' },
  NOT_BUYABLE: { label: 'Not bought', icon: Ban, cls: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const OutcomePill: React.FC<{ outcome: DoorstepOutcome }> = ({ outcome }) => {
  const o = OUTCOMES[outcome] ?? OUTCOMES.AGREED;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border ${o.cls}`}>
      <o.icon className="w-3 h-3" /> {o.label}
    </span>
  );
};

/** Red for a lower price, green for a higher one, grey when the partner kept the quote. */
export const DifferencePill: React.FC<{ difference: number }> = ({ difference }) =>
  difference < 0 ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border bg-rose-50 text-rose-700 border-rose-200">
      <TrendingDown className="w-3 h-3" /> Reduced {inr(-difference)}
    </span>
  ) : difference > 0 ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
      <TrendingUp className="w-3 h-3" /> Raised {inr(difference)}
    </span>
  ) : (
    <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border bg-slate-50 text-slate-600 border-slate-200">Same as quote</span>
  );

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' });

/** One check: who, when, the price change and exactly which answers changed it. */
export const DoorstepCheckItem: React.FC<{ check: DoorstepCheck; latest?: boolean }> = ({ check, latest }) => {
  const storageChanged = check.device?.checkedStorage && check.device?.bookedStorage && check.device.checkedStorage !== check.device.bookedStorage;
  return (
    <div className={`rounded-xl border p-4 ${check.difference < 0 ? 'border-rose-200 bg-rose-50/30' : 'border-slate-200 bg-white'}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-bold text-slate-900">
            {check.partnerName} <span className="font-mono text-[11px] font-semibold text-slate-500">{check.partnerCode}</span>
            {latest && <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">Latest</span>}
          </p>
          <p className="text-[11px] text-slate-500">{when(check.createdAt)}</p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <DifferencePill difference={check.difference} />
          <OutcomePill outcome={check.outcome} />
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div>
          <p className="text-slate-500">Customer’s quote</p>
          <p className="font-bold text-slate-900 font-mono">{inr(check.quotedAmount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Final price</p>
          <p className={`font-bold font-mono ${check.difference < 0 ? 'text-rose-700' : 'text-slate-900'}`}>{inr(check.finalAmount)}</p>
        </div>
        <div>
          <p className="text-slate-500">Worst · best</p>
          <p className="font-semibold text-slate-700 font-mono">
            {inr(check.worstAmount)} · {inr(check.bestAmount)}
          </p>
        </div>
        <div>
          <p className="text-slate-500">Storage</p>
          <p className={`font-semibold ${storageChanged ? 'text-rose-700' : 'text-slate-700'}`}>
            {storageChanged ? `${check.device.bookedStorage} → ${check.device.checkedStorage}` : check.device?.checkedStorage || check.device?.bookedStorage || '—'}
          </p>
        </div>
      </div>

      {check.changes?.length > 0 && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-white">
          <p className="px-3 pt-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">What the partner changed</p>
          <table className="w-full text-xs">
            <tbody className="divide-y divide-slate-100">
              {check.changes.map((c) => (
                <tr key={c.component}>
                  <td className="px-3 py-2 text-slate-700">{c.component}</td>
                  <td className={`px-3 py-2 text-right font-bold font-mono whitespace-nowrap ${c.difference < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{signedInr(c.difference)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {check.requotedAmount !== check.quotedAmount && (
        <p className="mt-2 text-[11px] text-slate-500">
          Prices changed since booking: the customer’s own answers are worth {inr(check.requotedAmount)} today. The partner’s changes are applied to the quote they were given.
        </p>
      )}

      {(check.notBuyableReason || check.notes || check.imei) && (
        <div className="mt-3 space-y-1 text-xs text-slate-700">
          {check.notBuyableReason && (
            <p>
              <span className="font-semibold">Reason not bought:</span> {check.notBuyableReason}
            </p>
          )}
          {check.notes && (
            <p>
              <span className="font-semibold">Partner’s notes:</span> {check.notes}
            </p>
          )}
          {check.imei && (
            <p>
              <span className="font-semibold">IMEI / serial:</span> <span className="font-mono">{check.imei}</span>
            </p>
          )}
        </div>
      )}

      {check.photoUrls && check.photoUrls.length > 0 && (
        <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2">
          {check.photoUrls.map((url, i) => (
            <a key={url} href={url} target="_blank" rel="noreferrer" className="block aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              <img src={url} alt={`Check photo ${i + 1}`} className="h-full w-full object-cover" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};

/** Card on the request page: every doorstep check, newest first. */
export const DoorstepChecksCard: React.FC<{ checks: DoorstepCheck[] }> = ({ checks }) => {
  if (!checks.length) return null;
  const reduced = checks[0].difference < 0;
  return (
    <div className={`bg-white rounded-xl border p-6 shadow-sm ${reduced ? 'border-rose-200' : 'border-slate-200'}`}>
      <div className="flex items-center gap-2 mb-1">
        <ClipboardCheck className={`w-5 h-5 ${reduced ? 'text-rose-600' : 'text-amber-600'}`} />
        <h3 className="text-base font-bold text-slate-900">Doorstep check by pickup partner</h3>
      </div>
      <p className="text-xs text-slate-500 mb-4">
        {reduced
          ? `The partner lowered the price from ${inr(checks[0].quotedAmount)} to ${inr(checks[0].finalAmount)}. Each change below is priced with your Pricing Engine settings.`
          : 'Checked at the customer’s door in the partner app. Each change is priced with your Pricing Engine settings.'}
      </p>
      <div className="space-y-3">
        {checks.map((c, i) => (
          <DoorstepCheckItem key={c._id} check={c} latest={i === 0 && checks.length > 1} />
        ))}
      </div>
    </div>
  );
};
