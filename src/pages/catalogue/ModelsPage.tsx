import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Archive,
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  Layers,
  Trash2,
  Upload,
  X,
  Image as ImageIcon,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { resolveImageUrl } from '../../utils/assetUrl';
import { SmartphoneModel, Brand } from '../../types';
import { ModernSelect, SelectOption } from '../../components/common/ModernSelect';

/** Brand logo for dropdown options; shows the brand's first letter if the logo can't load. */
const BrandOptionIcon: React.FC<{ name: string; logoUrl?: string }> = ({ name, logoUrl }) => {
  const [failed, setFailed] = useState(false);
  const src = resolveImageUrl(logoUrl);
  if (!src || failed) {
    return (
      <span className="w-7 h-5 rounded-md bg-slate-200 text-[10px] font-bold text-slate-600 flex items-center justify-center">
        {name.charAt(0).toUpperCase()}
      </span>
    );
  }
  // Wider than tall so wordmark logos (Samsung, Oppo, Vivo) stay readable
  return <img src={src} alt="" className="w-7 h-5 object-contain" onError={() => setFailed(true)} />;
};

interface VariantItemState {
  id: string;
  capacity: string;
  ram?: string;
  storage?: string;
  priceModifier: number;
  enabled: boolean;
}

const STANDARD_VARIANTS: Array<{ ram: string; storage: string; defaultModifier: number }> = [
  { ram: '4GB', storage: '64GB', defaultModifier: -4000 },
  { ram: '6GB', storage: '128GB', defaultModifier: -2000 },
  { ram: '8GB', storage: '128GB', defaultModifier: 0 },
  { ram: '8GB', storage: '256GB', defaultModifier: 3500 },
  { ram: '12GB', storage: '256GB', defaultModifier: 6000 },
  { ram: '12GB', storage: '512GB', defaultModifier: 10000 },
  { ram: '16GB', storage: '512GB', defaultModifier: 14000 },
  { ram: '16GB', storage: '1TB', defaultModifier: 20000 },
  { ram: '16GB', storage: '2TB', defaultModifier: 28000 },
];

/*
 * Pricing semantics (shared with web-app / mobile-app — do not change):
 *   basePrice            = top-condition buyback price of the model's LOWEST variant
 *   variant.priceModifier = ₹ added to basePrice for that variant
 *   variant "Get up to"  = basePrice + priceModifier
 *   model headline "up to" = basePrice + max(priceModifier over variants), or basePrice if none
 */
const formatINR = (n: number): string => (Number(n) || 0).toLocaleString('en-IN');

const getModelUpToPrice = (m: SmartphoneModel): number => {
  const modifiers = (m.variants || []).map((v) => Number(v.priceModifier) || 0);
  return (Number(m.basePrice) || 0) + (modifiers.length > 0 ? Math.max(...modifiers) : 0);
};

/** "+₹3,500 vs base" / "−₹2,000 vs base" / "Same as base" */
const describeModifier = (modifier: number): string => {
  if (!modifier) return 'Same as base';
  return `${modifier > 0 ? '+' : '−'}₹${formatINR(Math.abs(modifier))} vs base`;
};

/**
 * Number input for rupee amounts that can be cleared and retyped freely: it only emits valid
 * numbers, re-syncs when the controlling value changes (e.g. base price edited) and reverts to
 * the current value on blur if left empty.
 */
const RupeeInput: React.FC<{
  value: number;
  onValueChange: (n: number) => void;
  className?: string;
  ariaLabel?: string;
  placeholder?: string;
}> = ({ value, onValueChange, className = '', ariaLabel, placeholder }) => {
  const [text, setText] = useState<string>(String(value));

  useEffect(() => {
    setText((prev) => (prev.trim() !== '' && Number(prev) === value ? prev : String(value)));
  }, [value]);

  return (
    <input
      type="number"
      inputMode="numeric"
      value={text}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw.trim() === '') return;
        const n = Number(raw);
        if (Number.isFinite(n)) onValueChange(n);
      }}
      onBlur={() => {
        if (text.trim() === '' || !Number.isFinite(Number(text))) setText(String(value));
      }}
      aria-label={ariaLabel}
      placeholder={placeholder}
      className={className}
    />
  );
};

