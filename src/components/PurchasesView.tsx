import { useState, useEffect } from 'react';
import { Product, Purchase, PurchaseItem, Supplier } from '../types';
import { formatRupiah } from '../utils/storage';
import { Plus, Trash2, ShoppingCart, Search, Camera } from 'lucide-react';

interface PurchasesViewProps {
  purchases: Purchase[];
  products: Product[];
  suppliers: Supplier[];
  onSavePurchase: (purchase: Purchase, updatedProducts: Product[]) => void;
  onDeletePurchase: (id: string) => void;
  onOpenScanner: () => void;
  scannerResult?: string | null;
  onClearScannerResult?: () => void;
}

export function PurchasesView({
  purchases,
  products,
  suppliers,
  onSavePurchase,
  onDeletePurchase,
  onOpenScanner,
  scannerResult,
  onClearScannerResult
}: PurchasesViewProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [note, setNote] = useState('');

  const totalAllPurchases = purchases.reduce((sum, p) => sum + p.total, 0);

  const handleAddItem = (prod: Product) => {
    setPurchaseItems((prev) => {
      const existing = prev.find((item) => item.productId === prod.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === prod.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          productId: prod.id,
          name: prod.name,
          qty: 1,
          buy: prod.buy
        }
      ];
    });
  };

  const handleQtyChange = (productId: string, delta: number) => {
    setPurchaseItems((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const n = item.qty + delta;
            return n > 0 ? { ...item, qty: n } : null;
          }
          return item;
        })
        .filter(Boolean) as PurchaseItem[]
    );
  };

  const handleBuyPriceChange = (productId: string, price: number) => {
    setPurchaseItems((prev) =>
      prev.map((item) => (item.productId === productId ? { ...item, buy: price } : item))
    );
  };

  const handleSavePurchase = () => {
    if (purchaseItems.length === 0) {
      alert('Pilih minimal 1 produk untuk pembelian.');
      return;
    }

    const total = purchaseItems.reduce((sum, item) => sum + item.buy * item.qty, 0);

    // Update stock & buy price in products list
    const updatedProducts = products.map((p) => {
      const line = purchaseItems.find((item) => item.productId === p.id);
      if (line) {
        return {
          ...p,
          stock: p.stock + line.qty,
          buy: line.buy > 0 ? line.buy : p.buy
        };
      }
      return p;
    });

    const newPurchase: Purchase = {
      id: 'PB' + Date.now(),
      date: new Date().toISOString(),
      supplierId: selectedSupplier,
      items: purchaseItems,
      total,
      note
    };

    onSavePurchase(newPurchase, updatedProducts);
    setIsModalOpen(false);
    setPurchaseItems([]);
    setNote('');
  };

  // If scanner was triggered
  useEffect(() => {
    if (scannerResult && isModalOpen) {
      const found = products.find(
        (p) =>
          p.barcode?.toLowerCase() === scannerResult.toLowerCase() ||
          p.sku.toLowerCase() === scannerResult.toLowerCase()
      );
      if (found) {
        handleAddItem(found);
      }
      onClearScannerResult?.();
    }
  }, [scannerResult, isModalOpen, products, onClearScannerResult]);

  const purchaseTotal = purchaseItems.reduce((sum, item) => sum + item.buy * item.qty, 0);

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-amber-400" />
            Riwayat Pembelian &amp; Restock Barang Masuk
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Setiap kali pembelian dicatat, stok produk di sistem otomatis bertambah. Total belanja:{' '}
            <b className="text-amber-400">{formatRupiah(totalAllPurchases)}</b>
          </p>
        </div>
        <button
          onClick={() => {
            setPurchaseItems([]);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95 shrink-0"
        >
          <Plus className="h-4 w-4" />
          + Catat Pembelian
        </button>
      </div>

      {/* Purchases Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-3">Supplier</th>
                <th className="py-3 px-3">Item Pembelian</th>
                <th className="py-3 px-3 text-right">Total Biaya</th>
                <th className="py-3 px-3">Catatan</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {purchases.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-500">
                    Belum ada riwayat pembelian tercatat.
                  </td>
                </tr>
              ) : (
                purchases
                  .slice()
                  .reverse()
                  .map((p) => {
                    const supplier = suppliers.find((s) => s.id === p.supplierId);
                    return (
                      <tr key={p.id} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-mono text-slate-400">
                          {new Date(p.date).toLocaleString('id-ID')}
                        </td>
                        <td className="py-3 px-3 font-medium text-white">
                          {supplier?.name || '- Tanpa Supplier -'}
                        </td>
                        <td className="py-3 px-3 text-slate-300 leading-relaxed">
                          {p.items.map((i, idx) => (
                            <span key={idx} className="block">
                              • {i.name} ({i.qty} pcs @ {formatRupiah(i.buy)})
                            </span>
                          ))}
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-amber-400">
                          {formatRupiah(p.total)}
                        </td>
                        <td className="py-3 px-3 text-slate-400">{p.note || '-'}</td>
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => {
                              if (confirm('Hapus catatan pembelian ini? (Stok yang sudah bertambah tidak otomatis dikurangi).')) {
                                onDeletePurchase(p.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-950/30 transition-colors"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Purchase Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
          <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-amber-400" />
                Catat Barang Masuk (Restock Stok)
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Pilih Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="">- Tanpa Supplier Tertentu -</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Search & Picker */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tambah Produk yang Dibeli
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Ketik nama atau kode produk..."
                      value={productSearch}
                      onChange={(e) => setProductSearch(e.target.value)}
                      className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onOpenScanner}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-2 text-xs font-semibold text-amber-400 transition-colors shrink-0"
                  >
                    <Camera className="h-4 w-4" />
                    Scan
                  </button>
                </div>

                {productSearch && (
                  <div className="mt-2 max-h-36 overflow-y-auto rounded-xl border border-slate-800 bg-slate-950 p-2 divide-y divide-slate-850">
                    {products
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.sku.toLowerCase().includes(productSearch.toLowerCase()) ||
                          p.barcode?.toLowerCase().includes(productSearch.toLowerCase())
                      )
                      .slice(0, 5)
                      .map((p) => (
                        <div
                          key={p.id}
                          onClick={() => {
                            handleAddItem(p);
                            setProductSearch('');
                          }}
                          className="py-2 px-2 flex items-center justify-between text-xs hover:bg-slate-800/60 rounded cursor-pointer"
                        >
                          <div>
                            <span className="font-semibold text-white">{p.name}</span>
                            <span className="text-slate-400 ml-2">Stok sekarang: {p.stock}</span>
                          </div>
                          <span className="text-amber-400 font-bold">+ Pilih</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Items List */}
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-3 max-h-56 overflow-y-auto space-y-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Daftar Barang Masuk
                </div>
                {purchaseItems.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs">
                    Belum ada produk dipilih. Cari dan klik produk di atas.
                  </div>
                ) : (
                  purchaseItems.map((item) => (
                    <div
                      key={item.productId}
                      className="flex items-center justify-between gap-3 text-xs bg-slate-900 p-2.5 rounded-lg border border-slate-800"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-white truncate">{item.name}</div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.productId, -1)}
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="w-8 text-center font-bold text-white">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQtyChange(item.productId, 1)}
                          className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <span className="text-slate-400 text-[11px]">@Rp</span>
                        <input
                          type="number"
                          value={item.buy}
                          onChange={(e) =>
                            handleBuyPriceChange(item.productId, Number(e.target.value) || 0)
                          }
                          className="w-20 rounded border border-slate-700 bg-slate-950 px-1.5 py-1 text-right text-xs text-white"
                        />
                      </div>

                      <div className="w-20 text-right font-bold text-amber-400">
                        {formatRupiah(item.buy * item.qty)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Catatan Pembelian (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Belanja grosir pasar pagi, diskon toko 5%"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div>
                  <div className="text-xs text-slate-400">Total Biaya Pembelian</div>
                  <div className="text-lg font-black text-amber-400">
                    {formatRupiah(purchaseTotal)}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleSavePurchase}
                    disabled={purchaseItems.length === 0}
                    className="rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2 text-xs font-bold text-slate-950 transition-all shadow-md disabled:opacity-40"
                  >
                    Simpan &amp; Tambah Stok
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
