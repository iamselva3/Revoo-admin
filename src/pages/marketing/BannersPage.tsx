import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Image, Plus, Trash2, Edit2, CheckCircle2, XCircle, ExternalLink, Sparkles } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Banner {
  _id: string;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  color1: string;
  color2: string;
  icon: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
}

export const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);

  const [formValues, setFormValues] = useState({
    tag: 'LIMITED OFFER',
    title: 'Special Buyback Bonus',
    subtitle: 'Extra ₹1,000 on trading in flagship smartphones',
    badge: 'Verified Payout',
    color1: '#0B6623',
    color2: '#073814',
    icon: 'flash_on',
    linkUrl: '/catalogue/brands',
    isActive: true,
    displayOrder: 1,
  });

  const { data: banners, isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/banners')).data.data,
  });

  const saveMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingBanner) {
        return (await apiClient.put(`/catalogue/admin/banners/${editingBanner._id}`, payload)).data;
      }
      return (await apiClient.post('/catalogue/admin/banners', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setIsModalOpen(false);
      setEditingBanner(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return (await apiClient.delete(`/catalogue/admin/banners/${id}`)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
    },
  });

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormValues({
      tag: 'HOT DEAL',
      title: 'Monsoon Device Upgrade',
      subtitle: 'Instant ₹1,500 extra valuation on exchange',
      badge: 'Limited Time',
      color1: '#0F172A',
      color2: '#1E293B',
      icon: 'flash_on',
      linkUrl: '/catalogue/brands',
      isActive: true,
      displayOrder: (banners?.length || 0) + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormValues({
      tag: banner.tag,
      title: banner.title,
      subtitle: banner.subtitle,
      badge: banner.badge,
      color1: banner.color1,
      color2: banner.color2,
      icon: banner.icon,
      linkUrl: banner.linkUrl,
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formValues);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Promotional Banners</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage live home screen banner carousels, marketing tags, and promotional discounts in the customer mobile app.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-revoo-700 text-white rounded-lg text-sm font-semibold hover:bg-revoo-800 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner</span>
        </button>
      </div>

      {/* Banner Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-pulse">
          <div className="h-44 bg-slate-200 rounded-xl"></div>
          <div className="h-44 bg-slate-200 rounded-xl"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {banners?.map((b) => (
            <div
              key={b._id}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Banner Live Mobile Preview */}
              <div
                className="p-6 text-white relative flex flex-col justify-between min-h-[160px]"
                style={{
                  background: `linear-gradient(135deg, ${b.color1}, ${b.color2})`,
                }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-lime-400 text-slate-950">
                    {b.tag}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-lime-400" />
                    {b.badge}
                  </span>
                </div>

                <div className="my-3">
                  <h3 className="text-lg font-black leading-tight text-white">{b.title}</h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2">{b.subtitle}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-white/10 pt-2">
                  <span>Target: {b.linkUrl}</span>
                  <span className="text-slate-300">Priority: {b.displayOrder}</span>
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {b.isActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live on App
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-slate-400 font-medium">
                      <XCircle className="w-3.5 h-3.5" /> Inactive
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(b)}
                    className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-md transition-colors"
                    title="Edit Banner"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to delete this promotional banner?')) {
                        deleteMutation.mutate(b._id);
                      }
                    }}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h2 className="text-lg font-bold text-slate-900 mb-4">
              {editingBanner ? 'Edit Promotional Banner' : 'Create New Home Banner'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pill Tag</label>
                  <input
                    type="text"
                    value={formValues.tag}
                    onChange={(e) => setFormValues({ ...formValues, tag: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    placeholder="e.g. FLASH OFFER"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Text</label>
                  <input
                    type="text"
                    value={formValues.badge}
                    onChange={(e) => setFormValues({ ...formValues, badge: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    placeholder="e.g. Verified Payout"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Title</label>
                <input
                  type="text"
                  value={formValues.title}
                  onChange={(e) => setFormValues({ ...formValues, title: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-medium"
                  placeholder="e.g. Sell Old Phone at Highest Price"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Details</label>
                <textarea
                  value={formValues.subtitle}
                  onChange={(e) => setFormValues({ ...formValues, subtitle: e.target.value })}
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                  rows={2}
                  placeholder="e.g. Zero deductions for normal wear • Free doorstep pickup"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gradient Start Color</label>
                  <input
                    type="text"
                    value={formValues.color1}
                    onChange={(e) => setFormValues({ ...formValues, color1: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    placeholder="#0F172A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gradient End Color</label>
                  <input
                    type="text"
                    value={formValues.color2}
                    onChange={(e) => setFormValues({ ...formValues, color2: e.target.value })}
                    className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    placeholder="#1E293B"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formValues.isActive}
                  onChange={(e) => setFormValues({ ...formValues, isActive: e.target.checked })}
                  className="rounded text-revoo-700 focus:ring-revoo-600"
                />
                <label htmlFor="isActive" className="text-xs font-medium text-slate-700">
                  Publish to mobile app immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="px-4 py-2 bg-revoo-700 text-white text-xs font-semibold rounded-lg hover:bg-revoo-800 transition-colors shadow-sm"
                >
                  {saveMutation.isPending ? 'Saving...' : 'Save Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

