import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, History, Loader2, Save, Smartphone, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel } from '../../types';
import { resolveImageUrl } from '../../utils/assetUrl';
import { DEVICE_AGE_BANDS, DEVICE_AGE_MAX_PCT, ageFormValues, agePayload } from '../../utils/deviceAge';

type Values = Record<string, number | string>;

interface PctItem {
  key: string;
  label: string;
  def: number;
  /** Always 0 (e.g. "No defects") */
  fixedZero?: boolean;
}

interface PctSection {
  key: string;
  title: string;
  items: PctItem[];
}

/** Condition deductions shown in the window (% of the base price). */
const CONDITION_SECTIONS: PctSection[] = [
  {
    key: 'basicQuestions',
    title: 'Basic working condition',
    items: [
      { key: 'phoneNotWorking', label: 'Phone not working / dead (powers off)', def: 60 },
      { key: 'touchscreenNotWorking', label: 'Touchscreen not working properly', def: 15 },
      { key: 'displayNotOriginal', label: 'Display not original / replaced locally', def: 10 },
      { key: 'noWarranty', label: 'No valid manufacturer warranty', def: 5 },
    ],
  },
  {
    key: 'backPanel',
    title: 'Back panel',
    items: [
      { key: 'NO_DEFECTS', label: 'No defects', def: 0, fixedZero: true },
      { key: 'MINOR_SCRATCHES', label: 'Minor scratches (fewer than 2)', def: 3 },
      { key: 'HEAVY_SCRATCHES', label: 'Heavy scratches', def: 8 },
      { key: 'BACK_PANEL_BROKEN', label: 'Back panel broken / cracked glass', def: 15 },
    ],
  },
  {
    key: 'sidePanel',
    title: 'Center / side frame',
    items: [
      { key: 'NO_DEFECTS', label: 'No defects', def: 0, fixedZero: true },
      { key: 'MINOR_DENT_OR_SCRATCHES', label: 'Minor dent or scratches', def: 3 },
      { key: 'HEAVY_DENT', label: 'Heavy dent on frame', def: 8 },
      { key: 'BENT_OR_BROKEN', label: 'Side panel bent or broken', def: 12 },
    ],
  },
  {
    key: 'hardwareFaults',
    title: 'Hardware & sensor faults',
    items: [
      { key: 'powerButtonNotWorking', label: 'Power button not working', def: 5 },
      { key: 'volumeButtonNotWorking', label: 'Volume button not working', def: 3 },
      { key: 'chargingPortNotWorking', label: 'Charging port not working', def: 8 },
      { key: 'earSpeakerNotWorking', label: 'Ear speaker not working or low', def: 3 },
      { key: 'proximitySensorNotWorking', label: 'Proximity sensor not working', def: 3 },
      { key: 'wifiOrBluetoothNotWorking', label: 'Wi-Fi or Bluetooth not working', def: 5 },
      { key: 'vibratorNotWorking', label: 'Vibrator not working', def: 2 },
    ],
  },
];

/** Older fields that are no longer shown. They are loaded and saved unchanged so nothing is lost. */
const LEGACY_SECTIONS: PctSection[] = [
  {
    key: 'display',
    title: '',
    items: [
      { key: 'FLAWLESS', label: '', def: 0 },
      { key: 'MINOR_SCRATCHES', label: '', def: 8 },
      { key: 'DEEP_SCRATCHES', label: '', def: 15 },
      { key: 'CRACKED_GLASS', label: '', def: 30 },
      { key: 'BROKEN_OR_DEAD_PIXELS', label: '', def: 50 },
    ],
  },
  {
    key: 'body',
    title: '',
    items: [
      { key: 'FLAWLESS', label: '', def: 0 },
      { key: 'MINOR_SIGNS_OF_USE', label: '', def: 4 },
      { key: 'DENTED_OR_SCRATCHED', label: '', def: 10 },
      { key: 'BENT_OR_CRACKED_BACK', label: '', def: 20 },
    ],
  },
  {
    key: 'battery',
    title: '',
    items: [
      { key: 'EXCELLENT', label: '', def: 0 },
      { key: 'GOOD', label: '', def: 5 },
      { key: 'DEGRADED', label: '', def: 10 },
    ],
  },
  {
    key: 'functional',
    title: '',
    items: [
      { key: 'frontCameraFaulty', label: '', def: 8 },
      { key: 'backCameraFaulty', label: '', def: 12 },
      { key: 'faceIdOrFingerprintFaulty', label: '', def: 10 },
      { key: 'speakerOrMicFaulty', label: '', def: 5 },
      { key: 'chargingPortFaulty', label: '', def: 6 },
      { key: 'wirelessOrBluetoothFaulty', label: '', def: 7 },
    ],
  },
];

