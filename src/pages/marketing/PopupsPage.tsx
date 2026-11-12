import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Flame,
  Upload,
  Smartphone,
  Eye,
  CheckCircle2,
  XCircle,
  Save,
  ShoppingBag,
  Sparkles,
  Layers,
  Power,
  X,
  Loader2,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { resolveImageUrl } from '../../utils/assetUrl';

export const PopupsPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [isEnabled, setIsEnabled] = useState(false);
  const [tag, setTag] = useState('LIVE SALE');
  const [title, setTitle] = useState('Special Buyback & Certified Device Sale');
  const [subtitle, setSubtitle] = useState('Save up to 40% on pristine devices with 1-Year REVOO Warranty & zero wear deductions.');
  const [badge, setBadge] = useState('Exclusive Deal');
  const [popupActionText, setPopupActionText] = useState('BUY NOW — EXPLORE SALE');
  const [popupActionUrl, setPopupActionUrl] = useState('/buy');
  const [imageUrl, setImageUrl] = useState('');
  const [color1, setColor1] = useState('#059669');
  const [color2, setColor2] = useState('#022C22');
  const [isCompressing, setIsCompressing] = useState(false);
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  const { data: popupData, isLoading } = useQuery({
    queryKey: ['admin-popup'],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/catalogue/admin/popup');
        return res.data.data;
      } catch (e: any) {
        // Resilient fallback: read from live /catalogue/admin/banners
        try {
          const res = await apiClient.get('/catalogue/admin/banners');
          const banners = res.data.data as any[];
          const popup = banners.find((b) => b.isPopupModal === true);
          if (popup) {
            return {
              ...popup,
              isEnabled: popup.isActive !== false,
            };
          }
        } catch (_) {}
        return null;
      }
    },
  });

  useEffect(() => {
    if (popupData) {
      setIsEnabled(popupData.isEnabled === true || (popupData.isPopupModal === true && popupData.isActive !== false));
      if (popupData.tag) setTag(popupData.tag);
      if (popupData.title) setTitle(popupData.title);
      if (popupData.subtitle) setSubtitle(popupData.subtitle);
      if (popupData.badge) setBadge(popupData.badge);
      if (popupData.popupActionText) setPopupActionText(popupData.popupActionText);
      if (popupData.popupActionUrl) setPopupActionUrl(popupData.popupActionUrl);
      if (popupData.imageUrl) setImageUrl(popupData.imageUrl);
      if (popupData.color1) setColor1(popupData.color1);
      if (popupData.color2) setColor2(popupData.color2);
    }
  }, [popupData]);

  const savePopupMutation = useMutation({
    mutationFn: async (payload: any) => {
      try {
        return (await apiClient.post('/catalogue/admin/popup', payload)).data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Automatic seamless fallback to live /catalogue/admin/banners
          const bannersRes = await apiClient.get('/catalogue/admin/banners');
          const banners = bannersRes.data.data as any[];
          const existingPopup = banners.find((b) => b.isPopupModal === true);

          const bannerPayload = {
            tag: payload.tag || 'LIVE SALE',
            title: payload.title || 'Special Sale',
            subtitle: payload.subtitle || '',
            badge: payload.badge || 'Featured',
            color1: payload.color1 || '#059669',
            color2: payload.color2 || '#022C22',
            icon: 'local_fire_department',
            imageUrl: payload.imageUrl || '',
            linkUrl: payload.popupActionUrl || '/buy',
            isPopupModal: true,
            popupActionText: payload.popupActionText || 'BUY NOW',
            popupActionUrl: payload.popupActionUrl || '/buy',
            isActive: payload.isEnabled,
            displayOrder: 0,
          };

          if (existingPopup) {
            return (await apiClient.put(`/catalogue/admin/banners/${existingPopup._id}`, bannerPayload)).data;
          } else {
            return (await apiClient.post('/catalogue/admin/banners', bannerPayload)).data;
          }
        }
        throw err;
      }
    },
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['admin-popup'] });
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      setModalAlert({
        isOpen: true,
        title: 'Launch Popup Published Live',
        message: 'The promotional popup configuration has been saved and is now live on customer devices!',
        type: 'success',
      });
    },
    onError: (err: any) => {
      if (err.response?.status === 413) {
        setModalAlert({
          isOpen: true,
          title: 'Image Payload Too Large (413)',
          message: 'The chosen image exceeds the upload limit. Please choose a smaller photo or paste an image URL.',
          type: 'warning',
        });
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Error saving popup.';
      setModalAlert({
        isOpen: true,
        title: `Error Saving Popup (${err.response?.status || '500'})`,
        message: msg,
        type: 'error',
      });
    },
  });

  // Client-side image compression: converts any high-res camera photo (8MB+) to an ultra-optimized mobile web poster (~30KB)
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxDim = 600;
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
          resolve(canvas.toDataURL('image/jpeg', 0.65));
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const compressDataUrl = (dataUrl: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!dataUrl.startsWith('data:image/') || dataUrl.length < 100000) {
        return resolve(dataUrl);
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
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
        resolve(canvas.toDataURL('image/jpeg', 0.65));
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    });
  };

  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsCompressing(true);
      try {
        const compressed = await compressImage(file);
        setImageUrl(compressed);
      } catch (err) {
        setModalAlert({
          isOpen: true,
          title: 'Image Optimization Notice',
          message: 'Could not automatically optimize this image file. Please try another image.',
          type: 'warning',
        });
      } finally {
        setIsCompressing(false);
      }
    }
  };

  const handleToggleStatus = async () => {
    const nextState = !isEnabled;
    setIsEnabled(nextState);
    const optimizedImage = await compressDataUrl(imageUrl);
    savePopupMutation.mutate({
      isEnabled: nextState,
      tag,
      title,
      subtitle,
      badge,
      color1,
      color2,
      imageUrl: optimizedImage,
      popupActionText,
      popupActionUrl,
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const optimizedImage = await compressDataUrl(imageUrl);
    savePopupMutation.mutate({
      isEnabled,
      tag,
      title,
      subtitle,
      badge,
      color1,
      color2,
      imageUrl: optimizedImage,
      popupActionText,
      popupActionUrl,
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Flame className="w-7 h-7 text-amber-500 fill-amber-500" />
            App Launch Popup Modal
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dedicated control for the interactive promotional popup that appears when customers open the mobile app.
          </p>
        </div>

        {/* Master ON / OFF Toggle */}
        <div className="flex items-center gap-3 bg-white p-2.5 px-4 rounded-xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold text-slate-700">Popup Status:</span>
          <button
            type="button"
            onClick={handleToggleStatus}
            disabled={savePopupMutation.isPending}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              isEnabled
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {savePopupMutation.isPending
              ? 'SAVING...'
              : isEnabled
              ? 'ENABLED (LIVE IN APP)'
              : 'DISABLED (OFF)'}
          </button>
        </div>
      </div>

      {/* Main Grid: Form Controls (7 cols) + Live Mobile Preview (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Controls */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" /> Popup Campaign Content
              </h2>
              {isEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Showing to Customers
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
                  Muted (Not shown)
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Badge Tag</label>
                <input
                  type="text"
                  required
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  placeholder="e.g. LIVE SALE, MEGA DEAL"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sub-badge Text</label>
                <input
                  type="text"
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. 100% Certified, 1-Year Warranty"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Popup Headline / Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Festive Device Exchange Festival"
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subtitle / Offer Description</label>
              <textarea
                required
                rows={3}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Get up to 40% OFF refurbished iPhones, zero deductions for normal wear & free doorstep pickup."
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Poster Image Upload & Preview */}
            <div className="space-y-2 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <label className="block text-xs font-bold text-slate-800">Campaign Poster / Banner Image</label>

              {imageUrl && (
                <div className="flex items-center gap-3 p-2 bg-white border border-slate-200 rounded-lg">
                  <div className="w-16 h-12 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    <img src={resolveImageUrl(imageUrl)} alt="Poster" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-xs text-slate-800 font-semibold block truncate">Custom Poster Loaded</span>
                    <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Ready for mobile display
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
                <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 shadow-sm transition">
                  {isCompressing ? (
                    <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>{isCompressing ? 'Optimizing Image...' : 'Upload Poster Image'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    disabled={isCompressing}
                    className="hidden"
                    onChange={handleImageFileUpload}
                  />
                </label>
                <span className="text-xs text-slate-400">or paste image link below</span>
              </div>

              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... or upload file above"
                className="w-full text-xs p-2 border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Primary CTA Button Label</label>
                <input
                  type="text"
                  required
                  value={popupActionText}
                  onChange={(e) => setPopupActionText(e.target.value)}
                  placeholder="e.g. BUY NOW — EXPLORE SALE"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Destination Route</label>
                <input
                  type="text"
                  required
                  value={popupActionUrl}
                  onChange={(e) => setPopupActionUrl(e.target.value)}
                  placeholder="e.g. /buy or /catalogue/brands"
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-lg font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {isEnabled ? 'Popup is ENABLED for customers.' : 'Popup is DISABLED.'}
              </span>

              <button
                type="submit"
                disabled={savePopupMutation.isPending || isCompressing}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {savePopupMutation.isPending ? 'Saving to Cloud...' : 'Save & Publish to App'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Interactive Live Mobile Preview */}
        <div className="lg:col-span-5 bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col items-center">
          <div className="flex items-center justify-between w-full text-xs text-slate-400 font-semibold mb-4 px-1">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <Smartphone className="w-4 h-4" /> Live Customer Screen Preview
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                isEnabled ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {isEnabled ? 'LIVE' : 'MUTED'}
            </span>
          </div>

          {/* Smartphone Mockup */}
          <div className="w-full max-w-[300px] bg-black rounded-[36px] p-3.5 border-4 border-slate-700 shadow-2xl relative min-h-[520px] flex flex-col justify-between">
            {/* Speaker notch */}
            <div className="w-24 h-4 bg-slate-800 rounded-full mx-auto mb-3" />

            {/* Dimmed App Background behind modal */}
            <div className="absolute inset-0 top-10 bottom-6 bg-black/75 rounded-3xl backdrop-blur-sm z-10 flex items-center justify-center p-3">
              {/* The Modal Dialog */}
              <div className="bg-[#121212] border border-emerald-500/40 rounded-2xl p-4 w-full text-center shadow-2xl space-y-3 relative">
                {/* Header tag and X button */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 text-[9px] font-black">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                    {tag}
                  </span>
                  <div className="p-1 rounded-full bg-slate-800 text-slate-400">
                    <X className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Poster Image or Fire icon */}
                {imageUrl ? (
                  <div className="w-full h-28 rounded-xl overflow-hidden border border-slate-800">
                    <img src={resolveImageUrl(imageUrl)} alt="preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-600 to-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/30">
                    <Flame className="w-7 h-7 text-white fill-white" />
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-black text-white leading-tight">{title}</h3>
                  <p className="text-[11px] text-slate-300 leading-snug mt-1.5 line-clamp-3">{subtitle}</p>
                </div>

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/30"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" />
                    {popupActionText}
                  </button>
                  <span className="block text-[10px] text-slate-500 font-medium">Maybe Later</span>
                </div>
              </div>
            </div>

            {/* Bottom Home Indicator */}
            <div className="w-24 h-1 bg-slate-700 rounded-full mx-auto mt-auto mb-1 z-20" />
          </div>

          <p className="text-[11px] text-slate-500 mt-4 text-center">
            This live preview renders the exact dimensions, colors, and layout that mobile users see on app open.
          </p>
        </div>
      </div>

      {/* In-App Aesthetic Alert Modal (Replaces browser window.alert) */}
      {modalAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center">
              {modalAlert.type === 'success' && (
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              )}
              {modalAlert.type === 'warning' && (
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
              )}
              {modalAlert.type === 'error' && (
                <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                  <XCircle className="w-6 h-6" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{modalAlert.title}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{modalAlert.message}</p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setModalAlert((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
