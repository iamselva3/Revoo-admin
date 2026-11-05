import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Check, X, Smartphone, Layers, Edit2, Sparkles, Tag, CheckCircle2, XCircle, Upload } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Brand } from '../../types';

const resolveImageUrl = (url?: string): string | undefined => {
  if (!url) return undefined;
  if (url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  const backendBase = (apiClient.defaults.baseURL || '').replace(/\/api\/v1\/?$/, '');
  return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface Category {
  _id: string;
  name: string;
  slug: string;
  iconName: string;
  description?: string;
  badgeText?: string;
  displayOrder: number;
  isActive: boolean;
}

const POPULAR_ICONS = [
  { name: 'phone_android', label: 'Smartphone' },
  { name: 'tablet_mac', label: 'Tablet / iPad' },
  { name: 'laptop_mac', label: 'Laptop / MacBook' },
  { name: 'headphones', label: 'Earbuds / Audio' },
  { name: 'tv', label: 'Smart TV' },
  { name: 'kitchen', label: 'Appliances' },
  { name: 'flash_on', label: 'Flash Instant' },
  { name: 'shield_outlined', label: 'Certified Shield' },
  { name: 'watch', label: 'Smartwatch' },
];

export const BrandsPage: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'brands' | 'categories'>('brands');

  // Brand state
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [brandName, setBrandName] = useState('');
  const [brandSlug, setBrandSlug] = useState('');
  const [brandLogoUrl, setBrandLogoUrl] = useState('');
  const [brandDisplayOrder, setBrandDisplayOrder] = useState(0);

  // Category state
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    slug: '',
    iconName: 'phone_android',
    description: '',
    badgeText: '',
    displayOrder: 1,
    isActive: true,
  });

  // Queries
  const { data: brands, isLoading: brandsLoading } = useQuery<Brand[]>({
    queryKey: ['admin-brands'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/brands')).data.data,
  });

  const { data: categories, isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['admin-categories'],
    queryFn: async () => (await apiClient.get('/catalogue/admin/categories')).data.data,
  });

  // Brand Mutations
  const createBrandMutation = useMutation({
    mutationFn: async (payload: Partial<Brand>) => (await apiClient.post('/catalogue/admin/brands', payload)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
      setShowBrandModal(false);
      setBrandName('');
      setBrandSlug('');
      setBrandLogoUrl('');
    },
  });

  const toggleBrandMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) =>
      (await apiClient.put(`/catalogue/admin/brands/${id}`, { isActive })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-brands'] });
    },
  });

  // Category Mutations
  const saveCategoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      if (editingCategory) {
        return (await apiClient.put(`/catalogue/admin/categories/${editingCategory._id}`, payload)).data;
      }
      return (await apiClient.post('/catalogue/admin/categories', payload)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      setShowCategoryModal(false);
      setEditingCategory(null);
    },
  });

  const handleCreateBrand = (e: React.FormEvent) => {
    e.preventDefault();
    createBrandMutation.mutate({
      name: brandName,
      slug: brandSlug || brandName.toLowerCase().replace(/\s+/g, '-'),
      logoUrl: brandLogoUrl,
      displayOrder: brandDisplayOrder,
      isActive: true,
    });
  };

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({
      name: '',
      slug: '',
      iconName: 'phone_android',
      description: 'Instant doorstep valuation and payment',
      badgeText: '',
      displayOrder: (categories?.length || 0) + 1,
      isActive: true,
    });
    setShowCategoryModal(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCategoryForm({
      name: cat.name,
      slug: cat.slug,
      iconName: cat.iconName || 'phone_android',
      description: cat.description || '',
      badgeText: cat.badgeText || '',
      displayOrder: cat.displayOrder || 1,
      isActive: cat.isActive !== false,
    });
    setShowCategoryModal(true);
  };

  const handleSaveCategory = (e: React.FormEvent) => {
    e.preventDefault();
    saveCategoryMutation.mutate({
      ...categoryForm,
      slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'),
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Catalogue & Hardware Fleet</h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure active smartphone brands and product category icons published to the customer mobile app.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
            <button
              onClick={() => setActiveTab('brands')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'brands' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Smartphone Brands
            </button>
            <button
              onClick={() => setActiveTab('categories')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                activeTab === 'categories' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Product Categories & Icons
            </button>
          </div>

          {activeTab === 'brands' ? (
            <button
              onClick={() => setShowBrandModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Brand
            </button>
          ) : (
            <button
              onClick={handleOpenAddCategory}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Add Category
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: BRANDS */}
      {activeTab === 'brands' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brandsLoading ? (
            [...Array(4)].map((_, i) => <div key={i} className="h-32 bg-slate-200 rounded-xl animate-pulse" />)
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
                  <div className="w-12 h-12 bg-slate-50 rounded-lg border border-slate-100 p-2 flex items-center justify-center overflow-hidden">
                    {brand.logoUrl ? (
                      <img
                        src={resolveImageUrl(brand.logoUrl)}
                        alt={brand.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Smartphone className="w-6 h-6 text-slate-400" />
                    )}
                  </div>
                  <button
                    onClick={() => toggleBrandMutation.mutate({ id: brand._id, isActive: !brand.isActive })}
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full border transition ${
                      brand.isActive
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
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
      )}

      {/* TAB 2: CATEGORIES & ICONS */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Configured App Categories</h2>
              <p className="text-xs text-slate-500">Live icons and titles shown on the customer app home screen.</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {categoriesLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs">Loading categories...</div>
            ) : !categories || categories.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No categories configured.</div>
            ) : (
              categories.map((cat) => (
                <div key={cat._id} className="p-4 flex items-center justify-between hover:bg-slate-50/80 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* Icon visual container */}
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex flex-col items-center justify-center shadow-sm">
                      <span className="text-xs font-mono font-bold">{cat.iconName}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900">{cat.name}</h3>
                        {cat.badgeText && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-100 text-emerald-800">
                            {cat.badgeText}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">slug: {cat.slug}</span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{cat.description || 'No description'}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                        cat.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {cat.isActive ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {cat.isActive ? 'Active' : 'Disabled'}
                    </span>

                    <button
                      onClick={() => handleOpenEditCategory(cat)}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors"
                      title="Edit Category Icon & Details"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Edit / Add Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <form onSubmit={handleSaveCategory} className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingCategory ? 'Edit Category & Icon' : 'Add New Category'}
              </h3>
              <button type="button" onClick={() => setShowCategoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category Name</label>
                <input
                  type="text"
                  required
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  placeholder="e.g. Sell Phone"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={categoryForm.slug}
                  onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                  placeholder="e.g. mobile"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Icon Name Selection with Preset Pill Buttons */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Icon Name (Flutter Material Icon)</label>
              <input
                type="text"
                required
                value={categoryForm.iconName}
                onChange={(e) => setCategoryForm({ ...categoryForm, iconName: e.target.value })}
                placeholder="e.g. phone_android"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs font-mono mb-2"
              />
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_ICONS.map((ico) => (
                  <button
                    key={ico.name}
                    type="button"
                    onClick={() => setCategoryForm({ ...categoryForm, iconName: ico.name })}
                    className={`px-2 py-1 rounded text-[11px] font-medium border transition ${
                      categoryForm.iconName === ico.name
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {ico.label} ({ico.name})
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Subtitle</label>
              <input
                type="text"
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                placeholder="e.g. Doorstep evaluation and instant payout"
                className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pill Badge Text (Optional)</label>
                <input
                  type="text"
                  value={categoryForm.badgeText}
                  onChange={(e) => setCategoryForm({ ...categoryForm, badgeText: e.target.value })}
                  placeholder="e.g. HOT, TOP VALUE"
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Display Priority</label>
                <input
                  type="number"
                  value={categoryForm.displayOrder}
                  onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: Number(e.target.value) })}
                  className="w-full p-2.5 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="catActive"
                checked={categoryForm.isActive}
                onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <label htmlFor="catActive" className="text-xs font-medium text-slate-700">
                Active in mobile app
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCategoryModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveCategoryMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm"
              >
                {saveCategoryMutation.isPending ? 'Saving...' : 'Save Category'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Brand Add Modal */}
      {showBrandModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateBrand} className="bg-white rounded-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-900">Add New Smartphone Brand</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand Name</label>
              <input
                type="text"
                required
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="e.g. Apple, Samsung, Google"
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Slug</label>
              <input
                type="text"
                value={brandSlug}
                onChange={(e) => setBrandSlug(e.target.value)}
                placeholder="e.g. apple"
                className="w-full p-2 border border-slate-300 rounded text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Logo URL (Optional)</label>
              <input
                type="url"
                value={brandLogoUrl}
                onChange={(e) => setBrandLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Display Priority Order</label>
              <input
                type="number"
                value={brandDisplayOrder}
                onChange={(e) => setBrandDisplayOrder(Number(e.target.value))}
                className="w-full p-2 border border-slate-300 rounded text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowBrandModal(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createBrandMutation.isPending}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded"
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
