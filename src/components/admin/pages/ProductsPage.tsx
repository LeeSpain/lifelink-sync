import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Package, Plus, Edit, Trash2, RefreshCw, Search, ToggleLeft, ToggleRight,
  AlertTriangle, ShoppingCart, DollarSign, Archive, Check, X, ChevronDown, ChevronUp, ExternalLink,
} from 'lucide-react';

interface Product {
  id: string; name: string; price: number; currency: string;
  description?: string; short_description?: string; features: string[];
  images: any[]; image_url?: string; category_id?: string;
  sku?: string; inventory_count: number; low_stock_threshold: number;
  weight?: number; dimensions?: any; status: string;
  is_featured: boolean; warranty_months: number;
  stripe_product_id?: string; stripe_price_id?: string;
  units_sold: number; notes?: string; sort_order: number;
  created_at: string; updated_at: string;
  category?: { name: string } | null;
}

interface ProductCategory { id: string; name: string; description?: string; icon_name?: string; status: string }

const fmt = (n: number) => new Intl.NumberFormat('en', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 }).format(n);

// ─── Product Modal ───
function ProductModal({ product, categories, onClose, onSaved }: {
  product?: Product | null; categories: ProductCategory[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: product?.name || '', price: product?.price || 49.99, currency: product?.currency || 'EUR',
    short_description: product?.short_description || '', description: product?.description || '',
    sku: product?.sku || '', inventory_count: product?.inventory_count || 0,
    low_stock_threshold: product?.low_stock_threshold || 5, weight: product?.weight || 0,
    warranty_months: product?.warranty_months || 24, category_id: product?.category_id || '',
    status: product?.status || 'active', is_featured: product?.is_featured || false,
    stripe_product_id: product?.stripe_product_id || '', stripe_price_id: product?.stripe_price_id || '',
    image_url: product?.image_url || '', notes: product?.notes || '', features: product?.features || [],
  });
  const [newFeature, setNewFeature] = useState('');
  const [saving, setSaving] = useState(false);

  const addFeature = () => { if (!newFeature.trim()) return; setForm(f => ({ ...f, features: [...f.features, newFeature.trim()] })); setNewFeature(''); };
  const removeFeature = (i: number) => { setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) })); };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name, price: Number(form.price), currency: form.currency,
        short_description: form.short_description || null, description: form.description || null,
        sku: form.sku || null, inventory_count: Number(form.inventory_count),
        low_stock_threshold: Number(form.low_stock_threshold), weight: form.weight ? Number(form.weight) : null,
        warranty_months: Number(form.warranty_months), category_id: form.category_id || null,
        status: form.status, is_featured: form.is_featured, features: form.features,
        stripe_product_id: form.stripe_product_id || null, stripe_price_id: form.stripe_price_id || null,
        image_url: form.image_url || null, notes: form.notes || null,
        updated_at: new Date().toISOString(),
      };
      if (product?.id) {
        const { error } = await supabase.from('products').update(payload).eq('id', product.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('products').insert({ ...payload, created_at: new Date().toISOString() });
        if (error) throw error;
      }
      onSaved(); onClose();
    } catch (err: any) { alert('Failed: ' + err.message); } finally { setSaving(false); }
  };

  const field = (label: string, children: React.ReactNode, span?: number) => (
    <div className={span ? `col-span-${span}` : ''}>
      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">{label}</label>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-bold text-gray-900">{product ? 'Edit product' : 'Add product'}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400">X</button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">{field('Product name *', <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. LifeLink Sync SOS Pendant" />)}</div>
            {field('Price (EUR) *', <Input type="number" step="0.01" value={form.price} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) }))} />)}
            {field('SKU', <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="LLS-PENDANT-001" />)}
            {field('Category', <select value={form.category_id} onChange={e => setForm(f => ({ ...f, category_id: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white"><option value="">No category</option>{categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>)}
            {field('Status', <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm bg-white"><option value="active">Active</option><option value="inactive">Inactive</option><option value="out_of_stock">Out of stock</option></select>)}
          </div>
          {field('Short description', <Input value={form.short_description} onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))} placeholder="One-line summary" />)}
          {field('Full description', <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20" />)}

          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Features</label>
            <div className="space-y-1.5 mb-2">
              {form.features.map((f, i) => (
                <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                  <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" /><span className="text-sm text-gray-700 flex-1">{f}</span>
                  <button onClick={() => removeFeature(i)} className="w-5 h-5 rounded hover:bg-gray-200 flex items-center justify-center"><X className="w-3 h-3 text-gray-400" /></button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={newFeature} onChange={e => setNewFeature(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }} placeholder="Add a feature..." className="flex-1" />
              <Button variant="outline" onClick={addFeature} className="text-xs px-3">Add</Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {field('Stock', <Input type="number" value={form.inventory_count} onChange={e => setForm(f => ({ ...f, inventory_count: parseInt(e.target.value) }))} min="0" />)}
            {field('Low stock at', <Input type="number" value={form.low_stock_threshold} onChange={e => setForm(f => ({ ...f, low_stock_threshold: parseInt(e.target.value) }))} min="0" />)}
            {field('Weight (g)', <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: parseFloat(e.target.value) }))} />)}
            {field('Warranty (mo)', <Input type="number" value={form.warranty_months} onChange={e => setForm(f => ({ ...f, warranty_months: parseInt(e.target.value) }))} />)}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {field('Stripe product ID', <Input value={form.stripe_product_id} onChange={e => setForm(f => ({ ...f, stripe_product_id: e.target.value }))} placeholder="prod_..." className="font-mono text-xs" />)}
            {field('Stripe price ID', <Input value={form.stripe_price_id} onChange={e => setForm(f => ({ ...f, stripe_price_id: e.target.value }))} placeholder="price_..." className="font-mono text-xs" />)}
          </div>

          {field('Image URL', <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." type="url" />)}

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.is_featured} onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))} className="w-4 h-4 accent-red-500" />
            <span className="text-sm text-gray-700">Featured product</span>
          </label>

          {field('Internal notes', <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20" placeholder="Admin-only notes..." />)}
        </div>
        <div className="p-6 border-t border-gray-100 flex gap-3 sticky bottom-0 bg-white">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button onClick={save} disabled={saving} className="flex-1 bg-red-500 hover:bg-red-600 text-white">{saving ? 'Saving...' : product ? 'Save changes' : 'Add product'}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ───
function ProductCard({ product, onEdit, onToggle, onDelete, onAdjust }: {
  product: Product; onEdit: (p: Product) => void; onToggle: (p: Product) => void;
  onDelete: (id: string, name: string) => void; onAdjust: (p: Product, d: number) => void;
}) {
  const [showFeatures, setShowFeatures] = useState(false);
  const isLow = product.inventory_count > 0 && product.inventory_count <= (product.low_stock_threshold || 5);
  const isOut = product.inventory_count === 0;

  return (
    <div className={`bg-white border rounded-2xl overflow-hidden hover:shadow-md transition-all ${product.is_featured ? 'border-red-200 ring-1 ring-red-100' : isLow || isOut ? 'border-amber-300' : 'border-gray-200'}`}>
      {/* Image area */}
      <div className="h-40 bg-gradient-to-br from-gray-50 to-gray-100 relative flex items-center justify-center">
        {product.image_url ? <img src={product.image_url} alt={product.name} className="h-full w-full object-contain p-4" /> : <Package className="w-16 h-16 text-gray-200" />}
        <div className="absolute top-3 left-3 flex flex-col gap-1">
          {product.is_featured && <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-medium">Featured</span>}
          {isOut && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-medium border border-red-200">Out of stock</span>}
          {isLow && !isOut && <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-200">Low stock</span>}
        </div>
        <button onClick={() => onToggle(product)} className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-white/90 shadow flex items-center justify-center hover:bg-white">
          {product.status === 'active' ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4 text-gray-400" />}
        </button>
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm leading-tight">{product.name}</p>
            {product.short_description && <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{product.short_description}</p>}
          </div>
          <p className="text-lg font-bold text-gray-900 ml-2 flex-shrink-0">{fmt(product.price)}</p>
        </div>

        {product.sku && <p className="text-xs font-mono text-gray-400 mb-3">SKU: {product.sku}</p>}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div className="text-center bg-gray-50 rounded-xl py-2">
            <p className={`text-base font-bold ${isOut ? 'text-red-600' : isLow ? 'text-amber-600' : 'text-gray-900'}`}>{product.inventory_count}</p>
            <p className="text-xs text-gray-400">In stock</p>
          </div>
          <div className="text-center bg-gray-50 rounded-xl py-2">
            <p className="text-base font-bold text-gray-900">{product.units_sold || 0}</p>
            <p className="text-xs text-gray-400">Sold</p>
          </div>
        </div>

        {/* Stock adjust */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs text-gray-500 flex-1">Adjust stock:</span>
          <div className="flex items-center gap-1">
            <button onClick={() => onAdjust(product, -1)} className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold text-sm">-</button>
            <span className="w-10 text-center text-sm font-bold text-gray-900">{product.inventory_count}</span>
            <button onClick={() => onAdjust(product, +1)} className="w-7 h-7 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 font-bold text-sm">+</button>
          </div>
        </div>

        {/* Features toggle */}
        {product.features?.length > 0 && (
          <>
            <button onClick={() => setShowFeatures(!showFeatures)} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 mb-2 w-full">
              {showFeatures ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {showFeatures ? 'Hide' : 'Show'} {product.features.length} features
            </button>
            {showFeatures && (
              <div className="mb-3 space-y-1">
                {product.features.map((f, i) => <div key={i} className="flex items-start gap-1.5 text-xs text-gray-600"><Check className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />{f}</div>)}
              </div>
            )}
          </>
        )}

        {/* Info */}
        <div className="space-y-1 mb-4">
          {product.warranty_months > 0 && <p className="text-xs text-gray-400">{product.warranty_months}mo warranty</p>}
          {product.stripe_product_id && (
            <a href={`https://dashboard.stripe.com/products/${product.stripe_product_id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 flex items-center gap-1 hover:text-blue-800">
              <ExternalLink className="w-3 h-3" /> View in Stripe
            </a>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onEdit(product)} className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            <Edit className="w-3.5 h-3.5" /> Edit
          </button>
          <button onClick={() => onDelete(product.id, product.name)} className="w-9 h-9 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center hover:bg-red-100 flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5 text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
const ProductsPage: React.FC = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [stats, setStats] = useState({ total: 0, active: 0, stock: 0, lowStock: 0, sold: 0, revenue: 0 });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodsRes, catsRes, ordersRes] = await Promise.all([
        supabase.from('products').select('*, category:product_categories(name)').order('sort_order', { ascending: true }),
        supabase.from('product_categories').select('*').eq('status', 'active').order('sort_order'),
        supabase.from('orders').select('product_id, total_price, status').eq('status', 'completed').not('product_id', 'is', null),
      ]);

      const prods = (prodsRes.data || []) as unknown as Product[];
      setProducts(prods);
      setCategories((catsRes.data || []) as ProductCategory[]);

      const totalSold = prods.reduce((s, p) => s + (p.units_sold || 0), 0);
      const orderRevenue = (ordersRes.data || []).reduce((s: number, o: any) => s + (o.total_price || 0), 0);
      const lowStock = prods.filter(p => p.inventory_count >= 0 && p.inventory_count <= (p.low_stock_threshold || 5)).length;

      setStats({
        total: prods.length,
        active: prods.filter(p => p.status === 'active').length,
        stock: prods.reduce((s, p) => s + (p.inventory_count || 0), 0),
        lowStock,
        sold: totalSold,
        revenue: orderRevenue,
      });
    } catch { toast({ title: 'Failed to load products', variant: 'destructive' }); } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleToggle = async (p: Product) => {
    const ns = p.status === 'active' ? 'inactive' : 'active';
    await supabase.from('products').update({ status: ns }).eq('id', p.id);
    toast({ title: `${p.name} ${ns}` }); loadData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? Cannot be undone.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) toast({ title: 'Delete failed: ' + error.message, variant: 'destructive' });
    else { toast({ title: `${name} deleted` }); loadData(); }
  };

  const handleAdjust = async (p: Product, delta: number) => {
    const nc = Math.max(0, p.inventory_count + delta);
    await supabase.from('products').update({ inventory_count: nc, status: nc === 0 ? 'out_of_stock' : p.status === 'out_of_stock' ? 'active' : p.status }).eq('id', p.id);
    loadData();
  };

  const filtered = products.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) { const s = search.toLowerCase(); return p.name?.toLowerCase().includes(s) || p.sku?.toLowerCase().includes(s) || p.short_description?.toLowerCase().includes(s); }
    return true;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Management</h1>
          <p className="text-gray-400 text-sm mt-0.5">SOS pendant and safety products</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setEditProduct(null); setShowModal(true); }} className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white text-sm">
            <Plus className="w-4 h-4" /> Add product
          </Button>
          <Button onClick={loadData} variant="outline" className="flex items-center gap-2 text-sm">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Low stock alert */}
      {stats.lowStock > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-2xl px-5 py-3.5 mb-6">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800"><strong>{stats.lowStock} product{stats.lowStock !== 1 ? 's' : ''}</strong> running low or out of stock</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: 'Products', value: stats.total, Icon: Package, color: 'blue' },
          { label: 'Active', value: stats.active, Icon: ToggleRight, color: 'green' },
          { label: 'Total stock', value: stats.stock, Icon: Archive, color: 'purple' },
          { label: 'Low/out', value: stats.lowStock, Icon: AlertTriangle, color: stats.lowStock > 0 ? 'amber' : 'gray', highlight: stats.lowStock > 0 },
          { label: 'Units sold', value: stats.sold, Icon: ShoppingCart, color: 'blue' },
          { label: 'Revenue', value: fmt(stats.revenue), Icon: DollarSign, color: 'green' },
        ].map(s => (
          <Card key={s.label} className={(s as any).highlight ? 'border-amber-300 ring-1 ring-amber-200' : ''}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 flex items-center justify-center`}>
                  <s.Icon className={`w-5 h-5 text-${s.color}-500`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-gray-900">{loading ? '—' : s.value}</p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..."
            className="w-full h-9 pl-8 pr-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20" />
        </div>
        {['all', 'active', 'inactive', 'out_of_stock'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors capitalize ${statusFilter === s ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}>
            {s.replace('_', ' ')}
          </button>
        ))}
        <span className="text-xs text-gray-400 ml-auto">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-80 bg-gray-50 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">{search || statusFilter !== 'all' ? 'No products match filters' : 'No products yet'}</p>
          <button onClick={() => { setEditProduct(null); setShowModal(true); }} className="mt-4 px-4 py-2 bg-red-500 text-white rounded-xl text-sm font-medium hover:bg-red-600">Add first product</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onEdit={pr => { setEditProduct(pr); setShowModal(true); }} onToggle={handleToggle} onDelete={handleDelete} onAdjust={handleAdjust} />
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && <ProductModal product={editProduct} categories={categories} onClose={() => { setShowModal(false); setEditProduct(null); }} onSaved={loadData} />}
    </div>
  );
};

export default ProductsPage;
