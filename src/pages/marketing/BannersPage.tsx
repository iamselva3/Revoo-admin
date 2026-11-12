import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Sparkles, Smartphone, Eye, Flame, ShoppingBag, Upload, X } from 'lucide-react';
import { apiClient } from '../../api/client';
import { resolveImageUrl } from '../../utils/assetUrl';

interface Banner {
  _id: string;
  tag: string;
  title: string;
  subtitle: string;
  badge: string;
  color1: string;
  color2: string;
  icon: string;
  imageUrl?: string;
  isPopupModal?: boolean;
  popupActionText?: string;
  popupActionUrl?: string;
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
    color1: '#059669',
    color2: '#022C22',
    icon: 'flash_on',
    imageUrl: '',
    isPopupModal: false,
    popupActionText: 'BUY NOW — LIVE SALE',
    popupActionUrl: '/buy',
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
      color1: '#059669',
      color2: '#022C22',
      icon: 'flash_on',
      imageUrl: '',
      isPopupModal: false,
      popupActionText: 'BUY NOW — LIVE SALE',
      popupActionUrl: '/buy',
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
      color1: banner.color1 || '#059669',
      color2: banner.color2 || '#022C22',
      icon: banner.icon || 'flash_on',
      imageUrl: banner.imageUrl || '',
      isPopupModal: banner.isPopupModal || false,
      popupActionText: banner.popupActionText || 'BUY NOW — LIVE SALE',
      popupActionUrl: banner.popupActionUrl || '/buy',
      linkUrl: banner.linkUrl || '/catalogue/brands',
      isActive: banner.isActive,
      displayOrder: banner.displayOrder,
    });
    setIsModalOpen(true);
  };

  const handleBannerImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormValues((prev) => ({ ...prev, imageUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Promotional Banners & Popups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage live home screen banner carousels, custom promotional images, and interactive 3D Live Sale launch modals for the mobile app.
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner / Modal</span>
        </button>
      </div>

      {/* Grid of Banners */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners?.map((b) => (
            <div
              key={b._id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Banner Visual Preview */}
              <div
                className="p-5 relative overflow-hidden"
                style={{
                  background: b.imageUrl
                    ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.8)), url(${b.imageUrl}) center/cover no-repeat`
                    : `linear-gradient(135deg, ${b.color1 || '#059669'}, ${b.color2 || '#022C22'})`,
                }}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2 py-0.5 rounded font-black text-[10px] bg-emerald-400 text-slate-950">
                    {b.tag}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {b.isPopupModal && (
                      <span className="px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-500 text-white flex items-center gap-1 shadow-sm">
                        <Flame className="w-3 h-3" /> Live Sale Modal
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full font-medium text-[10px] bg-white/20 text-white backdrop-blur-sm">
                      {b.badge}
                    </span>
                  </div>
                </div>

                <div className="my-3">
                  <h3 className="text-lg font-black leading-tight text-white">{b.title}</h3>
                  <p className="text-xs text-slate-200 mt-1 line-clamp-2">{b.subtitle}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 border-t border-white/10 pt-2">
                  <span>Target: {b.linkUrl}</span>
                  <span>Priority: {b.displayOrder}</span>
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

      {/* Edit / Add Modal with Live Mobile Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingBanner ? 'Edit Promotional Banner / Popup' : 'Create New Promotional Banner'}
                </h2>
                <p className="text-xs text-slate-500">Configure visual style and view instant live mobile preview.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Form Controls (7 cols) */}
                <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-3.5">
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Promo Details</label>
                    <textarea
                      value={formValues.subtitle}
                      onChange={(e) => setFormValues({ ...formValues, subtitle: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      rows={2}
                      placeholder="e.g. Instant cash at doorstep with zero wear deductions"
                      required
                    />
                  </div>

                  {/* Banner Image Upload & Preview */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Banner Image / Poster</label>

                    {formValues.imageUrl && (
                      <div className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="w-14 h-10 rounded bg-white border border-slate-200 overflow-hidden shrink-0">
                          <img src={resolveImageUrl(formValues.imageUrl)} alt="banner" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <span className="text-xs text-slate-700 font-medium block truncate">Banner Photo Loaded</span>
                          <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Live in mobile app
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormValues({ ...formValues, imageUrl: '' })}
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
                          onChange={handleBannerImageUpload}
                        />
                      </label>
                      <span className="text-xs text-slate-400">or enter image URL below</span>
                    </div>

                    <input
                      type="url"
                      value={formValues.imageUrl}
                      onChange={(e) => setFormValues({ ...formValues, imageUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      placeholder="https://... or click Upload Photo above"
                    />
                  </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gradient Start Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formValues.color1}
                        onChange={(e) => setFormValues({ ...formValues, color1: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={formValues.color1}
                        onChange={(e) => setFormValues({ ...formValues, color1: e.target.value })}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Gradient End Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={formValues.color2}
                        onChange={(e) => setFormValues({ ...formValues, color2: e.target.value })}
                        className="w-8 h-8 rounded border border-slate-300 cursor-pointer p-0"
                      />
                      <input
                        type="text"
                        value={formValues.color2}
                        onChange={(e) => setFormValues({ ...formValues, color2: e.target.value })}
                        className="w-full text-xs p-2 border border-slate-300 rounded-lg font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 3D Live Sale Popup Modal Toggle */}
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="isPopupModal"
                      checked={formValues.isPopupModal}
                      onChange={(e) => setFormValues({ ...formValues, isPopupModal: e.target.checked })}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                    />
                    <label htmlFor="isPopupModal" className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-red-500" />
                      Trigger as Interactive 3D App Launch Modal (Live Sale / Buy Now)
                    </label>
                  </div>
                  {formValues.isPopupModal && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">CTA Button Label</label>
                        <input
                          type="text"
                          value={formValues.popupActionText}
                          onChange={(e) => setFormValues({ ...formValues, popupActionText: e.target.value })}
                          className="w-full text-xs p-1.5 border border-emerald-300 rounded bg-white"
                          placeholder="BUY NOW — LIVE SALE"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold text-emerald-900 mb-0.5">Destination Route</label>
                        <input
                          type="text"
                          value={formValues.popupActionUrl}
                          onChange={(e) => setFormValues({ ...formValues, popupActionUrl: e.target.value })}
                          className="w-full text-xs p-1.5 border border-emerald-300 rounded bg-white"
                          placeholder="/buy"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Click Route (Banner)</label>
                    <input
                      type="text"
                      value={formValues.linkUrl}
                      onChange={(e) => setFormValues({ ...formValues, linkUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      placeholder="/catalogue/brands or /buy"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Display Priority Order</label>
                    <input
                      type="number"
                      value={formValues.displayOrder}
                      onChange={(e) => setFormValues({ ...formValues, displayOrder: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formValues.isActive}
                    onChange={(e) => setFormValues({ ...formValues, isActive: e.target.checked })}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="isActive" className="text-xs font-medium text-slate-700">
                    Publish to customer mobile app immediately
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
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
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm"
                  >
                    {saveMutation.isPending ? 'Saving...' : 'Save Banner'}
                  </button>
                </div>
              </form>

              {/* Right Column: Interactive Live Mobile App Preview (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-3 self-start">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Live Customer Mobile App Preview</span>
                </div>

                {/* Mobile Device Frame */}
                <div className="w-full max-w-[280px] bg-black rounded-3xl p-3 border-4 border-slate-700 shadow-2xl relative">
                  {/* Speaker & camera notch */}
                  <div className="w-20 h-3.5 bg-slate-800 rounded-full mx-auto mb-3" />

                  {formValues.isPopupModal ? (
                    /* Modal Preview */
                    <div className="bg-[#121212] border border-emerald-500/40 rounded-2xl p-4 text-center shadow-xl space-y-2.5 animate-in zoom-in-95">
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                        LIVE SALE
                      </div>

                      {formValues.imageUrl ? (
                        <img
                          src={resolveImageUrl(formValues.imageUrl)}
                          alt="preview"
                          className="w-full h-24 object-cover rounded-xl border border-slate-800"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                          <Flame className="w-6 h-6 text-white" />
                        </div>
                      )}

                      <h4 className="text-sm font-black text-white leading-tight">{formValues.title}</h4>
                      <p className="text-[10px] text-slate-300 leading-normal">{formValues.subtitle}</p>

                      <button
                        type="button"
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {formValues.popupActionText || 'BUY NOW — LIVE SALE'}
                      </button>
                    </div>
                  ) : (
                    /* In-Feed Carousel Banner Preview */
                    <div
                      className="rounded-2xl p-3.5 text-white shadow-lg overflow-hidden relative"
                      style={{
                        background: formValues.imageUrl
                          ? `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.7)), url(${formValues.imageUrl}) center/cover no-repeat`
                          : `linear-gradient(135deg, ${formValues.color1}, ${formValues.color2})`,
                        minHeight: '130px',
                      }}
                    >
                      <div className="flex items-center justify-between text-[9px] mb-2">
                        <span className="px-1.5 py-0.5 rounded font-black bg-emerald-400 text-slate-950">
                          {formValues.tag}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-white/20 backdrop-blur-sm font-semibold">
                          {formValues.badge}
                        </span>
                      </div>
                      <h4 className="text-xs font-black leading-tight text-white">{formValues.title}</h4>
                      <p className="text-[10px] text-slate-200 mt-1 line-clamp-2">{formValues.subtitle}</p>
                    </div>
                  )}

                  {/* Bottom bar */}
                  <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
