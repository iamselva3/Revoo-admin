import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Archive, Smartphone, Edit, Layers } from 'lucide-react';
import { apiClient } from '../../api/client';
import { SmartphoneModel, Brand, StorageVariant } from '../../types';

export const ModelsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedBrand, setSelectedBrand] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showVariantModal, setShowVariantModal] = useState<SmartphoneModel | null>(null);

  // New model state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [brandId, setBrandId] = useState('');
  const [basePrice, setBasePrice] = useState<number>(40000);
  const [releaseYear, setReleaseYear] = useState<number>(2024);
  const [imageUrl, setImageUrl] = useState('');

  // New variant state
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
      setName('');
      setSlug('');
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

  const handleCreateModel = (e: React.FormEvent) => {
    e.preventDefault();
    createModelMutation.mutate({
      brandId: brandId || brands?.[0]?._id,
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      basePrice,
      releaseYear,
      imageUrl,
      isPublished: true,
    });
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
            onClick={() => setShowAddModal(true)}
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
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center p-1 border border-slate-200">
                      {m.imageUrl ? (
                        <img src={m.imageUrl} alt={m.name} className="w-full h-full object-contain" />
                      ) : (
                        <Smartphone className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                    <span>{m.name}</span>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">
                    {typeof m.brandId === 'object' ? m.brandId.name : 'Brand'}
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
                  <td className="px-6 py-4 text-right space-x-2">
                    <button
                      onClick={() => setShowVariantModal(m)}
                      title="Add Storage Variant"
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded border border-slate-200"
                    >
                      <Layers className="w-3.5 h-3.5" /> + Variant
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Archive ${m.name}? Historical transactions will remain preserved.`)) {
                          archiveMutation.mutate(m._id);
                        }
                      }}
                      title="Safely Archive Model"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50 rounded border border-red-200"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add Model Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateModel} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add Smartphone Model</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Manufacturer Brand</label>
              <select
                required
                value={brandId || brands?.[0]?._id}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
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
                placeholder="e.g. Galaxy S24 Ultra, iPhone 15 Pro"
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Base Price (₹)</label>
                <input
                  type="number"
                  required
                  value={basePrice}
                  onChange={(e) => setBasePrice(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Release Year</label>
                <input
                  type="number"
                  value={releaseYear}
                  onChange={(e) => setReleaseYear(Number(e.target.value))}
                  className="w-full p-2 border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Image URL</label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded"
              >
                Publish Model
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Variant Modal */}
      {showVariantModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleAddVariant} className="bg-white rounded-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">
              Add Storage Variant for {showVariantModal.name}
            </h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Storage Capacity</label>
              <select
                value={variantCapacity}
                onChange={(e) => setVariantCapacity(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-xs"
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
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Amount added to base model price (₹{showVariantModal.basePrice}).
              </span>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVariantModal(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded"
              >
                Save Variant
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

