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
} from 'lucide-react';
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
  imageUrl?: string;
  isPopupModal?: boolean;
  popupActionText?: string;
  popupActionUrl?: string;
  linkUrl: string;
  isActive: boolean;
  displayOrder: number;
}

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
  const [existingPopupId, setExistingPopupId] = useState<string | null>(null);

  const { data: banners, isLoading } = useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/banners')).data.data,
  });

  // Find existing popup modal banner from banners list
  useEffect(() => {
    if (banners) {
      const activePopup = banners.find((b) => b.isPopupModal === true);
      if (activePopup) {
        setExistingPopupId(activePopup._id);
        setIsEnabled(activePopup.isActive !== false);
        setTag(activePopup.tag || 'LIVE SALE');
        setTitle(activePopup.title || 'Special Device Sale');
        setSubtitle(activePopup.subtitle || '');
        setBadge(activePopup.badge || 'Exclusive Deal');
        setPopupActionText(activePopup.popupActionText || 'BUY NOW — EXPLORE SALE');
        setPopupActionUrl(activePopup.popupActionUrl || '/buy');
        setImageUrl(activePopup.imageUrl || '');
        setColor1(activePopup.color1 || '#059669');
        setColor2(activePopup.color2 || '#022C22');
      }
    }
  }, [banners]);

  const savePopupMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (existingPopupId) {
        return (await apiClient.put(`/catalogue/admin/banners/${existingPopupId}`, payload)).data;
      } else {
        return (await apiClient.post('/catalogue/admin/banners', payload)).data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-banners'] });
      alert('Launch popup configuration saved successfully and published to the live mobile app!');
    },
    onError: (err: any) => {
      alert(`Error saving popup: ${err?.message || 'Please check backend connection.'}`);
    },
  });

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

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      tag,
      title,
      subtitle,
      badge,
      color1,
      color2,
      icon: 'local_fire_department',
      imageUrl,
      isPopupModal: true,
      popupActionText,
      popupActionUrl,
      linkUrl: popupActionUrl,
      isActive: isEnabled,
      displayOrder: 0,
    };
    savePopupMutation.mutate(payload);
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
            onClick={() => setIsEnabled(!isEnabled)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
              isEnabled
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            {isEnabled ? 'ENABLED (LIVE IN APP)' : 'DISABLED (OFF)'}
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
              {isEnabled && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping" />
                  Showing to Customers
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
                    <img src={imageUrl} alt="Poster" className="w-full h-full object-cover" />
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
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Upload Poster Image</span>
                  <input
                    type="file"
                    accept="image/*"
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
                {isEnabled ? 'Will automatically popup when customer launches the app.' : 'Popup is currently disabled.'}
              </span>

              <button
                type="submit"
                disabled={savePopupMutation.isPending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
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
            <span className="text-[10px] bg-slate-800 px-2 py-0.5 rounded text-slate-300 font-mono">
              {isEnabled ? 'Active' : 'Muted'}
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
                    <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
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
    </div>
  );
};

