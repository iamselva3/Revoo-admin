import React, { useState } from 'react';
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
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel, Brand } from '../../types';

const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
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

  // Variant state (RAM & ROM / Storage)
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
    const payload = {
      brandId: brandId || brands?.[0]?._id,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      basePrice,
      releaseYear,
      imageUrl,
      isPublished: true,
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
    const name = (model.name || '').toLowerCase();
    if (name.includes('tv') || name.includes('bravia') || name.includes('oled') || name.includes('qled') || name.includes('crystal') || name.includes('uhd')) return 'tv';
    if (name.includes('ipad') || name.includes('tab') || name.includes('pad')) return 'tablet';
    if (
      name.includes('macbook') ||
      name.includes('laptop') ||
      name.includes('xps') ||
      name.includes('alienware') ||
      name.includes('thinkpad') ||
      name.includes('zenbook') ||
      name.includes('vivobook') ||
      name.includes('omen') ||
      name.includes('predator') ||
      name.includes('inspiron') ||
      name.includes('swift') ||
      name.includes('yoga') ||
      name.includes('legion') ||
      name.includes('spectre') ||
      name.includes('envy') ||
      name.includes('air') ||
      name.includes('pro 14') ||
      name.includes('pro 16')
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
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-revoo-700 hover:bg-revoo-800 text-white text-xs font-semibold rounded-xl shadow-xs transition"
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
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 ${
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

          {/* Aesthetic Brand Filter */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Brand:</span>
            <div className="relative">
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-revoo-500 cursor-pointer transition shadow-2xs"
              >
                <option value="">All Brands</option>
                {brands?.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
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
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs font-bold"
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
              <th className="px-6 py-3.5">Release Year</th>
              <th className="px-6 py-3.5">Base Buyback Price</th>
              <th className="px-6 py-3.5">Status</th>
              <th className="px-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              [...Array(6)].map((_, i) => (
                <tr key={i} className="animate-pulse">
                  <td colSpan={7} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : filteredModels.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                  <Smartphone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-semibold">No models found.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Try adjusting your category filter or search query.</p>
                </td>
              </tr>
            ) : (
              filteredModels.map((m) => {
                const cat = detectCategory(m);
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
                    <td className="px-6 py-3.5 text-slate-500">{m.releaseYear}</td>
                    <td className="px-6 py-3.5 font-bold text-revoo-700 font-mono text-sm">
                      ₹{m.basePrice.toLocaleString('en-IN')}
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
                          title="Edit Device Model & Price"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition"
                        >
                          <Edit className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Add Variant Button */}
                        <button
                          onClick={() => setShowVariantModal(m)}
                          title="Add Storage Variant"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                        >
                          <Layers className="w-3.5 h-3.5" /> + Variant
                        </button>

                        {/* Archive Button - Safe In-App Confirmation */}
                        <button
                          onClick={() => setConfirmArchiveModel(m)}
                          title="Archive Model"
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Button - Safe In-App Confirmation */}
                        <button
                          onClick={() => setConfirmDeleteModel(m)}
                          title="Delete Model Permanently"
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg border border-red-200 transition"
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

      {/* Add or Edit Model Modal */}
      {(showAddModal || editingModel) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-100 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-10">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingModel ? `Edit Model: ${editingModel.name}` : 'Add Smartphone Model'}
                </h3>
                <p className="text-xs text-slate-500">
                  {editingModel ? 'Update device specifications, base buyback price, and photo.' : 'Add a new phone model to the customer valuation catalogue.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingModel(null);
                  resetForm();
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveModel} className="flex flex-col flex-1 overflow-hidden">
              <div className="overflow-y-auto p-6 space-y-4 flex-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Brand</label>
                  <select
                    required
                    value={brandId || brands?.[0]?._id}
                    onChange={(e) => setBrandId(e.target.value)}
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-revoo-500"
                  >
                    {brands?.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Model Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Galaxy S24 Ultra, iPhone 15 Pro, Nothing Phone (2a)"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-revoo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Base Buyback Price (₹)</label>
                    <input
                      type="number"
                      required
                      value={basePrice}
                      onChange={(e) => setBasePrice(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-revoo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Release Year</label>
                    <input
                      type="number"
                      value={releaseYear}
                      onChange={(e) => setReleaseYear(Number(e.target.value))}
                      className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-revoo-500"
                    />
                  </div>
                </div>

                {/* Device Photo Upload & Preview */}
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-700">Device Photo</label>

                  {imageUrl && (
                    <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                      <div className="w-12 h-12 rounded bg-white border border-slate-200 p-1 flex items-center justify-center shrink-0">
                        <img src={imageUrl} alt="preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <span className="text-xs text-slate-700 font-medium block truncate">Image loaded</span>
                        <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ready for live app
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setImageUrl('')}
                        className="text-xs text-red-600 hover:text-red-700 font-semibold px-2 py-1"
                      >
                        Remove
                      </button>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition">
                      <Upload className="w-4 h-4 text-slate-600" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageFileUpload}
                      />
                    </label>
                    <span className="text-xs text-slate-400">or enter image URL below</span>
                  </div>

                  <input
                    type="url"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or click Upload Photo above"
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-revoo-500"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-100 bg-slate-50 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingModel(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createModelMutation.isPending || updateModelMutation.isPending}
                  className="px-5 py-2 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded-lg shadow-sm transition"
                >
                  {createModelMutation.isPending || updateModelMutation.isPending
                    ? 'Saving...'
                    : editingModel
                    ? 'Update Model'
                    : 'Publish Model'}
                </button>
              </div>
            </form>
          </div>
        </div>
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
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
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
                    className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white font-medium"
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
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-slate-50 focus:bg-white"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  How this configuration will appear in customer selection (e.g. 8GB / 256GB).
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price Modifier (₹)</label>
                <input
                  type="number"
                  value={variantPriceModifier}
                  onChange={(e) => setVariantPriceModifier(Number(e.target.value))}
                  placeholder="e.g. 3500"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount added to base price (₹{showVariantModal.basePrice.toLocaleString('en-IN')}) for engine calculation. (Not displayed to customers).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVariantModal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createVariantMutation.isPending}
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded-lg shadow-sm"
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-xl shadow-xs transition"
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
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
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
                className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition"
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
