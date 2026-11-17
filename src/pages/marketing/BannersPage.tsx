import React, { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, CheckCircle2, XCircle, Smartphone, Flame, ShoppingBag, Upload, X, Loader2, ImagePlus, AlertCircle } from 'lucide-react';
import { apiClient } from '../../api/client';
import { resolveImageUrl } from '../../utils/assetUrl';
import { uploadImageFile } from '../../utils/uploadImage';

interface Banner {
  _id: string;
  /** Text is optional: a banner can be just a photo (a poster with its own text) */
  tag?: string;
  title?: string;
  subtitle?: string;
  badge?: string;
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

const EMPTY_BANNER_MESSAGE = 'Add a banner photo, or a title for a text banner.';

/** Banner photos are wide, the same shape in the app and on the website */
const PHOTO_HINT = 'JPEG, PNG or WebP · best size 1200 × 520 px (wide, about 7 : 3)';

const gradient = (c1?: string, c2?: string) => `linear-gradient(135deg, ${c1 || '#059669'}, ${c2 || '#022C22'})`;

/** What the app and the website show for a banner: the photo on its own, or the colours and text. */
const BannerVisual: React.FC<{ banner: Partial<Banner>; size?: 'sm' | 'md' }> = ({ banner: b, size = 'md' }) => {
  if (b.imageUrl) {
    return (
      <img
        src={resolveImageUrl(b.imageUrl)}
        alt={b.title || 'Banner photo'}
        className="w-full aspect-[7/3] object-cover bg-slate-100"
      />
    );
  }
  const small = size === 'sm';
  return (
    <div className={`w-full aspect-[7/3] flex flex-col justify-center text-white ${small ? 'p-3' : 'p-5'}`} style={{ background: gradient(b.color1, b.color2) }}>
      {(b.tag || b.badge) && (
        <div className={`flex items-center justify-between gap-2 ${small ? 'text-[9px] mb-1.5' : 'text-[10px] mb-2'}`}>
          {b.tag ? <span className="px-1.5 py-0.5 rounded font-black bg-emerald-400 text-slate-950">{b.tag}</span> : <span />}
          {b.badge && <span className="px-1.5 py-0.5 rounded-full bg-white/20 font-semibold">{b.badge}</span>}
        </div>
      )}
      {b.title ? (
        <h4 className={`font-black leading-tight line-clamp-2 ${small ? 'text-xs' : 'text-lg'}`}>{b.title}</h4>
      ) : (
        <h4 className={`italic text-white/60 ${small ? 'text-[10px]' : 'text-sm'}`}>Add a photo, or a title</h4>
      )}
      {b.subtitle && <p className={`text-slate-200 mt-1 line-clamp-2 ${small ? 'text-[10px]' : 'text-xs'}`}>{b.subtitle}</p>}
    </div>
  );
};

export const BannersPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const blankForm = (order = 1) => ({
    tag: '',
    title: '',
    subtitle: '',
    badge: '',
    color1: '#059669',
    color2: '#022C22',
    icon: 'flash_on',
    imageUrl: '',
    isPopupModal: false,
    popupActionText: 'BUY NOW — LIVE SALE',
    popupActionUrl: '/buy',
    linkUrl: '/catalogue/brands',
    isActive: true,
    displayOrder: order,
  });
  const [formValues, setFormValues] = useState(blankForm());

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
    onError: (err: any) => {
      setFormError(err?.response?.data?.message || 'The banner could not be saved. Please try again.');
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

  // A photo dropped just outside the drop area must not open in the tab (and lose the form)
  useEffect(() => {
    if (!isModalOpen) return;
    const stop = (e: DragEvent) => e.preventDefault();
    window.addEventListener('dragover', stop);
    window.addEventListener('drop', stop);
    return () => {
      window.removeEventListener('dragover', stop);
      window.removeEventListener('drop', stop);
    };
  }, [isModalOpen]);

  const openModal = () => {
    setFormError(null);
    setDragOver(false);
    setIsModalOpen(true);
  };

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormValues(blankForm((banners?.length || 0) + 1));
    openModal();
  };

