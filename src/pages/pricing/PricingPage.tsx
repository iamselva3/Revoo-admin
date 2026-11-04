import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Save, History, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel, PricingRule } from '../../types';

export const PricingPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [reasonForChange, setReasonForChange] = useState('');

  // Fetch all models
  const { data: models } = useQuery<SmartphoneModel[]>({
    queryKey: ['admin-models-list'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/models')).data.data,
  });

  useEffect(() => {
    if (models && models.length > 0 && !selectedModelId) {
      setSelectedModelId(models[0]._id);
    }
  }, [models, selectedModelId]);

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
  const [displayDeductions, setDisplayDeductions] = useState({
    FLAWLESS: 0,
    MINOR_SCRATCHES: 1000,
    DEEP_SCRATCHES: 2500,
    CRACKED_GLASS: 4500,
    BROKEN_OR_DEAD_PIXELS: 7000,
  });
  const [bodyDeductions, setBodyDeductions] = useState({
    FLAWLESS: 0,
    MINOR_SIGNS_OF_USE: 500,
    DENTED_OR_SCRATCHED: 1500,
    BENT_OR_CRACKED_BACK: 3500,
  });
  const [batteryDeductions, setBatteryDeductions] = useState({
    EXCELLENT: 0,
    GOOD: 800,
    DEGRADED: 2000,
  });
  const [functionalDeductions, setFunctionalDeductions] = useState({
    frontCameraFaulty: 1500,
    backCameraFaulty: 2500,
    faceIdOrFingerprintFaulty: 2000,
    speakerOrMicFaulty: 1000,
    chargingPortFaulty: 1200,
    wirelessOrBluetoothFaulty: 1500,
  });
  const [accessoriesBonus, setAccessoriesBonus] = useState({
    hasOriginalBox: 500,
    hasOriginalCharger: 500,
  });

  useEffect(() => {
    if (pricingRule) {
      setBasePrice(pricingRule.basePrice);
      setStorageAdj(pricingRule.storagePriceAdjustment || 0);
      if (pricingRule.deductions?.display) setDisplayDeductions(pricingRule.deductions.display);
      if (pricingRule.deductions?.body) setBodyDeductions(pricingRule.deductions.body);
      if (pricingRule.deductions?.battery) setBatteryDeductions(pricingRule.deductions.battery);
      if (pricingRule.deductions?.functional) setFunctionalDeductions(pricingRule.deductions.functional);
      if (pricingRule.deductions?.accessoriesBonus) setAccessoriesBonus(pricingRule.deductions.accessoriesBonus);
    }
  }, [pricingRule]);

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
    updateMutation.mutate({
      basePrice,
      storagePriceAdjustment: storageAdj,
      deductions: {
        display: displayDeductions,
        body: bodyDeductions,
        battery: batteryDeductions,
        functional: functionalDeductions,
        accessoriesBonus,
      },
      reasonForChange: reasonForChange || 'Scheduled market valuation adjustment',
    });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Valuation & Pricing Engine</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure authoritative model pricing, condition penalties, and view historical revisions.
          </p>
        </div>

        {/* Model Selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500 uppercase">Model:</label>
          <select
            value={selectedModelId}
            onChange={(e) => setSelectedModelId(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800"
          >
            {models?.map((m: SmartphoneModel) => (
              <option key={m._id} value={m._id}>
                {m.name}
              </option>
            ))}
          </select>
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
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Display Damage Deductions (₹)
            </h3>
            {Object.entries(displayDeductions).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{key.replace(/_/g, ' ')}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setDisplayDeductions({ ...displayDeductions, [key]: Number(e.target.value) })
                  }
                  className="w-28 p-1.5 border border-slate-300 rounded text-right font-mono font-bold"
                />
              </div>
            ))}
          </div>

          {/* Body Damage */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Body / Frame Deductions (₹)
            </h3>
            {Object.entries(bodyDeductions).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{key.replace(/_/g, ' ')}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setBodyDeductions({ ...bodyDeductions, [key]: Number(e.target.value) })
                  }
                  className="w-28 p-1.5 border border-slate-300 rounded text-right font-mono font-bold"
                />
              </div>
            ))}
          </div>

          {/* Battery Health */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Battery Health Deductions (₹)
            </h3>
            {Object.entries(batteryDeductions).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{key}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setBatteryDeductions({ ...batteryDeductions, [key]: Number(e.target.value) })
                  }
                  className="w-28 p-1.5 border border-slate-300 rounded text-right font-mono font-bold"
                />
              </div>
            ))}
          </div>

          {/* Accessories Bonus */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
              Original Accessories Bonus (+₹)
            </h3>
            {Object.entries(accessoriesBonus).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setAccessoriesBonus({ ...accessoriesBonus, [key]: Number(e.target.value) })
                  }
                  className="w-28 p-1.5 border border-slate-300 rounded text-right font-mono font-bold text-green-700"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Functional Faults Deductions */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">
            Hardware & Component Fault Deductions (₹)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
            {Object.entries(functionalDeductions).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between p-2 bg-slate-50 rounded border border-slate-100">
                <span className="text-slate-700 font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                <input
                  type="number"
                  value={val}
                  onChange={(e) =>
                    setFunctionalDeductions({ ...functionalDeductions, [key]: Number(e.target.value) })
                  }
                  className="w-20 p-1 border border-slate-300 rounded text-right font-mono font-bold"
                />
              </div>
            ))}
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
