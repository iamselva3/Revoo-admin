import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ShoppingBag,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Tag,
  ShieldCheck,
  BatteryCharging,
  Trash2,
  Edit,
  Upload,
  X,
  Sparkles,
  Smartphone,
  Laptop,
  Tablet,
  Tv,
  Layers,
  AlertTriangle,
  Loader2,
  Image as ImageIcon,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { RefurbishedProduct } from '../../types';

export const BuyPhonesPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStock, setSelectedStock] = useState('ALL');

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<RefurbishedProduct | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<RefurbishedProduct | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('Apple');
  const [category, setCategory] = useState('mobile');
  const [storage, setStorage] = useState('128GB');
  const [color, setColor] = useState('Natural Titanium');
  const [grade, setGrade] = useState<'PRISTINE' | 'EXCELLENT' | 'VERY_GOOD'>('PRISTINE');
  const [batteryHealth, setBatteryHealth] = useState(98);
  const [inspectionScore, setInspectionScore] = useState(99);
  const [originalPrice, setOriginalPrice] = useState(129900);
  const [salePrice, setSalePrice] = useState(69999);
  const [offerTag, setOfferTag] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState(12);
  const [imageUrl, setImageUrl] = useState('');
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(true);
  const [highlightsText, setHighlightsText] = useState(
    '32-Point Quality Verified\n12-Month REVOO Warranty\nOriginal Box & Cable Included\nFree 7-Day Replacement'
  );
  const [isCompressing, setIsCompressing] = useState(false);

  // Alert modal state
  const [modalAlert, setModalAlert] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: 'success' | 'error';
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success',
  });

  // Calculate live discount percentage
  const calculatedDiscount =
    originalPrice > 0 && salePrice > 0 && originalPrice > salePrice
      ? Math.round(((originalPrice - salePrice) / originalPrice) * 100)
      : 0;

  // Fetch all certified phones
  const { data: products = [], isLoading } = useQuery<RefurbishedProduct[]>({
    queryKey: ['admin-refurbished', selectedBrand, selectedCategory, selectedStock, searchQuery],
    queryFn: async () => {
      try {
        const res = await apiClient.get('/catalogue/admin/refurbished', {
          params: {
            brand: selectedBrand !== 'ALL' ? selectedBrand : undefined,
            category: selectedCategory !== 'ALL' ? selectedCategory : undefined,
            inStock: selectedStock !== 'ALL' ? selectedStock : undefined,
            search: searchQuery.trim() || undefined,
          },
        });
        return res.data.data;
      } catch (e) {
        // Fallback to public refurbished endpoint
        const res = await apiClient.get('/catalogue/refurbished');
        return res.data.data;
      }
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (payload: any) => {
      return (await apiClient.post('/catalogue/admin/refurbished', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refurbished'] });
      setShowModal(false);
      resetForm();
      setModalAlert({
        isOpen: true,
        title: 'Phone Listed Successfully',
        message: 'The certified device is now live in the client app Buy section with your assigned offers!',
        type: 'success',
      });
    },
    onError: (err: any) => {
      setModalAlert({
        isOpen: true,
        title: 'Failed to List Device',
        message: err.response?.data?.message || err.message || 'Server error',
        type: 'error',
      });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: any }) => {
      try {
        return (await apiClient.put(`/catalogue/admin/refurbished/${id}`, payload)).data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          // Fallback to post alias
          return (await apiClient.post(`/catalogue/admin/refurbished/${id}/update`, payload)).data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refurbished'] });
      setShowModal(false);
      setEditingProduct(null);
      resetForm();
      setModalAlert({
        isOpen: true,
        title: 'Device Updated',
        message: 'The changes and updated offers are now active in the client store.',
        type: 'success',
      });
    },
    onError: (err: any) => {
      const is404 = err.response?.status === 404;
      setModalAlert({
        isOpen: true,
        title: is404 ? 'Render Deploy Required' : 'Update Failed',
        message: is404
          ? 'The update API endpoint has been pushed to GitHub main. Please go to your Render dashboard (dashboard.render.com -> revoo-backend-ivqq) and click "Manual Deploy" -> "Deploy latest commit" to activate the new endpoints.'
          : (err.response?.data?.message || err.message || 'Server error'),
        type: 'error',
      });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      try {
        return (await apiClient.delete(`/catalogue/admin/refurbished/${id}`)).data;
      } catch (err: any) {
        if (err.response?.status === 404) {
          return (await apiClient.post(`/catalogue/admin/refurbished/${id}/delete`)).data;
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refurbished'] });
      setDeletingProduct(null);
      setModalAlert({
        isOpen: true,
        title: 'Device Removed',
        message: 'The device has been removed from the client buy store inventory.',
        type: 'success',
      });
    },
    onError: (err: any) => {
      const is404 = err.response?.status === 404;
      setModalAlert({
        isOpen: true,
        title: is404 ? 'Render Deploy Required' : 'Delete Failed',
        message: is404
          ? 'The delete API endpoint has been pushed to GitHub main. Please go to your Render dashboard (dashboard.render.com -> revoo-backend-ivqq) and click "Manual Deploy" -> "Deploy latest commit" to activate the new endpoints.'
          : (err.response?.data?.message || err.message || 'Server error'),
        type: 'error',
      });
    },
  });

  // Toggle inStock quickly
  const toggleStockMutation = useMutation({
    mutationFn: async ({ id, nextStock }: { id: string; nextStock: boolean }) => {
      return (await apiClient.put(`/catalogue/admin/refurbished/${id}`, { inStock: nextStock })).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-refurbished'] });
    },
  });

  const resetForm = () => {
    setName('');
    setBrand('Apple');
    setCategory('mobile');
    setStorage('128GB');
    setColor('Natural Titanium');
    setGrade('PRISTINE');
    setBatteryHealth(98);
    setInspectionScore(99);
    setOriginalPrice(129900);
    setSalePrice(69999);
    setOfferTag('');
    setWarrantyMonths(12);
    setImageUrl('');
    setInStock(true);
    setIsFeatured(true);
    setHighlightsText(
      '32-Point Quality Verified\n12-Month REVOO Warranty\nOriginal Box & Cable Included\nFree 7-Day Replacement'
    );
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingProduct(null);
    setShowModal(true);
  };

  const handleOpenEdit = (p: RefurbishedProduct) => {
    setEditingProduct(p);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category || 'mobile');
    setStorage(p.storage);
    setColor(p.color);
    setGrade(p.grade);
    setBatteryHealth(p.batteryHealth || 98);
    setInspectionScore(p.inspectionScore || 99);
    setOriginalPrice(p.originalPrice);
    setSalePrice(p.salePrice);
    setOfferTag(p.offerTag || '');
    setWarrantyMonths(p.warrantyMonths || 12);
    setImageUrl(p.imageUrl || '');
    setInStock(p.inStock !== false);
    setIsFeatured(p.isFeatured !== false);
    setHighlightsText((p.highlights || []).join('\n'));
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !brand.trim() || originalPrice <= 0 || salePrice <= 0) {
      setModalAlert({
        isOpen: true,
        title: 'Validation Error',
        message: 'Please provide valid phone model name, brand, original MRP, and sale price.',
        type: 'error',
      });
      return;
    }

    const highlights = highlightsText
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    const payload = {
      name: name.trim(),
      brand: brand.trim(),
      category,
      storage,
      color,
      grade,
      batteryHealth: Number(batteryHealth),
      inspectionScore: Number(inspectionScore),
      originalPrice: Number(originalPrice),
      salePrice: Number(salePrice),
      discountPercentage: calculatedDiscount,
      offerTag: offerTag.trim() || `Save ₹${(originalPrice - salePrice).toLocaleString('en-IN')}`,
      warrantyMonths: Number(warrantyMonths),
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=600',
      inStock,
      isFeatured,
      highlights: highlights.length > 0 ? highlights : ['32-Point Quality Inspected', '12-Month REVOO Warranty'],
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct._id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  // Image upload with compression
  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.72);
          setImageUrl(compressedBase64);
        }
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Brand list for quick filter & form
  const commonBrands = ['Apple', 'Samsung', 'OnePlus', 'Google', 'Vivo', 'Oppo', 'Xiaomi', 'Dell', 'HP', 'Sony'];

  // Metrics
  const totalCount = products.length;
  const inStockCount = products.filter((p) => p.inStock !== false).length;
  const outOfStockCount = totalCount - inStockCount;
  const avgDiscount =
    totalCount > 0
      ? Math.round(products.reduce((acc, p) => acc + (p.discountPercentage || 0), 0) / totalCount)
      : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-revoo-50 text-revoo-600 border border-revoo-200">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Buy Phone Store Inventory</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Client App Live Sync
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Manage certified refurbished devices available for customers to buy. Add devices, set prices, and assign special discount offers.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-revoo-600 hover:bg-revoo-700 text-white font-bold text-sm shadow-md shadow-revoo-600/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Certified Phone</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Total Listed</span>
            <Smartphone className="w-4 h-4 text-revoo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 mt-2">{totalCount}</p>
          <span className="text-xs text-slate-400 mt-1 block">In certified catalogue</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-semibold uppercase tracking-wider">
            <span>In Stock (For Sale)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 mt-2">{inStockCount}</p>
          <span className="text-xs text-emerald-600/80 mt-1 block">Visible in mobile client</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-rose-700 text-xs font-semibold uppercase tracking-wider">
            <span>Out of Stock</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-3xl font-black text-rose-600 mt-2">{outOfStockCount}</p>
          <span className="text-xs text-rose-500/80 mt-1 block">Hidden from store</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-amber-700 text-xs font-semibold uppercase tracking-wider">
            <span>Avg Customer Discount</span>
            <Tag className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-3xl font-black text-amber-600 mt-2">{avgDiscount}% OFF</p>
          <span className="text-xs text-amber-600/80 mt-1 block">Average savings vs MRP</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
          {[
            { id: 'ALL', label: 'All Devices', icon: Layers },
            { id: 'mobile', label: 'Phones', icon: Smartphone },
            { id: 'laptops', label: 'Laptops', icon: Laptop },
            { id: 'tablets', label: 'Tablets & iPads', icon: Tablet },
            { id: 'tv', label: 'Smart TVs', icon: Tv },
          ].map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search & Brand Filter Row */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by phone name, brand, or assigned offer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-revoo-600/20 focus:border-revoo-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
            >
              <option value="ALL">All Brands</option>
              {commonBrands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <select
              value={selectedStock}
              onChange={(e) => setSelectedStock(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
            >
              <option value="ALL">All Stock Status</option>
              <option value="true">In Stock Only</option>
              <option value="false">Out of Stock Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Product Grid / Cards */}
      {isLoading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin text-revoo-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500 mt-3">Loading certified store devices...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Smartphone className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800 mt-3">No Certified Devices Found</h3>
          <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto">
            {searchQuery
              ? `No devices matched "${searchQuery}". Try adjusting your filters.`
              : 'No devices have been added to the buy store yet. Click "+ Add Certified Phone" above to list your first device!'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="mt-4 px-4 py-2 rounded-xl bg-revoo-600 text-white font-bold text-xs"
          >
            Add First Phone
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {products.map((item) => {
            const isItemInStock = item.inStock !== false;
            return (
              <div
                key={item._id}
                className={`bg-white rounded-2xl border transition-all hover:shadow-md flex flex-col overflow-hidden ${
                  isItemInStock ? 'border-slate-200' : 'border-rose-200 bg-slate-50/50 opacity-80'
                }`}
              >
                {/* Card Top / Header */}
                <div className="relative p-4 pb-2 flex items-start gap-3">
                  {/* Image */}
                  <div className="w-20 h-24 rounded-xl bg-slate-100 flex-shrink-0 flex items-center justify-center overflow-hidden border border-slate-200/80">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-contain p-1"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Smartphone className="w-8 h-8 text-slate-400" />
                    )}
                  </div>

                  {/* Device Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {item.brand}
                      </span>
                      <button
                        onClick={() =>
                          toggleStockMutation.mutate({ id: item._id, nextStock: !isItemInStock })
                        }
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-colors flex items-center gap-1 ${
                          isItemInStock
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                        }`}
                        title="Click to toggle stock status"
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isItemInStock ? 'bg-emerald-500' : 'bg-rose-500'}`}
                        ></span>
                        <span>{isItemInStock ? 'In Stock' : 'Out of Stock'}</span>
                      </button>
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 mt-1 truncate" title={item.name}>
                      {item.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5 font-medium">
                      <span>{item.storage}</span>
                      <span>•</span>
                      <span>{item.color}</span>
                    </div>

                    {/* Grade & Inspection Score */}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                        {item.grade}
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                        <BatteryCharging className="w-2.5 h-2.5" />
                        {item.batteryHealth}%
                      </span>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-0.5">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {item.inspectionScore}/100
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assigned Offer Banner */}
                <div className="mx-4 my-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    <span className="text-xs font-black text-emerald-800 truncate">
                      {item.offerTag || `${item.discountPercentage}% OFF`}
                    </span>
                  </div>
                  <span className="text-[10px] font-black text-emerald-700 bg-white px-2 py-0.5 rounded-full border border-emerald-300 flex-shrink-0">
                    {item.discountPercentage}% OFF
                  </span>
                </div>

                {/* Pricing & Warranty */}
                <div className="px-4 py-2 border-t border-slate-100 flex items-center justify-between mt-auto">
                  <div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-black text-slate-900">
                        ₹{item.salePrice.toLocaleString('en-IN')}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 line-through">
                        ₹{item.originalPrice.toLocaleString('en-IN')}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium block">
                      {item.warrantyMonths}-Month REVOO Warranty
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 rounded-xl text-slate-600 hover:text-revoo-600 hover:bg-revoo-50 border border-slate-200 hover:border-revoo-300 transition-colors"
                      title="Edit phone & offers"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setDeletingProduct(item)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 transition-colors"
                      title="Delete from store"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Certified Phone Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-revoo-50 text-revoo-600 border border-revoo-200">
                  <Smartphone className="w-4 h-4" />
                </span>
                <h2 className="text-lg font-extrabold text-slate-900">
                  {editingProduct ? 'Edit Certified Phone & Offers' : 'Add New Certified Phone'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingProduct(null);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Row 1: Brand & Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="e.g. Apple, Samsung, OnePlus"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  >
                    <option value="mobile">Mobile Phones</option>
                    <option value="laptops">Laptops</option>
                    <option value="tablets">Tablets & iPads</option>
                    <option value="tv">Smart TVs</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Model Name & Storage */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Model Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. iPhone 15 Pro Max 5G"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Storage / Spec
                  </label>
                  <input
                    type="text"
                    value={storage}
                    onChange={(e) => setStorage(e.target.value)}
                    placeholder="e.g. 256GB"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>
              </div>

              {/* Row 3: Color, Grade, Battery */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Color Finish
                  </label>
                  <input
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="e.g. Natural Titanium"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Condition / Grade
                  </label>
                  <select
                    value={grade}
                    onChange={(e) => setGrade(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  >
                    <option value="PRISTINE">PRISTINE (Like New)</option>
                    <option value="EXCELLENT">EXCELLENT (Flawless)</option>
                    <option value="VERY_GOOD">VERY GOOD (Minor Signs)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Battery Health %
                  </label>
                  <input
                    type="number"
                    min="70"
                    max="100"
                    value={batteryHealth}
                    onChange={(e) => setBatteryHealth(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>
              </div>

              {/* Row 4: Pricing & Offer Assignment */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-50/60 to-teal-50/30 border border-emerald-200/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900 uppercase tracking-wider">
                  <Tag className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pricing & Offer Assignment</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Original MRP (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={originalPrice}
                      onChange={(e) => setOriginalPrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Sale Price (₹) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={salePrice}
                      onChange={(e) => setSalePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm font-bold text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Calculated Discount</label>
                    <div className="px-3 py-2 rounded-lg bg-emerald-100/60 border border-emerald-300 text-emerald-900 font-black text-sm">
                      {calculatedDiscount}% OFF
                      {originalPrice > salePrice && (
                        <span className="text-[10px] text-emerald-700 block font-bold">
                          Save ₹{(originalPrice - salePrice).toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Special Offer Tag / Campaign Badge
                  </label>
                  <input
                    type="text"
                    value={offerTag}
                    onChange={(e) => setOfferTag(e.target.value)}
                    placeholder="e.g. Save ₹59,901 • Instant ₹5,000 Bank Off • Festive Special"
                    className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    This offer text is displayed prominently on the product card and details page in the client app.
                  </span>
                </div>
              </div>

              {/* Row 5: Warranty & Inspection Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Warranty (Months)
                  </label>
                  <select
                    value={warrantyMonths}
                    onChange={(e) => setWarrantyMonths(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  >
                    <option value={12}>12 Months (1 Full Year)</option>
                    <option value={6}>6 Months Warranty</option>
                    <option value={3}>3 Months Warranty</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Inspection Score (out of 100)
                  </label>
                  <input
                    type="number"
                    min="80"
                    max="100"
                    value={inspectionScore}
                    onChange={(e) => setInspectionScore(Number(e.target.value))}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                </div>
              </div>

              {/* Row 6: Image Upload / URL */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Product Image (URL or Upload)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://... or upload image"
                    className="flex-1 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                  />
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors border border-slate-300">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                  </label>
                </div>
                {isCompressing && (
                  <span className="text-[11px] text-amber-600 mt-1 block">Compressing image client-side...</span>
                )}
                {imageUrl && (
                  <div className="mt-2 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    <img src={imageUrl} alt="preview" className="w-12 h-14 object-contain rounded-lg bg-white p-1" />
                    <span className="text-xs text-slate-500 font-medium truncate">Preview ready</span>
                  </div>
                )}
              </div>

              {/* Row 7: Highlights */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Device Highlights (One per line)
                </label>
                <textarea
                  rows={3}
                  value={highlightsText}
                  onChange={(e) => setHighlightsText(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-revoo-600/20"
                ></textarea>
              </div>

              {/* Row 8: Toggles */}
              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={(e) => setInStock(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">In Stock (Available in Client App)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 text-revoo-600 rounded focus:ring-revoo-500"
                  />
                  <span className="text-xs font-bold text-slate-800">Featured on Top</span>
                </label>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-revoo-600 hover:bg-revoo-700 text-white text-xs font-bold shadow-md shadow-revoo-600/20 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  )}
                  <span>{editingProduct ? 'Save Changes' : 'List Phone in Store'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2 rounded-xl bg-rose-50 border border-rose-200">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Remove from Store?</h3>
            </div>

            <p className="text-sm text-slate-600">
              Are you sure you want to delete{' '}
              <strong className="text-slate-900">{deletingProduct.name}</strong> from the client store inventory?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingProduct(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate(deletingProduct._id)}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center gap-1.5"
              >
                {deleteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Phone</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Alert Modal (No native alert) */}
      {modalAlert.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-xl border ${
                  modalAlert.type === 'success'
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                {modalAlert.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <XCircle className="w-5 h-5" />
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-900">{modalAlert.title}</h3>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{modalAlert.message}</p>
            <div className="flex justify-end pt-2">
              <button
                onClick={() => setModalAlert({ ...modalAlert, isOpen: false })}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