const ALL_SECTIONS = [...CONDITION_SECTIONS, ...LEGACY_SECTIONS];

const defaultPercentages = (): Record<string, Values> =>
  Object.fromEntries(ALL_SECTIONS.map((s) => [s.key, Object.fromEntries(s.items.map((i) => [i.key, i.def]))]));

/** Allows an empty field while typing, strips leading zeros and caps at `max`. */
const cleanNumberInput = (rawVal: string, max?: number): string | number => {
  if (rawVal === '') return '';
  let cleaned = rawVal.replace(/^0+(?=\d)/, '');
  if (max !== undefined) {
    const num = parseFloat(cleaned);
    if (!isNaN(num) && num > max) cleaned = String(max);
  }
  return cleaned;
};

const inr = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN')}`;

const DualDeductionInput: React.FC<{
  label: string;
  pct: number | string;
  basePrice: number;
  maxPct?: number;
  onChange: (v: number | string) => void;
}> = ({ label, pct, basePrice, maxPct = 100, onChange }) => {
  const bp = Number(basePrice) || 0;
  const currentAmt = bp > 0 ? Math.round((bp * (Number(pct) || 0)) / 100) : 0;

  const [isPriceFocused, setIsPriceFocused] = useState(false);
  const [priceDraft, setPriceDraft] = useState('');

  const handlePriceFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsPriceFocused(true);
    setPriceDraft(currentAmt > 0 ? String(currentAmt) : '');
    e.target.select();
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    const cleaned = raw.replace(/^0+(?=\d)/, '');
    setPriceDraft(cleaned);

    if (cleaned === '' || bp === 0) {
      onChange(0);
      return;
    }

    const numAmt = Number(cleaned);
    let calculatedPct = (numAmt / bp) * 100;
    // Round to 1 decimal place (e.g. 15.5 or 15)
    calculatedPct = Math.round(calculatedPct * 10) / 10;
    if (maxPct !== undefined) {
      calculatedPct = Math.min(maxPct, Math.max(0, calculatedPct));
    }
    onChange(calculatedPct);
  };

  const handlePriceBlur = () => {
    setIsPriceFocused(false);
    if (priceDraft === '' || isNaN(Number(priceDraft)) || bp === 0) {
      onChange(0);
    }
  };

  const displayPrice = isPriceFocused
    ? priceDraft
    : currentAmt > 0
    ? currentAmt.toLocaleString('en-IN')
    : '0';

  return (
    <div className="flex items-center gap-1.5 shrink-0">
      {/* % Input */}
      <div className="relative shrink-0">
        <input
          type="number"
          required
          min={0}
          max={maxPct}
          step="any"
          aria-label={`${label} (%)`}
          title={`${label} percentage`}
          value={pct}
          onFocus={(e) => e.target.select()}
          onChange={(e) => onChange(cleanNumberInput(e.target.value, maxPct))}
          onBlur={() => {
            if (pct === '' || isNaN(Number(pct))) onChange(0);
          }}
          className="w-[62px] py-1.5 pl-2 pr-5 border border-slate-300 rounded-lg text-right font-mono font-bold text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">
          %
        </span>
      </div>

      {/* ₹ Price Input */}
      <div className="relative shrink-0">
        <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-red-600">
          −₹
        </span>
        <input
          type="text"
          inputMode="numeric"
          aria-label={`${label} (amount)`}
          title={`${label} deduction amount (₹)`}
          value={displayPrice}
          onFocus={handlePriceFocus}
          onChange={handlePriceChange}
          onBlur={handlePriceBlur}
          className={`w-[88px] py-1.5 pl-7 pr-2 border border-slate-300 rounded-lg text-right font-mono font-bold text-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 ${
            currentAmt > 0 ? 'text-red-700' : 'text-slate-400'
          }`}
        />
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; badge?: React.ReactNode; hint?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  badge,
  hint,
  children,
}) => (
  <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <h4 className="text-sm font-bold text-slate-900">{title}</h4>
      {badge}
    </div>
    {hint && <p className="text-xs leading-relaxed text-slate-500">{hint}</p>}
    {children}
  </section>
);

