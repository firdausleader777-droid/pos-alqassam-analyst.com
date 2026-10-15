import { useState, useEffect } from 'react';
import { Product, Supplier } from '../types';
import { formatRupiah } from '../utils/storage';
import { Plus, Search, Edit2, Trash2, Camera, AlertTriangle, CheckCircle, XCircle, Filter, Sparkles } from 'lucide-react';

interface ProductManagementProps {
  products: Product[];
  suppliers: Supplier[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenScanner: (targetField: 'barcode') => void;
  scannerResult?: string | null;
  onClearScannerResult?: () => void;
}

export function ProductManagement({
  products,
  suppliers,
  onSaveProduct,
  onDeleteProduct,
  onOpenScanner,
  scannerResult,
  onClearScannerResult
}: ProductManagementProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'empty'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [form, setForm] = useState<Partial<Product>>({
    name: '',
    sku: '',
    barcode: '',
    category: 'Skincare',
    supplierId: '',
    stock: 0,
    minStock: 5,
    buy: 0,
    retail: 0,
    grosir: 0,
    grosirMin: 6
  });

  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean)));

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setForm({
      name: '',
      sku: '',
      barcode: '',
      category: categories[0] || 'Umum',
      supplierId: suppliers[0]?.id || '',
      stock: 0,
      minStock: 5,
      buy: 0,
      retail: 0,
      grosir: 0,
      grosirMin: 6
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setForm({ ...product });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name?.trim()) {
      alert('Nama produk wajib diisi.');
      return;
    }

    const updatedProduct: Product = {
      id: editingProduct ? editingProduct.id : 'P' + Date.now(),
      name: form.name.trim(),
      sku: form.sku?.trim() || 'SKU-' + Math.floor(1000 + Math.random() * 9000),
      barcode: form.barcode?.trim() || '',
      category: form.category?.trim() || 'Umum',
      supplierId: form.supplierId || '',
      stock: Number(form.stock) || 0,
      minStock: Number(form.minStock) ?? 5, // Stok Min field
      buy: Number(form.buy) || 0,
      retail: Number(form.retail) || 0,
      grosir: Number(form.grosir) || 0,
      grosirMin: Number(form.grosirMin) || 6
    };

    onSaveProduct(updatedProduct);
    setIsModalOpen(false);
  };

  // If scanner produced a result while modal is open, apply to barcode
  useEffect(() => {
    if (scannerResult && isModalOpen) {
      setForm((prev) => ({ ...prev, barcode: scannerResult }));
      onClearScannerResult?.();
    }
  }, [scannerResult, isModalOpen, onClearScannerResult]);

  // Filtered Products
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    let matchesStock = true;
    if (stockFilter === 'low') {
      matchesStock = p.stock > 0 && p.stock <= (p.minStock ?? 5);
    } else if (stockFilter === 'empty') {
      matchesStock = p.stock <= 0;
    }

    return matchesSearch && matchesCategory && matchesStock;
  });

  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= (p.minStock ?? 5)).length;
  const emptyStockCount = products.filter((p) => p.stock <= 0).length;

  return (
    <div className="space-y-5">
      {/* Top Banner Alert if low stock */}
      {(lowStockCount > 0 || emptyStockCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
              <AlertTriangle className="h-5 w-5" />
            </span>
            <div>
              <div className="text-sm font-semibold text-amber-300">
                Peringatan Stok di Bawah Stok Minimum
              </div>
              <div className="text-xs text-slate-300">
                Terdapat <b className="text-amber-400">{lowStockCount} produk menipis</b> (&le; Stok Min) dan{' '}
                <b className="text-red-400">{emptyStockCount} produk habis</b>. Pantau kolom <b>Stok Min</b> untuk menjaga ketersediaan barang.
              </div>
            </div>
          </div>
          <button
            onClick={() => setStockFilter(stockFilter === 'low' ? 'all' : 'low')}
            className="rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 transition-colors"
          >
            {stockFilter === 'low' ? 'Tampilkan Semua' : 'Filter Stok Menipis'}
          </button>
        </div>
      )}

      {/* Control Bar: Search & Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk berdasarkan nama, SKU, atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-300 focus:border-amber-400 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-sm font-bold text-slate-950 transition-all shadow-md active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      {/* Stock Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 font-medium mr-1">
          <Filter className="h-3.5 w-3.5" /> Filter Stok:
        </span>
        <button
          onClick={() => setStockFilter('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
            stockFilter === 'all'
              ? 'bg-amber-400 text-slate-950 font-bold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Semua ({products.length})
        </button>
        <button
          onClick={() => setStockFilter('low')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            stockFilter === 'low'
              ? 'bg-amber-500 text-slate-950 font-bold'
              : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
          }`}
        >
          <AlertTriangle className="h-3 w-3" />
          Menipis &le; Min ({lowStockCount})
        </button>
        <button
          onClick={() => setStockFilter('empty')}
          className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors ${
            stockFilter === 'empty'
              ? 'bg-red-500 text-white font-bold'
              : 'bg-red-500/10 text-red-300 hover:bg-red-500/20 border border-red-500/30'
          }`}
        >
          <XCircle className="h-3 w-3" />
          Habis = 0 ({emptyStockCount})
        </button>
      </div>

      {/* Products Table with Stok Min right next to Stok */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Produk</th>
                <th className="py-3 px-3 font-semibold">SKU</th>
                <th className="py-3 px-3 font-semibold">Barcode</th>
                <th className="py-3 px-3 font-semibold">Kategori</th>
                <th className="py-3 px-3 font-semibold">Supplier</th>
                
                {/* --- EXACT REQUIREMENT: KOLOM STOK MIN TEPAT DI SAMPING STOK --- */}
                <th className="py-3 px-3 font-semibold text-center bg-slate-900/60">
                  Stok
                </th>
                <th className="py-3 px-3 font-semibold text-center bg-amber-950/20 text-amber-400 border-x border-amber-500/20">
                  Stok Min
                </th>
                <th className="py-3 px-3 font-semibold text-center">Status</th>

                <th className="py-3 px-3 font-semibold text-right">Modal</th>
                <th className="py-3 px-3 font-semibold text-right">Eceran</th>
                <th className="py-3 px-3 font-semibold text-right">Grosir</th>
                <th className="py-3 px-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-slate-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const supplier = suppliers.find((s) => s.id === p.supplierId);
                  const minStk = p.minStock ?? 5;
                  const isEmpty = p.stock <= 0;
                  const isLow = !isEmpty && p.stock <= minStk;

                  return (
                    <tr key={p.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-medium text-white max-w-[200px] truncate" title={p.name}>
                        {p.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.barcode || '-'}</td>
                      <td className="py-3 px-3">
                        <span className="inline-block rounded-md bg-slate-800 px-2 py-0.5 text-[11px] text-slate-300">
                          {p.category}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-400 max-w-[120px] truncate">
                        {supplier?.name || '-'}
                      </td>

                      {/* KOLOM STOK */}
                      <td className="py-3 px-3 text-center font-bold bg-slate-900/40">
                        <span
                          className={`text-sm px-2 py-0.5 rounded-md ${
                            isEmpty
                              ? 'text-red-400 bg-red-950/40'
                              : isLow
                              ? 'text-amber-400 bg-amber-950/40'
                              : 'text-emerald-400'
                          }`}
                        >
                          {p.stock}
                        </span>
                      </td>

                      {/* KOLOM STOK MIN (TEPAT DI SAMPING STOK) */}
                      <td className="py-3 px-3 text-center font-semibold bg-amber-950/10 border-x border-amber-500/20 text-amber-300">
                        <span className="px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300">
                          {minStk}
                        </span>
                      </td>

                      {/* Status Indicator */}
                      <td className="py-3 px-3 text-center">
                        {isEmpty ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-red-400">
                            <XCircle className="h-3 w-3" /> Habis
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-amber-300">
                            <AlertTriangle className="h-3 w-3" /> Menipis
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10.5px] font-bold text-emerald-400">
                            <CheckCircle className="h-3 w-3" /> Aman
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400">{formatRupiah(p.buy)}</td>
                      <td className="py-3 px-3 text-right font-medium text-emerald-400">
                        {formatRupiah(p.retail)}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-amber-400">
                        {formatRupiah(p.grosir)}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          min. {p.grosirMin}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-amber-400 transition-colors"
                            title="Edit Produk"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Yakin ingin menghapus produk "${p.name}"?`)) {
                                onDeleteProduct(p.id);
                              }
                            }}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-colors"
                            title="Hapus Produk"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Produk */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-400" />
                {editingProduct ? 'Edit Data Produk' : 'Tambah Produk Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSave} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Nama Produk *</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Serum Whitening 30ml"
                  value={form.name || ''}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">SKU (Kode Barang)</label>
                  <input
                    type="text"
                    placeholder="SVC-30"
                    value={form.sku || ''}
                    onChange={(e) => setForm({ ...form, sku: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Kategori</label>
                  <input
                    type="text"
                    placeholder="Skincare / Makeup"
                    value={form.category || ''}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Barcode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan atau ketik nomor barcode..."
                    value={form.barcode || ''}
                    onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="flex-1 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => onOpenScanner('barcode')}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors"
                  >
                    <Camera className="h-4 w-4" />
                    Scan
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pemasok (Supplier)</label>
                <select
                  value={form.supplierId || ''}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">- Tidak Terhubung Supplier -</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* SECTION: STOK & STOK MIN (Berjejer jelas) */}
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-3.5">
                <div className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Pengaturan Stok &amp; Batas Minimum
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Stok Fisik Tersedia
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.stock ?? 0}
                      onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm font-bold text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-amber-300 mb-1">
                      Stok Min (Batas Alert) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.minStock ?? 5}
                      onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                      className="w-full rounded-xl border border-amber-500/50 bg-slate-950 px-3.5 py-2 text-sm font-bold text-amber-300 focus:border-amber-400 focus:outline-none"
                    />
                    <span className="block text-[10px] text-slate-400 mt-1">
                      Peringatan muncul jika stok &le; angka ini.
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION: HARGA */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harga Beli / Modal (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.buy ?? 0}
                    onChange={(e) => setForm({ ...form, buy: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harga Eceran (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.retail ?? 0}
                    onChange={(e) => setForm({ ...form, retail: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-emerald-400 font-semibold focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Harga Grosir (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.grosir ?? 0}
                    onChange={(e) => setForm({ ...form, grosir: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-amber-400 font-semibold focus:border-amber-400 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Min. Qty Grosir</label>
                  <input
                    type="number"
                    min="1"
                    value={form.grosirMin ?? 6}
                    onChange={(e) => setForm({ ...form, grosirMin: Number(e.target.value) })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
                >
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