export const ModelsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'phone' | 'laptop' | 'tablet' | 'tv'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<SmartphoneModel | null>(null);
  const [showVariantModal, setShowVariantModal] = useState<SmartphoneModel | null>(null);
  const [confirmDeleteModel, setConfirmDeleteModel] = useState<SmartphoneModel | null>(null);
  const [confirmArchiveModel, setConfirmArchiveModel] = useState<SmartphoneModel | null>(null);

  // Form state (used for Add and Edit)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(40000);
  const [releaseYear, setReleaseYear] = useState<number>(2024);
  const [imageUrl, setImageUrl] = useState('');

  // Multi-variant checkbox matrix state
  const [variantsList, setVariantsList] = useState<VariantItemState[]>([]);
  const [showCustomVariantRow, setShowCustomVariantRow] = useState(false);
  const [customRam, setCustomRam] = useState('8GB');
  const [customStorage, setCustomStorage] = useState('256GB');
  const [customModifier, setCustomModifier] = useState<number>(3500);

  // Variant state (RAM & ROM / Storage) for separate modal
  const [variantRam, setVariantRam] = useState('8GB');
  const [variantStorage, setVariantStorage] = useState('256GB');
  const [variantCapacity, setVariantCapacity] = useState('8GB / 256GB');
  const [variantPriceModifier, setVariantPriceModifier] = useState<number>(3500);

  const { data: brands } = useQuery<Brand[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/brands')).data.data,
  });

  const { data: models, isLoading } = useQuery<SmartphoneModel[]>({
    queryKey: ['admin-models', selectedBrand],
    queryFn: async () => {
      const params: any = {};
      if (selectedBrand) params.brandId = selectedBrand;
      const res = await apiClient.get('/catalogue/admin/models', { params });
      return res.data.data;
    },
  });

  const createModelMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await apiClient.post('/catalogue/admin/models', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      setShowAddModal(false);
      resetForm();
    },
  });

  const updateModelMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      return (await apiClient.put(`/catalogue/admin/models/${id}`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      setEditingModel(null);
      resetForm();
    },
  });

  const deleteModelMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/catalogue/admin/models/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/catalogue/admin/models/${id}/archive`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
    },
  });

  const createVariantMutation = useMutation({
    mutationFn: async ({ modelId, payload }: { modelId: string; payload: any }) => {
      return (await apiClient.post(`/catalogue/admin/models/${modelId}/variants`, payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-models'] });
      setShowVariantModal(null);
    },
  });

  const resetForm = () => {
    setName('');
    setSlug('');
    setBrandId('');
    setBasePrice(40000);
    setReleaseYear(2024);
    setImageUrl('');
    setVariantsList(
      STANDARD_VARIANTS.map((v) => ({
        id: `${v.ram}-${v.storage}`,
        capacity: `${v.ram} / ${v.storage}`,
        ram: v.ram,
        storage: v.storage,
        priceModifier: v.defaultModifier,
        enabled: (v.ram === '8GB' && v.storage === '128GB') || (v.ram === '8GB' && v.storage === '256GB'),
      }))
    );
    setShowCustomVariantRow(false);
  };

  const handleOpenAdd = () => {
    resetForm();
    setBrandId(brands?.[0]?._id || '');
    setShowAddModal(true);
  };

  const handleOpenEdit = (m: SmartphoneModel) => {
    setEditingModel(m);
    setName(m.name);
    setSlug(m.slug);
    setBrandId(typeof m.brandId === 'object' ? (m.brandId as any)._id : m.brandId);
    setBasePrice(m.basePrice);
    setReleaseYear(m.releaseYear);
    setImageUrl(m.imageUrl || '');

    // Pre-populate variants
    const existingVariants = m.variants || [];
    if (existingVariants.length > 0) {
      const matchedList: VariantItemState[] = [];
      const usedCapacities = new Set<string>();

      existingVariants.forEach((ev) => {
        matchedList.push({
          id: ev._id || ev.capacity,
          capacity: ev.capacity,
          ram: ev.ram,
          storage: ev.storage,
          priceModifier: ev.priceModifier || 0,
          enabled: true,
        });
        usedCapacities.add(ev.capacity.toLowerCase().replace(/\s+/g, ''));
      });

      // Add unconfigured standard variants as unchecked
      STANDARD_VARIANTS.forEach((sv) => {
        const capKey = `${sv.ram}/${sv.storage}`.toLowerCase();
        if (!usedCapacities.has(capKey)) {
          matchedList.push({
            id: `${sv.ram}-${sv.storage}`,
            capacity: `${sv.ram} / ${sv.storage}`,
            ram: sv.ram,
            storage: sv.storage,
            priceModifier: sv.defaultModifier,
            enabled: false,
          });
        }
      });

      setVariantsList(matchedList);
    } else {
      setVariantsList(
        STANDARD_VARIANTS.map((v) => ({
          id: `${v.ram}-${v.storage}`,
          capacity: `${v.ram} / ${v.storage}`,
          ram: v.ram,
          storage: v.storage,
          priceModifier: v.defaultModifier,
          enabled: (v.ram === '8GB' && v.storage === '128GB') || (v.ram === '8GB' && v.storage === '256GB'),
        }))
      );
    }
    setShowCustomVariantRow(false);
  };

  const handleAddCustomVariant = () => {
    const cap = `${customRam} / ${customStorage}`;
    if (variantsList.some((v) => v.capacity.toLowerCase() === cap.toLowerCase())) {
      return;
    }
    setVariantsList([
      ...variantsList,
      {
        id: `custom-${Date.now()}`,
        capacity: cap,
        ram: customRam,
        storage: customStorage,
        priceModifier: customModifier,
        enabled: true,
      },
    ]);
    setShowCustomVariantRow(false);
  };

  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 800;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
      } catch (err) {
        console.error('Error compressing image:', err);
      }
    }
  };

  const handleSaveModel = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedVariants = variantsList
      .filter((v) => v.enabled)
      .map((v) => ({
        capacity: v.capacity,
        ram: v.ram,
        storage: v.storage,
        priceModifier: Number(v.priceModifier) || 0,
      }));

    const payload = {
      brandId: brandId || brands?.[0]?._id,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      basePrice: Number(basePrice),
      releaseYear: Number(releaseYear),
      imageUrl,
      isPublished: true,
      variants: selectedVariants,
    };

    if (editingModel) {
      updateModelMutation.mutate({ id: editingModel._id, payload });
    } else {
      createModelMutation.mutate(payload);
    }
  };

  const handleAddVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showVariantModal) return;
    const finalCapacity = variantCapacity.trim() || `${variantRam} / ${variantStorage}`;
    createVariantMutation.mutate({
      modelId: showVariantModal._id,
      payload: {
        modelId: showVariantModal._id,
        capacity: finalCapacity,
        ram: variantRam,
        storage: variantStorage,
        priceModifier: variantPriceModifier,
        isPublished: true,
      },
    });
  };

  const detectCategory = (model: SmartphoneModel): 'phone' | 'laptop' | 'tablet' | 'tv' => {
    const modelName = (model.name || '').toLowerCase();
    if (modelName.includes('tv') || modelName.includes('bravia') || modelName.includes('oled') || modelName.includes('qled') || modelName.includes('crystal') || modelName.includes('uhd')) return 'tv';
    if (modelName.includes('ipad') || modelName.includes('tab') || modelName.includes('pad')) return 'tablet';
    if (
      modelName.includes('macbook') ||
      modelName.includes('laptop') ||
      modelName.includes('xps') ||
      modelName.includes('alienware') ||
      modelName.includes('thinkpad') ||
      modelName.includes('zenbook') ||
      modelName.includes('vivobook') ||
      modelName.includes('omen') ||
      modelName.includes('predator') ||
      modelName.includes('inspiron') ||
      modelName.includes('swift') ||
      modelName.includes('yoga') ||
      modelName.includes('legion') ||
      modelName.includes('spectre') ||
      modelName.includes('envy') ||
      modelName.includes('macbook air') ||
      modelName.includes('macbook pro')
    )
      return 'laptop';
    return 'phone';
  };

  const filteredModels = (models || []).filter((m) => {
    const cat = detectCategory(m);
    const matchesCat = selectedCategory === 'all' || cat === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || m.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

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

  const brandOptions: SelectOption[] = [
    { value: '', label: 'All Brands' },
    ...(brands || []).map((b) => ({
      value: b._id,
      label: b.name,
      icon: <BrandOptionIcon name={b.name} logoUrl={b.logoUrl} />,
    })),
  ];

  const modalBrandOptions: SelectOption[] = (brands || []).map((b) => ({
    value: b._id,
    label: b.name,
    icon: <BrandOptionIcon name={b.name} logoUrl={b.logoUrl} />,
  }));

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-revoo-700" /> Selling Models Catalogue (Buyback)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Authoritative device models, storage variations, and base valuation prices across Phones, Laptops, Tablets, and TVs.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-revoo-700 hover:bg-revoo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Model
        </button>
      </div>

      {/* Aesthetic Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        {/* Category Filter Pills */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'All Devices', icon: Filter },
              { id: 'phone', label: 'Mobile Phones', icon: Smartphone },
              { id: 'laptop', label: 'Laptops', icon: Laptop },
              { id: 'tablet', label: 'Tablets & iPads', icon: Tablet },
              { id: 'tv', label: 'Smart TVs', icon: Tv },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedCategory === tab.id;
              const count = tab.id === 'all'
                ? models?.length || 0
                : models?.filter((m) => detectCategory(m) === tab.id).length || 0;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedCategory(tab.id as any)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${isActive ? 'bg-slate-700 text-slate-200' : 'bg-slate-200 text-slate-600'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Modern Custom Brand Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
            <div className="w-48">
              <ModernSelect
                value={selectedBrand}
                onChange={(val) => setSelectedBrand(String(val))}
                options={brandOptions}
                placeholder="All Brands"
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search model name (e.g. iPhone 15, MacBook Air, Alienware, Galaxy S24, Sony Bravia)..."
            className="w-full text-xs pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-revoo-500 text-slate-800 placeholder-slate-400 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50/80 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Device Model</th>
              <th className="px-6 py-3.5">Brand</th>
              <th className="px-6 py-3.5">Category</th>
              <th className="px-6 py-3.5">Variants Configured</th>
              <th className="px-6 py-3.5">Release Year</th>
              <th className="px-6 py-3.5">Buyback Price (Up to)</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={8} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : filteredModels.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold">No models found.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your category filter or search query.</p>
                </td>
              </tr>
            ) : (
              filteredModels.map((m) => {
                const cat = detectCategory(m);
                const modelVariants = m.variants || [];
                return (
                  <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center p-1 border border-slate-200 shrink-0 overflow-hidden shadow-2xs">
                        {m.imageUrl ? (
                          <img
                            src={resolveImageUrl(m.imageUrl)}
                            alt={m.name}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                              const parent = (e.target as HTMLElement).parentElement;
                              if (parent) {
                                const icon = document.createElement('div');
                                icon.className = 'text-slate-400 font-bold text-[10px]';
                                icon.innerText = m.name.slice(0, 3).toUpperCase();
                                parent.appendChild(icon);
                              }
                            }}
                          />
                        ) : (
                          getCategoryIcon(cat)
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate">{m.name}</span>
                        <span className="block text-[10px] text-slate-400 font-mono font-normal">{m.slug}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700">
                      {typeof m.brandId === 'object' ? (m.brandId as any).name : 'Brand'}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                        {getCategoryIcon(cat)}
                        {cat}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      {modelVariants.length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {modelVariants.slice(0, 3).map((v, idx) => (
                            <span
                              key={idx}
                              className="px-1.5 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 text-[10px] font-semibold rounded-md"
                            >
                              {v.capacity}
                            </span>
                          ))}
                          {modelVariants.length > 3 && (
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-bold rounded-md">
                              +{modelVariants.length - 3} more
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">Standard</span>
                      )}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{m.releaseYear}</td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <div className="flex items-baseline gap-1">
                        <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">Up to</span>
                        <span className="font-mono font-bold text-sm text-revoo-700 dark:text-amber-400">
                          ₹{formatINR(getModelUpToPrice(m))}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                        from ₹{formatINR(m.basePrice)}
                      </div>
                    </td>
                    <td className="px-6 py-3.5">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          m.isPublished
                            ? 'bg-green-50 text-green-700 border-green-200'
                            : 'bg-slate-100 text-slate-500 border-slate-300'
                        }`}
                      >
                        {m.isPublished ? 'Published' : 'Hidden'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleOpenEdit(m)}
                          title="Edit Device Model, Name, Price & Variants"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Add Variant Button */}
                        <button
                          onClick={() => setShowVariantModal(m)}
                          title="Quick Add Single Variant"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          <Layers className="w-3.5 h-3.5" /> + Variant
                        </button>

                        {/* Archive Button */}
                        <button
                          onClick={() => setConfirmArchiveModel(m)}
                          title="Archive Model"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => setConfirmDeleteModel(m)}
                          title="Delete Model Permanently"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add or Edit Model Modal — model details on the left, variants & prices on the right.
          Rendered into <body> so it covers the whole screen (the page wrapper would otherwise
          offset the fixed overlay below the top bar). */}
      {(showAddModal || editingModel) &&
        createPortal(
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start lg:items-center p-3 sm:p-4 lg:p-2 overflow-y-auto">
          {/* Uses (almost) the full screen height so the variant list has room even on short laptop screens */}
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[calc(100dvh-1.5rem)] lg:h-[calc(100dvh-1rem)] lg:max-h-[880px] flex flex-col shadow-2xl overflow-hidden border border-slate-100 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-4 [@media(max-height:720px)]:py-2.5 border-b border-slate-100 shrink-0 bg-white">
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-slate-900 truncate">
                  {editingModel ? `Edit Model: ${editingModel.name}` : 'Add Smartphone Model'}
                </h3>
                <p className="text-sm text-slate-500 [@media(max-height:720px)]:hidden">
                  {editingModel ? 'Update device specifications, base buyback price, photo, and supported variants.' : 'Add a new phone model and select which RAM & ROM variants it supports.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingModel(null);
                  resetForm();
                }}
                aria-label="Close"
                className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModel} className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
                {/* ---------- Left: model details & photo ---------- */}
                <section className="p-5 sm:p-6 space-y-5 lg:overflow-y-auto lg:border-r lg:border-slate-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Model details</p>

                  {/* Modern Brand Select */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Manufacturer Brand</label>
                    <ModernSelect
                      value={brandId || brands?.[0]?._id || ''}
                      onChange={(val) => setBrandId(String(val))}
                      options={modalBrandOptions}
                      placeholder="Select Manufacturer Brand..."
                    />
                  </div>

                  <div>
                    <label htmlFor="model-name" className="block text-sm font-semibold text-slate-700 mb-1.5">Model Name</label>
                    <input
                      id="model-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Galaxy S24 Ultra, iPhone 15 Pro, Nothing Phone (2a)"
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-revoo-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-2">
                      <label htmlFor="model-base-price" className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Base price (₹)
                      </label>
                      <input
                        id="model-base-price"
                        type="number"
                        required
                        value={basePrice}
                        onChange={(e) => setBasePrice(Number(e.target.value))}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-revoo-500"
                      />
                      <span className="text-xs text-slate-400 mt-1 block">
                        Lowest variant, top condition. Changing it shifts every variant&apos;s price by the same amount.
                      </span>
                    </div>
                    <div>
                      <label htmlFor="model-release-year" className="block text-sm font-semibold text-slate-700 mb-1.5">Release Year</label>
                      <input
                        id="model-release-year"
                        type="number"
                        value={releaseYear}
                        onChange={(e) => setReleaseYear(Number(e.target.value))}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-revoo-500"
                      />
                      <span className="text-xs text-slate-400 mt-1 block">Launch year</span>
                    </div>
                  </div>

                  {/* Device Photo Upload & Preview */}
                  <div className="space-y-3">
                    <label className="block text-sm font-semibold text-slate-700">Device Photo</label>

                    <div className="flex h-48 items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                      {imageUrl ? (
                        <img src={resolveImageUrl(imageUrl)} alt="Device preview" className="max-h-full max-w-full object-contain" />
                      ) : (
                        <div className="text-center text-slate-400">
                          <ImageIcon className="mx-auto h-8 w-8" />
                          <p className="mt-2 text-xs">No photo yet</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-semibold border border-slate-300 transition">
                        <Upload className="w-4 h-4 text-slate-600" />
                        <span>Upload Photo</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageFileUpload} />
                      </label>
                      {imageUrl ? (
                        <>
                          <span className="text-xs text-emerald-600 font-semibold inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Ready for live app
                          </span>
                          <button
                            type="button"
                            onClick={() => setImageUrl('')}
                            className="ml-auto text-sm text-red-600 hover:text-red-700 font-semibold px-2 py-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-slate-400">or paste an image URL below</span>
                      )}
                    </div>

                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      placeholder="https://... or /uploads/... (or click Upload Photo)"
                      aria-label="Device photo URL"
                      className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-revoo-500"
                    />
                  </div>
                </section>

                {/* ---------- Right: variants & selling prices ---------- */}
                {/* The whole column scrolls (no small inner scroll box), so as many variants as fit are visible */}
                <section className="flex flex-col min-h-0 p-5 sm:p-6 bg-slate-50/50 border-t border-slate-200 lg:border-t-0 lg:overflow-y-auto">
                  <div className="flex items-start justify-between gap-4 shrink-0">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-bold text-slate-900">Hardware Variants & Selling Prices</p>
                      <p className="text-xs text-slate-500 mt-0.5 [@media(max-height:720px)]:hidden">
                        Tick the configurations this model supports and type each variant&apos;s customer
                        &ldquo;Get up to&rdquo; price (top condition).
                      </p>
                    </div>
                    <div className="shrink-0 text-right space-y-1">
                      <span className="inline-block text-xs font-bold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {variantsList.filter((v) => v.enabled).length} Configured
                      </span>
                      {(() => {
                        const enabledModifiers = variantsList
                          .filter((v) => v.enabled)
                          .map((v) => Number(v.priceModifier) || 0);
                        const headline =
                          (Number(basePrice) || 0) + (enabledModifiers.length > 0 ? Math.max(...enabledModifiers) : 0);
                        return (
                          <span className="block text-xs text-slate-500" title="Headline price shown to customers for this model">
                            Headline: <strong className="font-mono text-slate-800">up to ₹{formatINR(headline)}</strong>
                          </span>
                        );
                      })()}
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    {variantsList.map((v, idx) => {
                      const base = Number(basePrice) || 0;
                      const modifier = Number(v.priceModifier) || 0;
                      const customerUpTo = base + modifier;
                      return (
                        <div
                          key={v.id || idx}
                          className={`flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 px-4 py-2.5 rounded-xl border transition-all ${
                            v.enabled
                              ? 'bg-white border-indigo-300 ring-1 ring-indigo-500/10 shadow-sm'
                              : 'bg-white/60 dark:bg-white/[0.03] border-slate-200 opacity-60 hover:opacity-100'
                          }`}
                        >
                          {/* Checkbox and Variant Label (one line: "8GB / 256GB  8GB RAM • 256GB ROM") */}
                          <label className="flex items-center gap-3 cursor-pointer select-none min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={v.enabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                setVariantsList((prev) => prev.map((item, i) => (i === idx ? { ...item, enabled } : item)));
                              }}
                              className="w-[18px] h-[18px] rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 cursor-pointer shrink-0"
                            />
                            <span className="min-w-0 leading-snug">
                              <span className={`text-sm font-bold break-words ${v.enabled ? 'text-slate-900' : 'text-slate-500'}`}>
                                {v.capacity}
                              </span>
                              {v.ram && v.storage && (
                                <span className="ml-2 text-xs text-slate-400 whitespace-nowrap">
                                  {v.ram} RAM • {v.storage} ROM
                                </span>
                              )}
                            </span>
                          </label>

                          {/* Customer "Get up to" price — admin types the absolute price; we store
                              priceModifier = enteredPrice − basePrice (payload shape unchanged). */}
                          <div className="shrink-0 ml-auto flex items-center gap-3">
                            {v.enabled ? (
                              <>
                                <span
                                  className={`text-xs font-mono whitespace-nowrap ${modifier < 0 ? 'text-amber-600' : 'text-slate-400'}`}
                                  title={modifier < 0 ? 'Below the base price — base should be the lowest variant' : undefined}
                                >
                                  {describeModifier(modifier)}
                                </span>
                                <div className="inline-flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-slate-300 focus-within:ring-2 focus-within:ring-revoo-500 focus-within:border-transparent">
                                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Up to ₹</span>
                                  <RupeeInput
                                    value={customerUpTo}
                                    onValueChange={(entered) =>
                                      setVariantsList((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, priceModifier: entered - (Number(basePrice) || 0) } : item
                                        )
                                      )
                                    }
                                    ariaLabel={`Customer up-to price for ${v.capacity}`}
                                    placeholder="0"
                                    className="w-24 text-sm font-mono font-bold text-slate-900 bg-transparent text-right focus:outline-none"
                                  />
                                </div>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-slate-400 italic">Not offered</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add Custom Configuration Toggle */}
                  <div className="shrink-0 mt-4">
                    {!showCustomVariantRow ? (
                      <button
                        type="button"
                        onClick={() => setShowCustomVariantRow(true)}
                        className="text-sm font-bold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Plus className="w-4 h-4" /> Add Custom RAM & ROM Configuration
                      </button>
                    ) : (
                      <div className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-indigo-950">Add Custom Hardware Variant</span>
                          <button
                            type="button"
                            onClick={() => setShowCustomVariantRow(false)}
                            className="text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">RAM</label>
                            <input
                              type="text"
                              value={customRam}
                              onChange={(e) => setCustomRam(e.target.value)}
                              placeholder="e.g. 12GB"
                              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">ROM / Storage</label>
                            <input
                              type="text"
                              value={customStorage}
                              onChange={(e) => setCustomStorage(e.target.value)}
                              placeholder="e.g. 512GB"
                              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-slate-600 block mb-1">Up to price (₹)</label>
                            <RupeeInput
                              value={(Number(basePrice) || 0) + (Number(customModifier) || 0)}
                              onValueChange={(entered) => setCustomModifier(entered - (Number(basePrice) || 0))}
                              ariaLabel="Customer up-to price for custom variant"
                              placeholder="0"
                              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl bg-white font-mono"
                            />
                            <span className="text-xs font-mono text-slate-400 mt-1 block">
                              {describeModifier(Number(customModifier) || 0)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={handleAddCustomVariant}
                            className="px-4 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 cursor-pointer"
                          >
                            Include This Variant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </section>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-3 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingModel(null);
                    resetForm();
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModelMutation.isPending || updateModelMutation.isPending}
                  className="px-6 py-2.5 text-sm font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded-xl shadow-sm transition cursor-pointer"
                >
                  {createModelMutation.isPending || updateModelMutation.isPending
                    ? 'Saving...'
                    : editingModel
                    ? 'Update Model & Variants'
                    : 'Publish Model & Variants'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full my-auto shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add RAM & ROM Variant
                </h3>
                <p className="text-xs text-slate-500">{showVariantModal.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowVariantModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVariant} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RAM</label>
                  <select
                    value={variantRam}
                    onChange={(e) => {
                      setVariantRam(e.target.value);
                      setVariantCapacity(`${e.target.value} / ${variantStorage}`);
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="4GB">4GB RAM</option>
                    <option value="6GB">6GB RAM</option>
                    <option value="8GB">8GB RAM</option>
                    <option value="12GB">12GB RAM</option>
                    <option value="16GB">16GB RAM</option>
                    <option value="24GB">24GB RAM</option>
                    <option value="32GB">32GB RAM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">ROM / Storage</label>
                  <select
                    value={variantStorage}
                    onChange={(e) => {
                      setVariantStorage(e.target.value);
                      setVariantCapacity(`${variantRam} / ${e.target.value}`);
                    }}
                    className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-white font-medium"
                  >
                    <option value="64GB">64GB ROM</option>
                    <option value="128GB">128GB ROM</option>
                    <option value="256GB">256GB ROM</option>
                    <option value="512GB">512GB ROM</option>
                    <option value="1TB">1TB ROM</option>
                    <option value="2TB">2TB ROM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Variant Name (RAM / ROM)</label>
                <input
                  type="text"
                  value={variantCapacity}
                  onChange={(e) => setVariantCapacity(e.target.value)}
                  placeholder="e.g. 8GB / 256GB"
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  How this configuration will appear in customer selection (e.g. 8GB / 256GB).
                </span>
              </div>

              <div>
                <label htmlFor="quick-variant-modifier" className="block text-xs font-semibold text-slate-700 mb-1">
                  Price Modifier (₹)
                </label>
                <div className="flex items-stretch gap-2">
                  <input
                    id="quick-variant-modifier"
                    type="number"
                    value={variantPriceModifier}
                    onChange={(e) => setVariantPriceModifier(Number(e.target.value))}
                    placeholder="e.g. 3500"
                    className="flex-1 min-w-0 p-2.5 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                  />
                  {/* Live customer-facing preview: basePrice + modifier */}
                  <div
                    aria-live="polite"
                    className="shrink-0 flex flex-col justify-center px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800/50 dark:bg-emerald-950/40 text-right"
                  >
                    <span className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      Customer up-to price:
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-800 dark:text-emerald-200 whitespace-nowrap">
                      ₹{formatINR((Number(showVariantModal.basePrice) || 0) + (Number(variantPriceModifier) || 0))}
                    </span>
                  </div>
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount added to the base price (₹{formatINR(showVariantModal.basePrice)} — lowest variant, top condition).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVariantMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded-xl shadow-sm cursor-pointer"
                >
                  {createVariantMutation.isPending ? 'Saving...' : 'Save Variant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Safe In-App Delete Confirmation Modal */}
      {confirmDeleteModel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center text-red-600 mb-4 border border-red-100">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Delete Device Model?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-800">{confirmDeleteModel.name}</strong>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmDeleteModel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteModelMutation.isPending}
                onClick={() => {
                  deleteModelMutation.mutate(confirmDeleteModel._id, {
                    onSettled: () => setConfirmDeleteModel(null),
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                {deleteModelMutation.isPending ? 'Deleting...' : 'Yes, Delete Model'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe In-App Archive Confirmation Modal */}
      {confirmArchiveModel && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 mb-4 border border-amber-100">
              <Archive className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Archive Device Model?</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Archiving <strong className="text-slate-800">{confirmArchiveModel.name}</strong> will hide it from customer valuation searches while preserving all historical buyback request records.
            </p>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setConfirmArchiveModel(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={archiveMutation.isPending}
                onClick={() => {
                  archiveMutation.mutate(confirmArchiveModel._id, {
                    onSettled: () => setConfirmArchiveModel(null),
                  });
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition cursor-pointer"
              >
                {archiveMutation.isPending ? 'Archiving...' : 'Yes, Archive Model'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