const Badge: React.FC<{ tone: 'amber' | 'red' | 'slate'; children: React.ReactNode }> = ({ tone, children }) => {
  const cls =
    tone === 'red'
      ? 'text-red-700 bg-red-50 border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/30'
      : tone === 'amber'
        ? 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:border-amber-400/30'
        : 'text-slate-600 bg-slate-100 border-slate-200';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cls}`}>{children}</span>;
};

interface Props {
  model: SmartphoneModel;
  brandName?: string;
  onClose: () => void;
  onSaved: (message: string) => void;
}

/** One model's pricing settings. Saving creates a new pricing version (older versions are kept). */
export const PricingRuleModal: React.FC<Props> = ({ model, brandName, onClose, onSaved }) => {
  const queryClient = useQueryClient();
  const modelId = model._id;

  const { data: rule, isLoading } = useQuery<any>({
    queryKey: ['pricing-rule', modelId],
    queryFn: async () => (await apiClient.get(`/pricing/model/${modelId}`)).data.data,
  });
  const { data: history } = useQuery<any[]>({
    queryKey: ['pricing-history', modelId],
    queryFn: async () => (await apiClient.get(`/pricing/history/${modelId}`)).data.data,
  });

  const [basePrice, setBasePrice] = useState<number | string>(model.basePrice || 0);
  const [storageAdj, setStorageAdj] = useState<number | string>(0);
  const [pcts, setPcts] = useState<Record<string, Values>>(defaultPercentages);
  const [accessories, setAccessories] = useState<Values>({ hasOriginalCharger: 500, hasOriginalBox: 500 });
  const [age, setAge] = useState<Values>(() => ageFormValues(model.deviceAgeDeductions));
  const [reason, setReason] = useState('');
  const [showHistory, setShowHistory] = useState(false);

  // Fill the form from the saved rule — once per saved version, so a background refresh
  // (e.g. coming back to this browser tab) never wipes what the admin is typing
  const loadedVersion = useRef<string | null>(null);
  useEffect(() => {
    if (!rule) return;
    const versionKey = `${rule._id ?? 'default'}-${rule.version ?? 0}`;
    if (loadedVersion.current === versionKey) return;
    loadedVersion.current = versionKey;
    const bp = Number(rule.basePrice) || model.basePrice || 0;
    setBasePrice(bp);
    setStorageAdj(Number(rule.storagePriceAdjustment) || 0);

    const dp = rule.deductionPercentages || {};
    const d = rule.deductions || {};
    const getPct = (pctVal: unknown, absVal: unknown, def: number) => {
      if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) return Number(pctVal);
      if (absVal !== undefined && absVal !== null && bp > 0) return Number(((Number(absVal) / bp) * 100).toFixed(1));
      return def;
    };
    setPcts(
      Object.fromEntries(
        ALL_SECTIONS.map((s) => [
          s.key,
          Object.fromEntries(s.items.map((i) => [i.key, i.fixedZero ? 0 : getPct(dp[s.key]?.[i.key], d[s.key]?.[i.key], i.def)])),
        ])
      )
    );
    setAccessories({
      hasOriginalCharger: d.accessoriesBonus?.hasOriginalCharger ?? 500,
      hasOriginalBox: d.accessoriesBonus?.hasOriginalBox ?? 500,
    });
    setAge(ageFormValues(dp.deviceAge ?? model.deviceAgeDeductions));
  }, [rule, model.basePrice, model.deviceAgeDeductions]);

  // Esc closes the window
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => (await apiClient.put(`/pricing/model/${modelId}`, payload)).data,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rule', modelId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-history', modelId] });
      // Phone-age % are shown in the model list and the model editor too
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      queryClient.invalidateQueries({ queryKey: ['admin-models-list'] });
      onSaved(`Pricing for ${model.name} saved (version ${data?.data?.version ?? ''}).`);
    },
  });

  const bp = Number(basePrice) || 0;
  const rupees = (pct: number | string) => Math.round((bp * (Number(pct) || 0)) / 100);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const deductions: any = {};
    const deductionPercentages: any = {};
    for (const s of ALL_SECTIONS) {
      deductions[s.key] = {};
      deductionPercentages[s.key] = {};
      for (const i of s.items) {
        const v = i.fixedZero ? 0 : pcts[s.key]?.[i.key];
        deductions[s.key][i.key] = i.fixedZero ? 0 : rupees(v ?? 0);
        deductionPercentages[s.key][i.key] = i.fixedZero ? 0 : Number(v) || 0;
      }
    }
    deductions.accessoriesBonus = {
      hasOriginalBox: Number(accessories.hasOriginalBox) || 0,
      hasOriginalCharger: Number(accessories.hasOriginalCharger) || 0,
    };
    deductionPercentages.deviceAge = agePayload(age);

    saveMutation.mutate({
      basePrice: bp,
      storagePriceAdjustment: Number(storageAdj) || 0,
      deductions,
      deductionPercentages,
      reasonForChange: reason || 'Percentage-based valuation adjustment',
    });
  };

  const setPct = (section: string, key: string, v: number | string) =>
    setPcts((prev) => ({ ...prev, [section]: { ...prev[section], [key]: v } }));

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-4 lg:items-center lg:p-2">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Pricing for ${model.name}`}
        className="my-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl max-h-[calc(100dvh-1.5rem)] lg:h-[calc(100dvh-1rem)] lg:max-h-[900px]"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 border-b border-slate-100 bg-white px-5 py-4 sm:px-7">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-1">
              {model.imageUrl ? (
                <img src={resolveImageUrl(model.imageUrl)} alt="" className="h-full w-full object-contain" />
              ) : (
                <Smartphone className="h-5 w-5 text-slate-400" />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-lg font-bold text-slate-900">{model.name}</h3>
              <p className="text-xs text-slate-500">
                {brandName ? `${brandName} · ` : ''}Pricing version v{rule?.version || 1}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-slate-50/50 p-5 sm:p-7">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading pricing…
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                  {/* Prices */}
                  <Card title="Base price">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div>
                        <label htmlFor="pr-base" className="mb-1 block text-xs font-semibold text-slate-700">
                          Baseline buyback price (₹)
                        </label>
                        <input
                          id="pr-base"
                          type="number"
                          required
                          value={basePrice}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setBasePrice(cleanNumberInput(e.target.value))}
                          onBlur={() => (basePrice === '' || isNaN(Number(basePrice))) && setBasePrice(0)}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <span className="mt-1 block text-[11px] text-slate-400">Top price for a flawless device. All % below use it.</span>
                      </div>
                      <div>
                        <label htmlFor="pr-storage" className="mb-1 block text-xs font-semibold text-slate-700">
                          Default storage adjustment (₹)
                        </label>
                        <input
                          id="pr-storage"
                          type="number"
                          value={storageAdj}
                          onFocus={(e) => e.target.select()}
                          onChange={(e) => setStorageAdj(cleanNumberInput(e.target.value))}
                          onBlur={() => (storageAdj === '' || isNaN(Number(storageAdj))) && setStorageAdj(0)}
                          className="w-full rounded-lg border border-slate-300 bg-white p-2.5 font-mono text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </Card>

                  {/* Missing accessories */}
                  <Card
                    title="Missing original accessories"
                    badge={<Badge tone="red">Taken off if missing</Badge>}
                    hint="The price already includes the original charger and box. If the customer doesn't have one, this amount is taken off (never more than 5% of the phone's price)."
                  >
                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      {[
                        { key: 'hasOriginalCharger', label: 'No original charger' },
                        { key: 'hasOriginalBox', label: 'No box with same IMEI' },
                      ].map(({ key, label }) => (
                        <label key={key} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
                          <span className="text-xs font-medium text-slate-700">{label}</span>
                          <span className="relative">
                            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-xs font-bold text-red-600">−₹</span>
                            <input
                              type="number"
                              required
                              min={0}
                              value={accessories[key] ?? 500}
                              onFocus={(e) => e.target.select()}
                              onChange={(e) => setAccessories((p) => ({ ...p, [key]: cleanNumberInput(e.target.value) }))}
                              onBlur={() =>
                                (accessories[key] === '' || isNaN(Number(accessories[key]))) &&
                                setAccessories((p) => ({ ...p, [key]: 0 }))
                              }
                              className="w-28 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-2 text-right font-mono text-xs font-bold text-red-700 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                          </span>
                        </label>
                      ))}
                    </div>
                  </Card>
                </div>

                {/* Phone age */}
                <Card
                  title="Phone age"
                  badge={<Badge tone="red">Required when under warranty</Badge>}
                  hint="When a customer says the phone has a valid warranty, they must pick how old it is (from the bill date). This % of the phone's price is taken off. 0% means nothing is taken off."
                >
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
                    {DEVICE_AGE_BANDS.map(({ key, label }) => (
                      <div
                        key={key}
                        className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <span className="text-xs font-medium text-slate-700">{label}</span>
                        <DualDeductionInput
                          label={label}
                          pct={age[key] ?? 0}
                          basePrice={bp}
                          maxPct={DEVICE_AGE_MAX_PCT}
                          onChange={(v) => setAge((p) => ({ ...p, [key]: v }))}
                        />
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Condition deductions */}
                <Card title="Condition deductions" badge={<Badge tone="amber">% of base price</Badge>}>
                  <div className="grid grid-cols-1 gap-x-8 gap-y-5 lg:grid-cols-2">
                    {CONDITION_SECTIONS.map((section) => (
                      <div key={section.key}>
                        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">{section.title}</p>
                        <div className="divide-y divide-slate-100 dark:divide-neutral-800 rounded-xl border border-slate-200">
                          {section.items.map((item) => {
                            const value = pcts[section.key]?.[item.key] ?? 0;
                            return (
                              <div key={item.key} className="flex items-center justify-between gap-3 px-3 py-2">
                                <span className="text-xs text-slate-700">{item.label}</span>
                                {item.fixedZero ? (
                                  <span className="text-[11px] font-semibold text-slate-400">No deduction</span>
                                ) : (
                                  <DualDeductionInput
                                    label={item.label}
                                    pct={value}
                                    basePrice={bp}
                                    maxPct={100}
                                    onChange={(v) => setPct(section.key, item.key, v)}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* History */}
                {history && history.length > 0 && (
                  <section className="rounded-2xl border border-slate-200 bg-white">
                    <button
                      type="button"
                      onClick={() => setShowHistory((s) => !s)}
                      aria-expanded={showHistory}
                      className="flex w-full items-center justify-between gap-2 px-5 py-3.5 text-left"
                    >
                      <span className="flex items-center gap-2 text-sm font-bold text-slate-900">
                        <History className="h-4 w-4 text-slate-500" /> Change history ({history.length})
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
                    </button>
                    {showHistory && (
                      <div className="divide-y divide-slate-100 dark:divide-neutral-800 border-t border-slate-100 px-5 text-xs">
                        {history.map((h, i) => (
                          <div key={i} className="flex items-center justify-between gap-4 py-3">
                            <div className="min-w-0">
                              <span className="font-semibold text-slate-800">
                                {h.changedByAdminName || h.changedByAdminId?.fullName || 'Admin'}
                              </span>
                              <p className="truncate text-[11px] text-slate-500">{h.reason}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <span className="font-mono font-bold text-slate-700">Base: {inr(h.newValues?.basePrice)}</span>
                              <span className="block text-[10px] text-slate-400">
                                {new Date(h.createdAt).toLocaleString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </section>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="flex shrink-0 flex-col gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:px-7">
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for this change (e.g. market price update)"
              aria-label="Reason for this change"
              className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {saveMutation.isError && (
              <span className="text-xs font-semibold text-red-600" role="alert">
                Could not save. Please try again.
              </span>
            )}
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending || isLoading}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-revoo-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-revoo-800 disabled:opacity-60"
              >
                {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save pricing
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};