  const handleOpenEdit = (banner: Banner) => {
    setEditingBanner(banner);
    setFormValues({
      tag: banner.tag || '',
      title: banner.title || '',
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
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
    openModal();
  };

  // Banner photos go straight to the image store (Cloudflare R2); the banner only keeps the URL
  const uploadBannerFile = async (file?: File | null) => {
    if (!file) return;
    setFormError(null);
    if (!file.type.startsWith('image/')) {
      setFormError('Please choose an image file (JPEG, PNG or WebP).');
      return;
    }
    setUploading(true);
    try {
      const url = await uploadImageFile(file, 'banners', { name: formValues.title || 'banner', maxDim: 1600 });
      setFormValues((prev) => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      setFormError(err?.message || 'Banner photo upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handlePickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    uploadBannerFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (!uploading) uploadBannerFile(e.dataTransfer.files?.[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!formValues.imageUrl.trim() && !formValues.title.trim()) {
      setFormError(EMPTY_BANNER_MESSAGE);
      return;
    }
    saveMutation.mutate(formValues);
  };

  const hasPhoto = Boolean(formValues.imageUrl.trim());

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Promotional Banners & Popups</h1>
          <p className="text-sm text-slate-500 mt-1">
            Banners show at the top of the home screen in the mobile app and on the website (genietn.in), above the main
            section. Upload a photo, or write a text banner.
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
              {/* Banner as customers see it */}
              <div className="relative">
                <BannerVisual banner={b} />
                {b.isPopupModal && (
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full font-bold text-[10px] bg-red-500 text-white flex items-center gap-1 shadow-sm">
                    <Flame className="w-3 h-3" /> Live Sale Modal
                  </span>
                )}
              </div>

              <div className="px-3 pt-2 flex items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="truncate">
                  {b.title || (b.imageUrl ? 'Photo banner' : 'Untitled')} · opens {b.linkUrl || '/catalogue/brands'}
                </span>
                <span className="shrink-0">Order {b.displayOrder}</span>
              </div>

              {/* Card Footer Controls */}
              <div className="p-3 mt-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  {b.isActive ? (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Live on app & website
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

      {/* Edit / Add Modal with Live Preview */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-center items-start sm:items-center bg-black/60 p-3 sm:p-6 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-slate-200 my-auto max-h-[92vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0 bg-white sticky top-0 z-10">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  {editingBanner ? 'Edit Promotional Banner / Popup' : 'Create New Promotional Banner'}
                </h2>
                <p className="text-xs text-slate-500">Drop in a photo, or write a text banner. The preview shows what customers see.</p>
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
                  {/* Banner photo: drag & drop or click */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-slate-700">Banner Photo / Poster</label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        if (!dragOver) setDragOver(true);
                      }}
                      onDragLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragOver(false);
                      }}
                      onDrop={handleDrop}
                      className={`relative rounded-xl border-2 border-dashed transition-colors ${
                        dragOver ? 'border-emerald-500 bg-emerald-50' : 'border-slate-300 bg-slate-50 hover:border-emerald-400'
                      }`}
                    >
                      {hasPhoto ? (
                        <div className="p-2 space-y-2">
                          <div className="rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img src={resolveImageUrl(formValues.imageUrl)} alt="Banner photo" className="w-full aspect-[7/3] object-cover" />
                          </div>
                          <div className="flex items-center justify-between gap-2 px-1">
                            <span className="text-[11px] text-slate-500">Drop another photo here to replace it</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <label className="cursor-pointer inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition">
                                <Upload className="w-3.5 h-3.5" /> Replace
                                <input type="file" accept="image/*" className="hidden" onChange={handlePickFile} disabled={uploading} />
                              </label>
                              <button
                                type="button"
                                onClick={() => setFormValues({ ...formValues, imageUrl: '' })}
                                className="px-2.5 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 font-semibold rounded-lg"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-7 text-center cursor-pointer">
                          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white border border-slate-200 text-emerald-600">
                            <ImagePlus className="w-5 h-5" />
                          </span>
                          <span className="text-xs font-semibold text-slate-800">
                            {dragOver ? 'Drop the photo to upload it' : 'Drag a photo here, or click to upload'}
                          </span>
                          <span className="text-[11px] text-slate-500">{PHOTO_HINT}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={handlePickFile} disabled={uploading} />
                        </label>
                      )}
                      {uploading && (
                        <div className="absolute inset-0 flex items-center justify-center gap-2 rounded-xl bg-white/85 text-xs font-semibold text-slate-700">
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" /> Uploading photo…
                        </div>
                      )}
                    </div>
                    <input
                      type="url"
                      value={formValues.imageUrl}
                      onChange={(e) => setFormValues({ ...formValues, imageUrl: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      placeholder="or paste an image link (https://…)"
                    />
                  </div>

                  {/* Text: optional */}
                  <div className="pt-1">
                    <p className="text-xs font-semibold text-slate-700">
                      Text <span className="font-normal text-slate-400">(optional)</span>
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {hasPhoto && !formValues.isPopupModal
                        ? 'With a photo, the app and website show just the photo, so you can leave these empty.'
                        : 'No photo? Write at least a title; it is shown on your colours below.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Pill Tag</label>
                      <input
                        type="text"
                        value={formValues.tag}
                        onChange={(e) => setFormValues({ ...formValues, tag: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        placeholder="e.g. HOT DEAL"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={formValues.badge}
                        onChange={(e) => setFormValues({ ...formValues, badge: e.target.value })}
                        className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                        placeholder="e.g. Limited Time"
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
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Promo Details</label>
                    <textarea
                      value={formValues.subtitle}
                      onChange={(e) => setFormValues({ ...formValues, subtitle: e.target.value })}
                      className="w-full text-xs p-2.5 border border-slate-300 rounded-lg"
                      rows={2}
                      placeholder="e.g. Instant ₹1,500 extra valuation on exchange"
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
                    <p className="text-[10px] text-slate-400 mt-1">/catalogue/brands opens Sell, /buy opens Buy (app and website)</p>
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
                    Show in the app and on the website now
                  </label>
                </div>

                {formError && (
                  <p className="flex items-start gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs font-medium text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-px" /> {formError}
                  </p>
                )}

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
                    disabled={saveMutation.isPending || uploading}
                    className="px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg hover:bg-emerald-700 disabled:opacity-60 transition-colors shadow-sm"
                  >
                    {saveMutation.isPending ? 'Saving...' : uploading ? 'Uploading photo…' : 'Save Banner'}
                  </button>
                </div>
              </form>

              {/* Right Column: Live Preview (5 cols) */}
              <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-800">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-semibold mb-3 self-start">
                  <Smartphone className="w-4 h-4 text-emerald-400" />
                  <span>Live preview (app and website)</span>
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

                      {formValues.title && <h4 className="text-sm font-black text-white leading-tight">{formValues.title}</h4>}
                      {formValues.subtitle && <p className="text-[10px] text-slate-300 leading-normal">{formValues.subtitle}</p>}

                      <button
                        type="button"
                        className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {formValues.popupActionText || 'BUY NOW — LIVE SALE'}
                      </button>
                    </div>
                  ) : (
                    /* Home-screen banner, exactly as it is shown */
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                      <BannerVisual banner={formValues} size="sm" />
                    </div>
                  )}

                  {/* Bottom bar */}
                  <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-4" />
                </div>
                {!formValues.isPopupModal && (
                  <p className="text-[11px] text-slate-400 mt-3 text-center max-w-[280px]">
                    {hasPhoto
                      ? 'Photo banners are shown as they are. Put any text you need on the photo itself.'
                      : 'Text banner: your colours with the tag, title and subtitle.'}
                  </p>
                )}
              </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
