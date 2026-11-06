import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Save,
  History,
  Tag,
  AlertCircle,
  CheckCircle2,
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Search,
  ChevronDown,
  Check,
  Filter,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel, PricingRule } from '../../types';

export const PricingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [reasonForChange, setReasonForChange] = useState('');

  // Category and Search Filtering States
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'laptop' | 'tablet' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all models
  const { data: models } = useQuery<SmartphoneModel[]>({
    queryKey: ['admin-models-list'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/models')).data.data,
  });

  const detectCategory = (model: SmartphoneModel): 'phone' | 'laptop' | 'tablet' | 'tv' => {
    const name = (model.name || '').toLowerCase();
    if (name.includes('tv') || name.includes('bravia') || name.includes('oled tv') || name.includes('qled') || name.includes('crystal')) return 'tv';
    if (name.includes('ipad') || name.includes('tab') || name.includes('pad')) return 'tablet';
    if (name.includes('macbook') || name.includes('laptop') || name.includes('xps') || name.includes('alienware') || name.includes('thinkpad') || name.includes('zenbook') || name.includes('vivobook') || name.includes('omen') || name.includes('predator') || name.includes('inspiron')) return 'laptop';
    return 'phone';
  };

  const getCategoryIcon = (cat: 'phone' | 'laptop' | 'tablet' | 'tv') => {
    switch (cat) {
      case 'laptop':
        return <Laptop className="w-3.5 h-3.5 text-emerald-600" />;
      case 'tablet':
        return <Tablet className="w-3.5 h-3.5 text-purple-600" />;
      case 'tv':
        return <Tv className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Smartphone className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const getCategoryBadgeClass = (cat: 'phone' | 'laptop' | 'tablet' | 'tv') => {
    switch (cat) {
      case 'laptop':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'tablet':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'tv':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0]._id);
    }
  }, [models, selectedModelId]);

  // Filtered models by category & search
  const filteredModels = (models || []).filter((m) => {
    const cat = detectCategory(m);
    const matchesCategory = selectedCategory === 'all' || cat === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedModel = models?.find((m) => m._id === selectedModelId);
  const selectedModelCat = selectedModel ? detectCategory(selectedModel) : 'phone';

  // Fetch active pricing rule for selected model
  const { data: pricingRule, isLoading } = useQuery<PricingRule>({
    queryKey: ['pricing-rule', selectedModelId],
    queryFn: async () => {
      if (!selectedModelId) return null;
      const res = await apiClient.get(`/pricing/model/${selectedModelId}`);
      return res.data.data;
    },
    enabled: !!selectedModelId,
  });

  // Fetch pricing history for model
  const { data: history } = useQuery<any[]>({
    queryKey: ['pricing-history', selectedModelId],
    queryFn: async () => {
      if (!selectedModelId) return [];
      const res = await apiClient.get(`/pricing/history/${selectedModelId}`);
      return res.data.data;
    },
    enabled: !!selectedModelId,
  });

  // Local form state
  const [basePrice, setBasePrice] = useState<number>(0);
  const [storageAdj, setStorageAdj] = useState<number>(0);

  // Percentage deduction states (Percentage from base model price)
  const [displayPercentages, setDisplayPercentages] = useState<Record<string, number>>({
    FLAWLESS: 0,
    MINOR_SCRATCHES: 8,
    DEEP_SCRATCHES: 15,
    CRACKED_GLASS: 30,
    BROKEN_OR_DEAD_PIXELS: 50,
  });

  const [bodyPercentages, setBodyPercentages] = useState<Record<string, number>>({
    FLAWLESS: 0,
    MINOR_SIGNS_OF_USE: 4,
    DENTED_OR_SCRATCHED: 10,
    BENT_OR_CRACKED_BACK: 20,
  });

  const [batteryPercentages, setBatteryPercentages] = useState<Record<string, number>>({
    EXCELLENT: 0,
    GOOD: 5,
    DEGRADED: 10,
  });

  const [functionalPercentages, setFunctionalPercentages] = useState<Record<string, number>>({
    frontCameraFaulty: 8,
    backCameraFaulty: 12,
    faceIdOrFingerprintFaulty: 10,
    speakerOrMicFaulty: 5,
    chargingPortFaulty: 6,
    wirelessOrBluetoothFaulty: 7,
  });

  // Accessories Bonus stays as direct price tag (₹)
  const [accessoriesBonus, setAccessoriesBonus] = useState({
    hasOriginalBox: 500,
    hasOriginalCharger: 500,
  });

  useEffect(() => {
    if (pricingRule) {
      const bp = pricingRule.basePrice || 0;
      setBasePrice(bp);
      setStorageAdj(pricingRule.storagePriceAdjustment || 0);

      // Helper to retrieve percentage or compute from existing amount and basePrice
      const getPct = (pctVal: number | undefined, absVal: number | undefined, defaultPct: number) => {
        if (pctVal !== undefined && pctVal !== null && !isNaN(Number(pctVal))) {
          return Number(pctVal);
        }
        if (absVal !== undefined && absVal !== null && bp > 0) {
          return Number(((Number(absVal) / bp) * 100).toFixed(1));
        }
        return defaultPct;
      };

      const dp = pricingRule.deductionPercentages;
      const d = pricingRule.deductions;

      setDisplayPercentages({
        FLAWLESS: getPct(dp?.display?.FLAWLESS, d?.display?.FLAWLESS, 0),
        MINOR_SCRATCHES: getPct(dp?.display?.MINOR_SCRATCHES, d?.display?.MINOR_SCRATCHES, 8),
        DEEP_SCRATCHES: getPct(dp?.display?.DEEP_SCRATCHES, d?.display?.DEEP_SCRATCHES, 15),
        CRACKED_GLASS: getPct(dp?.display?.CRACKED_GLASS, d?.display?.CRACKED_GLASS, 30),
        BROKEN_OR_DEAD_PIXELS: getPct(dp?.display?.BROKEN_OR_DEAD_PIXELS, d?.display?.BROKEN_OR_DEAD_PIXELS, 50),
      });

      setBodyPercentages({
        FLAWLESS: getPct(dp?.body?.FLAWLESS, d?.body?.FLAWLESS, 0),
        MINOR_SIGNS_OF_USE: getPct(dp?.body?.MINOR_SIGNS_OF_USE, d?.body?.MINOR_SIGNS_OF_USE, 4),
        DENTED_OR_SCRATCHED: getPct(dp?.body?.DENTED_OR_SCRATCHED, d?.body?.DENTED_OR_SCRATCHED, 10),
        BENT_OR_CRACKED_BACK: getPct(dp?.body?.BENT_OR_CRACKED_BACK, d?.body?.BENT_OR_CRACKED_BACK, 20),
      });

      setBatteryPercentages({
        EXCELLENT: getPct(dp?.battery?.EXCELLENT, d?.battery?.EXCELLENT, 0),
        GOOD: getPct(dp?.battery?.GOOD, d?.battery?.GOOD, 5),
        DEGRADED: getPct(dp?.battery?.DEGRADED, d?.battery?.DEGRADED, 10),
      });

      setFunctionalPercentages({
        frontCameraFaulty: getPct(dp?.functional?.frontCameraFaulty, d?.functional?.frontCameraFaulty, 8),
        backCameraFaulty: getPct(dp?.functional?.backCameraFaulty, d?.functional?.backCameraFaulty, 12),
        faceIdOrFingerprintFaulty: getPct(dp?.functional?.faceIdOrFingerprintFaulty, d?.functional?.faceIdOrFingerprintFaulty, 10),
        speakerOrMicFaulty: getPct(dp?.functional?.speakerOrMicFaulty, d?.functional?.speakerOrMicFaulty, 5),
        chargingPortFaulty: getPct(dp?.functional?.chargingPortFaulty, d?.functional?.chargingPortFaulty, 6),
        wirelessOrBluetoothFaulty: getPct(dp?.functional?.wirelessOrBluetoothFaulty, d?.functional?.wirelessOrBluetoothFaulty, 7),
      });

      if (pricingRule.deductions?.accessoriesBonus) {
        setAccessoriesBonus(pricingRule.deductions.accessoriesBonus);
      }
    } else if (selectedModel) {
      setBasePrice(selectedModel.basePrice || 45000);
      setStorageAdj(0);
    }
  }, [pricingRule, selectedModel]);

  const updateMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await apiClient.put(`/pricing/model/${selectedModelId}`, payload)).data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rule', selectedModelId] });
      queryClient.invalidateQueries({ queryKey: ['pricing-history', selectedModelId] });
      setSuccessMsg(`Pricing successfully updated to version ${data.data.version}.`);
      setReasonForChange('');
      setTimeout(() => setSuccessMsg(null), 4000);
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    // Calculate exact rupee deduction from base price and percentage
    const calcRupee = (pct: number) => Math.round((basePrice * (Number(pct) || 0)) / 100);

    const calculatedDeductions = {
      display: {
        FLAWLESS: calcRupee(displayPercentages.FLAWLESS),
        MINOR_SCRATCHES: calcRupee(displayPercentages.MINOR_SCRATCHES),
        DEEP_SCRATCHES: calcRupee(displayPercentages.DEEP_SCRATCHES),
        CRACKED_GLASS: calcRupee(displayPercentages.CRACKED_GLASS),
        BROKEN_OR_DEAD_PIXELS: calcRupee(displayPercentages.BROKEN_OR_DEAD_PIXELS),
      },
      body: {
        FLAWLESS: calcRupee(bodyPercentages.FLAWLESS),
        MINOR_SIGNS_OF_USE: calcRupee(bodyPercentages.MINOR_SIGNS_OF_USE),
        DENTED_OR_SCRATCHED: calcRupee(bodyPercentages.DENTED_OR_SCRATCHED),
        BENT_OR_CRACKED_BACK: calcRupee(bodyPercentages.BENT_OR_CRACKED_BACK),
      },
      battery: {
        EXCELLENT: calcRupee(batteryPercentages.EXCELLENT),
        GOOD: calcRupee(batteryPercentages.GOOD),
        DEGRADED: calcRupee(batteryPercentages.DEGRADED),
      },
      functional: {
        frontCameraFaulty: calcRupee(functionalPercentages.frontCameraFaulty),
        backCameraFaulty: calcRupee(functionalPercentages.backCameraFaulty),
        faceIdOrFingerprintFaulty: calcRupee(functionalPercentages.faceIdOrFingerprintFaulty),
        speakerOrMicFaulty: calcRupee(functionalPercentages.speakerOrMicFaulty),
        chargingPortFaulty: calcRupee(functionalPercentages.chargingPortFaulty),
        wirelessOrBluetoothFaulty: calcRupee(functionalPercentages.wirelessOrBluetoothFaulty),
      },
      accessoriesBonus,
    };

    updateMutation.mutate({
      basePrice,
      storagePriceAdjustment: storageAdj,
      deductions: calculatedDeductions,
      deductionPercentages: {
        display: displayPercentages,
        body: bodyPercentages,
        battery: batteryPercentages,
        functional: functionalPercentages,
      },
      reasonForChange: reasonForChange || 'Percentage-based valuation adjustment',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header with Title and Model Combobox */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Tag className="w-6 h-6 text-emerald-600" /> Valuation & Pricing Engine
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure authoritative model pricing, condition penalties, and view historical revisions.
          </p>
        </div>

        {/* Custom Aesthetic Model Combobox Selector */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Model:</label>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between gap-3 min-w-[280px] sm:min-w-[340px] px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 hover:border-slate-400 rounded-xl transition text-left shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${getCategoryBadgeClass(selectedModelCat)}`}>
                  {getCategoryIcon(selectedModelCat)}
                </span>
                <div className="min-w-0">
                  <span className="block text-xs font-bold text-slate-900 truncate">
                    {selectedModel ? selectedModel.name : 'Select a device model...'}
                  </span>
                  <span className="block text-[10px] text-slate-500 font-mono">
                    Base: ₹{selectedModel?.basePrice?.toLocaleString() || basePrice.toLocaleString()}
                  </span>
                </div>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>
          </div>

          {/* Aesthetic Dropdown Popover */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-[340px] sm:w-[400px] bg-white rounded-2xl border border-slate-200 shadow-2xl z-50 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-150">
              {/* Category Filter Pills inside Popover */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All', icon: null },
                  { id: 'phone', label: 'Phones', icon: Smartphone },
                  { id: 'laptop', label: 'Laptops', icon: Laptop },
                  { id: 'tablet', label: 'Tablets', icon: Tablet },
                  { id: 'tv', label: 'Smart TVs', icon: Tv },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id as any)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {Icon && <Icon className="w-3 h-3" />}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search model (e.g. Alienware, XPS, iPhone)..."
                  className="w-full text-xs pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800"
                  autoFocus
                />
              </div>

              {/* Scrollable Model Options */}
              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {filteredModels.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No matching devices found in this category.
                  </div>
                ) : (
                  filteredModels.map((m) => {
                    const isSelected = m._id === selectedModelId;
                    const cat = detectCategory(m);
                    return (
                      <button
                        key={m._id}
                        type="button"
                        onClick={() => {
                          setSelectedModelId(m._id);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                          isSelected
                            ? 'bg-emerald-50/80 border border-emerald-200'
                            : 'hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`p-1.5 rounded-lg border flex items-center justify-center shrink-0 ${getCategoryBadgeClass(cat)}`}>
                            {getCategoryIcon(cat)}
                          </span>
                          <div className="min-w-0">
                            <span className={`block text-xs truncate ${isSelected ? 'font-bold text-emerald-950' : 'font-semibold text-slate-800'}`}>
                              {m.name}
                            </span>
                            <span className="block text-[10px] text-slate-400 font-mono">
                              Base: ₹{m.basePrice?.toLocaleString()} • {m.releaseYear}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-2" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-xs text-green-700">
          <CheckCircle2 className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Base Pricing Block */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Tag className="w-4 h-4 text-revoo-700" /> Base Model Valuation
            </h2>
            <span className="text-xs font-semibold text-slate-500 font-mono">
              Current Version: v{pricingRule?.version || 1}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Baseline Model Buyback Price (₹)
              </label>
              <input
                type="number"
                value={basePrice}
                onChange={(e) => setBasePrice(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Top starting price for a device in 100% flawless cosmetic and functional condition.
              </span>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Default Storage Adjustment (₹)
              </label>
              <input
                type="number"
                value={storageAdj}
                onChange={(e) => setStorageAdj(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-300 rounded-lg text-sm font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Damage Deduction Matrices */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Display Damage */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Display Damage Deductions
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                % of Base • Auto ₹
              </span>
            </div>
            {Object.entries(displayPercentages).map(([key, pct]) => {
              const calcRupees = Math.round((basePrice * (Number(pct) || 0)) / 100);
              return (
                <div key={key} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">{key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    {/* Editable Percentage Input */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={pct}
                        onChange={(e) =>
                          setDisplayPercentages({
                            ...displayPercentages,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 p-1.5 pr-4 border border-slate-300 rounded text-right font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <span className="absolute right-1 text-slate-400 font-bold text-[10px] pointer-events-none">%</span>
                    </div>

                    {/* Grey Non-Editable Calculated Price */}
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`₹ ${calcRupees.toLocaleString('en-IN')}`}
                        className="w-24 p-1.5 bg-slate-100 border border-slate-200 rounded text-right font-mono font-bold text-xs text-slate-500 cursor-not-allowed select-none"
                        title="Auto-calculated from base price"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Body Damage */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Body / Frame Deductions
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                % of Base • Auto ₹
              </span>
            </div>
            {Object.entries(bodyPercentages).map(([key, pct]) => {
              const calcRupees = Math.round((basePrice * (Number(pct) || 0)) / 100);
              return (
                <div key={key} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">{key.replace(/_/g, ' ')}</span>
                  <div className="flex items-center gap-2">
                    {/* Editable Percentage Input */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={pct}
                        onChange={(e) =>
                          setBodyPercentages({
                            ...bodyPercentages,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 p-1.5 pr-4 border border-slate-300 rounded text-right font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <span className="absolute right-1 text-slate-400 font-bold text-[10px] pointer-events-none">%</span>
                    </div>

                    {/* Grey Non-Editable Calculated Price */}
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`₹ ${calcRupees.toLocaleString('en-IN')}`}
                        className="w-24 p-1.5 bg-slate-100 border border-slate-200 rounded text-right font-mono font-bold text-xs text-slate-500 cursor-not-allowed select-none"
                        title="Auto-calculated from base price"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Battery Health */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Battery Health Deductions
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                % of Base • Auto ₹
              </span>
            </div>
            {Object.entries(batteryPercentages).map(([key, pct]) => {
              const calcRupees = Math.round((basePrice * (Number(pct) || 0)) / 100);
              return (
                <div key={key} className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-600 font-medium">{key}</span>
                  <div className="flex items-center gap-2">
                    {/* Editable Percentage Input */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={pct}
                        onChange={(e) =>
                          setBatteryPercentages({
                            ...batteryPercentages,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-16 p-1.5 pr-4 border border-slate-300 rounded text-right font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <span className="absolute right-1 text-slate-400 font-bold text-[10px] pointer-events-none">%</span>
                    </div>

                    {/* Grey Non-Editable Calculated Price */}
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`₹ ${calcRupees.toLocaleString('en-IN')}`}
                        className="w-24 p-1.5 bg-slate-100 border border-slate-200 rounded text-right font-mono font-bold text-xs text-slate-500 cursor-not-allowed select-none"
                        title="Auto-calculated from base price"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Accessories Bonus */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Original Accessories Bonus (+₹)
              </h3>
              <span className="text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-full border border-teal-200">
                Fixed Cash Bonus (+₹)
              </span>
            </div>
            {Object.entries(accessoriesBonus).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs py-1">
                <span className="text-slate-600 font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-emerald-600 font-bold text-xs pointer-events-none">+₹</span>
                  <input
                    type="number"
                    value={val}
                    onChange={(e) =>
                      setAccessoriesBonus({ ...accessoriesBonus, [key]: Number(e.target.value) || 0 })
                    }
                    className="w-28 pl-7 pr-2 py-1.5 border border-slate-300 rounded text-right font-mono font-bold text-xs text-emerald-700 bg-white focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Functional Faults Deductions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-sm font-bold text-slate-900">
              Hardware & Component Fault Deductions
            </h3>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              % of Base • Auto ₹
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {Object.entries(functionalPercentages).map(([key, pct]) => {
              const calcRupees = Math.round((basePrice * (Number(pct) || 0)) / 100);
              return (
                <div key={key} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-700 font-medium text-xs pr-2">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Editable Percentage Input */}
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        value={pct}
                        onChange={(e) =>
                          setFunctionalPercentages({
                            ...functionalPercentages,
                            [key]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-14 p-1.5 pr-3.5 border border-slate-300 rounded text-right font-mono font-bold text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none bg-white"
                      />
                      <span className="absolute right-1 text-slate-400 font-bold text-[9px] pointer-events-none">%</span>
                    </div>

                    {/* Grey Non-Editable Calculated Price */}
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={`₹ ${calcRupees.toLocaleString('en-IN')}`}
                        className="w-20 p-1.5 bg-slate-100 border border-slate-200 rounded text-right font-mono font-bold text-[11px] text-slate-500 cursor-not-allowed select-none"
                        title="Auto-calculated from base price"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Change Rationale & Submit */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Audit Reason for Pricing Update
            </label>
            <input
              type="text"
              required
              value={reasonForChange}
              onChange={(e) => setReasonForChange(e.target.value)}
              placeholder="e.g. Q4 market benchmark adjustment, festive promotion"
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400">
              * Updating pricing creates an immutable new rule version. Existing requests retain their snapshot version.
            </span>
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-revoo-700 hover:bg-revoo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition disabled:opacity-60"
            >
              <Save className="w-4 h-4" /> Save New Pricing Version
            </button>
          </div>
        </div>
      </form>

      {/* Pricing Revision History Audit Trail */}
      {history && history.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <History className="w-4 h-4 text-slate-500" /> Pricing Revision Audit Trail
          </h3>
          <div className="divide-y divide-slate-100 text-xs">
            {history.map((h, i) => (
              <div key={i} className="py-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-800">
                    Changed by {h.changedByAdminName || h.changedByAdminId?.fullName || 'Admin'}
                  </span>
                  <p className="text-[11px] text-slate-500">Reason: {h.reason}</p>
                </div>
                <div className="text-right">
                  <span className="font-mono font-bold text-slate-700">
                    Base: ₹{h.newValues?.basePrice?.toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    {new Date(h.createdAt).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
