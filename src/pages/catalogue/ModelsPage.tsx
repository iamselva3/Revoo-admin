import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Archive,
  Smartphone,
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

export const ModelsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingModel, setEditingModel] = useState<SmartphoneModel | null>(null);
  const [showVariantModal, setShowVariantModal] = useState<SmartphoneModel | null>(null);

  // Form state (used for Add and Edit)
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(40000);
  const [releaseYear, setReleaseYear] = useState<number>(2024);
  const [imageUrl, setImageUrl] = useState('');

  // Variant state
  const [variantCapacity, setVariantCapacity] = useState('256GB');
  const [variantPriceModifier, setVariantPriceModifier] = useState<number>(5000);

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

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
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
    createVariantMutation.mutate({
      modelId: showVariantModal._id,
      payload: {
        modelId: showVariantModal._id,
        capacity: variantCapacity,
        priceModifier: variantPriceModifier,
        isPublished: true,
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smartphone Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">
            Maintain smartphone device models, storage variations, and base valuation prices.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={(e) => setSelectedBrand(e.target.value)}
            className="p-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
          >
            <option value="">All Brands</option>
            {brands?.map((b) => (
              <option key={b._id} value={b._id}>
                {b.name}
              </option>
            ))}
          </select>

          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-revoo-700 hover:bg-revoo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> Add Model
          </button>
        </div>
      </div>

      {/* Models Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider border-b border-slate-200">
            <tr>
              <th className="px-6 py-3.5">Device Model</th>
              <th className="px-6 py-3.5">Brand</th>
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
                  <td colSpan={6} className="px-6 py-4 bg-slate-50/50"></td>
                </tr>
              ))
            ) : !models || models.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                  No smartphone models found.
                </td>
              </tr>
            ) : (
              models.map((m) => (
                <tr key={m._id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center p-1 border border-slate-200 shrink-0 overflow-hidden">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-contain" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span>{m.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {typeof m.brandId === 'object' ? (m.brandId as any).name : 'Brand'}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{m.releaseYear}</td>
                  <td className="px-6 py-4 font-bold text-revoo-700 font-mono text-sm">
                    ₹{m.basePrice.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
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
                  <td className="px-6 py-4 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      {/* Edit Button */}
                      <button
                        onClick={() => handleOpenEdit(m)}
                        title="Edit Device Model & Price"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 transition"
                      >
                        <Edit className="w-3.5 h-3.5" /> Edit
                      </button>

                      {/* Add Variant Button */}
                      <button
                        onClick={() => setShowVariantModal(m)}
                        title="Add Storage Variant"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-md border border-slate-200 transition"
                      >
                        <Layers className="w-3.5 h-3.5" /> + Variant
                      </button>

                      {/* Archive Button */}
                      <button
                        onClick={() => {
                          if (confirm(`Archive ${m.name}? Historical buybacks remain safe.`)) {
                            archiveMutation.mutate(m._id);
                          }
                        }}
                        title="Archive Model"
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md border border-slate-200 transition"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to permanently delete ${m.name}? This cannot be undone.`)) {
                            deleteModelMutation.mutate(m._id);
                          }
                        }}
                        title="Delete Model Permanently"
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md border border-red-200 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
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
          <div className="bg-white rounded-2xl max-w-sm w-full my-auto shadow-2xl border border-slate-100 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Add Storage Variant
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
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Capacity</label>
                <select
                  value={variantCapacity}
                  onChange={(e) => setVariantCapacity(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs bg-white"
                >
                  <option value="64GB">64GB</option>
                  <option value="128GB">128GB</option>
                  <option value="256GB">256GB</option>
                  <option value="512GB">512GB</option>
                  <option value="1TB">1TB</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Price Modifier (₹)</label>
                <input
                  type="number"
                  value={variantPriceModifier}
                  onChange={(e) => setVariantPriceModifier(Number(e.target.value))}
                  placeholder="e.g. 5000"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono font-bold"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Amount added to base price (₹{showVariantModal.basePrice.toLocaleString('en-IN')}).
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
    </div>
  );
};
