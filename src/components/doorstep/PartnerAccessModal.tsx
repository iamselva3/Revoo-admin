import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { KeyRound, RefreshCw, Smartphone, X } from 'lucide-react';
import { apiClient } from '../../api/client';

export interface PartnerAccessEmployee {
  _id: string;
  fullName: string;
  employeeCode: string;
  phone: string;
  partnerAccessEnabled?: boolean;
  partnerLastLoginAt?: string;
}

const randomPin = () => {
  const bytes = new Uint32Array(1);
  crypto.getRandomValues(bytes);
  return String(100000 + (bytes[0] % 900000));
};

/**
 * Partner app access for one employee: switch it on or off and set a new 6-digit PIN. The partner
 * signs in at genietn.in/partner with their phone number and this PIN. The PIN is stored hashed, so
 * it's shown here only right after it's set.
 */
export const PartnerAccessModal: React.FC<{ employee: PartnerAccessEmployee; onClose: () => void }> = ({ employee, onClose }) => {
  const queryClient = useQueryClient();
  // Opened to give access or to reset the PIN; switching it off is the deliberate choice
  const [enabled, setEnabled] = useState(true);
  const [pin, setPin] = useState(employee.partnerAccessEnabled ? '' : randomPin());
  const [savedPin, setSavedPin] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () =>
      (await apiClient.put(`/partner/admin/employees/${employee._id}/access`, { enabled, pin: enabled && pin ? pin : undefined })).data,
    onSuccess: () => {
      setSavedPin(enabled && pin ? pin : null);
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      if (!(enabled && pin)) onClose();
    },
  });

  const error = (save.error as any)?.response?.data?.message || (save.error ? 'Couldn’t save. Please try again.' : null);
  const pinValid = !pin || /^\d{6}$/.test(pin);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Partner app access">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-50 text-amber-600 border border-amber-200">
              <Smartphone className="w-4 h-4" />
            </span>
            <h2 className="text-base font-extrabold text-slate-900">Partner app · {employee.fullName}</h2>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {savedPin ? (
          <div className="p-6 space-y-4 text-sm text-slate-700">
            <p>
              Saved. Share these with <b>{employee.fullName}</b>:
            </p>
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2 text-xs">
              <p>
                Link: <b className="font-mono">genietn.in/partner</b>
              </p>
              <p>
                Phone number: <b className="font-mono">{employee.phone}</b>
              </p>
              <p>
                PIN: <b className="font-mono text-base tracking-[0.3em]">{savedPin}</b>
              </p>
            </div>
            <p className="text-xs text-slate-500">The PIN isn’t shown again. To change it, set a new one here.</p>
            <button type="button" onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800">
              Done
            </button>
          </div>
        ) : (
          <form
            className="p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (pinValid) save.mutate();
            }}
          >
            <p className="text-xs text-slate-600">
              Lets {employee.fullName.split(' ')[0]} check devices at the customer’s door at <b>genietn.in/partner</b> and finalise the price. Every check, and every price
              they lower, shows in Doorstep Checks.
            </p>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-3 cursor-pointer">
              <span>
                <span className="block text-xs font-bold text-slate-900">Access to the partner app</span>
                <span className="block text-[11px] text-slate-500">{enabled ? 'On: can sign in and check devices' : 'Off: signed out at once, can’t sign in'}</span>
              </span>
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="h-5 w-5 accent-emerald-600" />
            </label>

            {enabled && (
              <div>
                <label htmlFor="partner-pin" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  {employee.partnerAccessEnabled ? 'New PIN (leave empty to keep the current one)' : '6-digit PIN *'}
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      id="partner-pin"
                      inputMode="numeric"
                      autoComplete="off"
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6 digits"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono tracking-[0.25em] text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <button type="button" onClick={() => setPin(randomPin())} className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50">
                    <RefreshCw className="w-3.5 h-3.5" /> New
                  </button>
                </div>
                {!pinValid && <p className="mt-1 text-[11px] text-rose-600">The PIN must be 6 digits.</p>}
                <p className="mt-1 text-[11px] text-slate-500">
                  Signs in with <b>{employee.phone}</b>. A new PIN also unlocks the account after 5 wrong tries.
                </p>
              </div>
            )}

            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>}

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50">
                Cancel
              </button>
              <button
                type="submit"
                disabled={save.isPending || !pinValid || (enabled && !employee.partnerAccessEnabled && !pin)}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 disabled:opacity-50"
              >
                {save.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
