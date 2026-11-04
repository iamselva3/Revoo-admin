import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Smartphone } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Brand } from '../../types';

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState(0);

  const { data: brands, isLoading } = useQuery<Brand[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => {
      const res = await apiClient.get('/catalogue/admin/brands');
      return res.data.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: Partial<Brand>) => {
      return (await apiClient.post('/catalogue/admin/brands', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setShowAddModal(false);
      setName('');
      setSlug('');
      setLogoUrl('');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return (await apiClient.put(`/catalogue/admin/brands/${id}`, { isActive })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      name,
      slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
      logoUrl,
      displayOrder,
      isActive: true,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Smartphone Brands</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure active smartphone manufacturers published to the customer mobile application.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-revoo-700 hover:bg-revoo-800 text-white text-xs font-semibold rounded-lg shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Brand
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse"></div>
          ))
        ) : !brands || brands.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400">
            No brands configured yet.
          </div>
        ) : (
          brands.map((brand) => (
            <div
              key={brand._id}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div className="flex items-start justify-between">
                <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-2 flex items-center justify-center">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
                  ) : (
                    <Smartphone className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <button
                  onClick={() => toggleMutation.mutate({ id: brand._id, isActive: !brand.isActive })}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition ${
                    brand.isActive
                      ? 'bg-green-50 text-green-700 border-green-200'
                      : 'bg-slate-100 text-slate-500 border-slate-300'
                  }`}
                >
                  {brand.isActive ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-slate-900 text-base">{brand.name}</h3>
                <span className="text-[11px] text-slate-400 font-mono">Slug: {brand.slug}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Smartphone Brand</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Apple, Samsung, Google"
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. apple"
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Priority Order</label>
              <input
                type="number"
                value={displayOrder}
                onChange={(e) => setDisplayOrder(Number(e.target.value))}
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
                disabled={createMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-revoo-700 hover:bg-revoo-800 rounded"
              >
                Save Brand
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

