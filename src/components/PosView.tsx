import { useState } from 'react';
import { Product, CartItem, Transaction } from '../types';
import { formatRupiah, playBeep } from '../utils/storage';
import { Search, Camera, Trash2, Plus, Minus, ShoppingBag, Receipt, AlertCircle } from 'lucide-react';

interface PosViewProps {
  products: Product[];
  cashierName: string;
  onCheckout: (transaction: Transaction) => void;
  onOpenScanner: () => void;
  onTriggerReceipt: (trx: Transaction) => void;
}

export function PosView({
  products,
  cashierName,
  onCheckout,
  onOpenScanner
}: PosViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [priceMode, setPriceMode] = useState<'retail' | 'grosir'>('retail');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountType, setDiscountType] = useState<'pct' | 'amt'>('pct');
  const [scannerFeedback, setScannerFeedback] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  const filteredProducts = products.filter(
    (p) =>
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddToCart = (product: Product) => {
    if (product.stock <= 0) {
      alert(`Stok produk "${product.name}" sudah habis (0).`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) {
          alert(`Maksimal kuantitas adalah ${product.stock} sesuai stok tersedia.`);
          return prev;
        }
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          qty: 1,
          buy: product.buy,
          retail: product.retail,
          grosir: product.grosir,
          grosirMin: product.grosirMin
        }
      ];
    });
    playBeep();
  };

  const handleQtyChange = (productId: string, delta: number) => {
    const product = products.find((p) => p.id === productId);
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === productId) {
            const nextQty = item.qty + delta;
            if (product && nextQty > product.stock) {
              alert(`Kuantitas melebihi stok yang ada (${product.stock} pcs).`);
              return item;
            }
            return { ...item, qty: nextQty };
          }
          return item;
        })
        .filter((item) => item.qty > 0)
    );
  };

  const handleBarcodeEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const code = searchTerm.trim().toLowerCase();
      if (!code) return;

      const found = products.find(
        (p) =>
          p.barcode?.toLowerCase() === code ||
          p.sku.toLowerCase() === code ||
          p.id.toLowerCase() === code
      );

      if (found) {
        handleAddToCart(found);
        setSearchTerm('');
        setScannerFeedback(`✓ Berhasil menambahkan: ${found.name}`);
        setTimeout(() => setScannerFeedback(null), 2000);
      } else {
        setScannerFeedback(`Kode "${code}" tidak ditemukan dalam daftar produk.`);
        setTimeout(() => setScannerFeedback(null), 3000);
      }
    }
  };

  // Calculations
  const subtotal = cart.reduce((sum, item) => {
    const isUsingGrosir = priceMode === 'grosir' && item.qty >= item.grosirMin;
    const price = isUsingGrosir ? item.grosir : item.retail;
    return sum + price * item.qty;
  }, 0);

  const discountValue =
    discountType === 'pct'
      ? subtotal * (Math.min(discountAmount, 100) / 100)
      : Math.min(discountAmount, subtotal);

  const grandTotal = Math.max(0, subtotal - discountValue);

  const handleCheckoutProcess = () => {
    if (cart.length === 0) {
      alert('Keranjang belanja masih kosong.');
      return;
    }

    let calculatedProfit = 0;
    const trxItems = cart.map((item) => {
      const isUsingGrosir = priceMode === 'grosir' && item.qty >= item.grosirMin;
      const price = isUsingGrosir ? item.grosir : item.retail;
      calculatedProfit += (price - item.buy) * item.qty;
      return {
        name: item.name,
        qty: item.qty,
        price
      };
    });

    calculatedProfit -= discountValue;

    const newTransaction: Transaction = {
      id: 'TRX' + Date.now(),
      date: new Date().toISOString(),
      cashier: cashierName,
      mode: priceMode,
      items: trxItems,
      subtotal,
      discount: discountValue,
      total: grandTotal,
      profit: calculatedProfit
    };

    onCheckout(newTransaction);
    setCart([]);
    setDiscountAmount(0);
  };

  const totalCartQty = cart.reduce((sum, item) => sum + item.qty, 0);

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Mobile Screen Switcher: Katalog vs Keranjang */}
      <div className="lg:hidden flex rounded-xl bg-slate-900 p-1 border border-slate-800">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'catalog'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>📦 Katalog Produk</span>
        </button>
        <button
          onClick={() => setMobileTab('cart')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
            mobileTab === 'cart'
              ? 'bg-amber-400 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>🛒 Keranjang ({totalCartQty})</span>
          {cart.length > 0 && (
            <span className="text-[10px] bg-slate-950 text-amber-400 px-1.5 py-0.2 rounded-full font-bold">
              {formatRupiah(grandTotal)}
            </span>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 min-h-0">
        {/* Product Catalog (Left / 7 cols) */}
        <div className={`lg:col-span-7 flex flex-col space-y-4 ${mobileTab === 'cart' ? 'hidden lg:flex' : 'flex'}`}>
        {/* Search & Scan Header */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="🔍 Tembak barcode atau cari produk lalu tekan Enter..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleBarcodeEnter}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-3 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-amber-400 focus:outline-none"
            />
          </div>
          <button
            onClick={onOpenScanner}
            className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-sm font-bold text-slate-950 transition-all shadow-md active:scale-95 shrink-0"
          >
            <Camera className="h-4 w-4" />
            Scan Kamera
          </button>
        </div>

        {scannerFeedback && (
          <div className="text-xs px-3 py-2 rounded-lg bg-slate-800 text-amber-300 border border-slate-700">
            {scannerFeedback}
          </div>
        )}

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 overflow-y-auto max-h-[calc(100vh-220px)] pr-1">
          {filteredProducts.map((p) => {
            const isUsingGrosir = priceMode === 'grosir';
            const price = isUsingGrosir ? p.grosir : p.retail;
            const isEmpty = p.stock <= 0;
            const isLow = !isEmpty && p.stock <= (p.minStock ?? 5);

            return (
              <button
                key={p.id}
                onClick={() => handleAddToCart(p)}
                disabled={isEmpty}
                className={`flex flex-col text-left p-3 rounded-xl border transition-all text-xs relative ${
                  isEmpty
                    ? 'border-slate-800 bg-slate-950/50 opacity-40 cursor-not-allowed'
                    : 'border-slate-800 bg-slate-900 hover:border-amber-400/80 hover:bg-slate-850 active:scale-98 shadow-sm'
                }`}
              >
                <div className="font-semibold text-white line-clamp-2 min-h-[32px]">
                  {p.name}
                </div>
                <div className="mt-2 text-sm font-bold text-amber-400">
                  {formatRupiah(price)}
                </div>
                <div className="mt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono">{p.sku}</span>
                  <span
                    className={`font-semibold ${
                      isEmpty
                        ? 'text-red-400'
                        : isLow
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    Stok: {p.stock}
                  </span>
                </div>
                {isLow && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-amber-400 animate-pulse" title="Stok Menipis &le; Stok Min"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Mobile Floating Cart Summary Button */}
        {cart.length > 0 && mobileTab === 'catalog' && (
          <div className="lg:hidden pt-2">
            <button
              onClick={() => setMobileTab('cart')}
              className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-500/20 active:scale-98 transition-all"
            >
              <div className="flex items-center gap-2 text-xs">
                <ShoppingBag className="h-4 w-4" />
                <span>{totalCartQty} Item di Keranjang</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black">
                <span>{formatRupiah(grandTotal)}</span>
                <span>&rarr; Bayar</span>
              </div>
            </button>
          </div>
        )}
      </div>

      {/* Cart & Billing (Right / 5 cols) */}
      <div
        className={`lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900 p-5 flex flex-col justify-between shadow-xl ${
          mobileTab === 'catalog' ? 'hidden lg:flex' : 'flex'
        }`}
      >
        <div>
          {/* Header & Mode Switcher */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <ShoppingBag className="h-4 w-4 text-amber-400" />
              Keranjang Transaksi
            </div>
            {/* Mode Eceran vs Grosir */}
            <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
              <button
                onClick={() => setPriceMode('retail')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  priceMode === 'retail'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Eceran
              </button>
              <button
                onClick={() => setPriceMode('grosir')}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  priceMode === 'grosir'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Grosir
              </button>
            </div>
          </div>

          {/* Cart Item List */}
          <div className="mt-3 divide-y divide-slate-800/80 overflow-y-auto max-h-[340px] pr-1">
            {cart.length === 0 ? (
              <div className="py-16 text-center text-slate-500 text-xs">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-slate-600 opacity-60" />
                Keranjang masih kosong.<br />Klik produk atau scan barcode untuk menambahkan.
              </div>
            ) : (
              cart.map((item) => {
                const isUsingGrosir = priceMode === 'grosir' && item.qty >= item.grosirMin;
                const unitPrice = isUsingGrosir ? item.grosir : item.retail;
                const lineTotal = unitPrice * item.qty;

                return (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate">{item.name}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span>{formatRupiah(unitPrice)}</span>
                        {isUsingGrosir && (
                          <span className="rounded bg-amber-400/15 text-amber-300 px-1 py-0.2 text-[10px] font-bold">
                            Grosir
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Qty Counter */}
                    <div className="flex items-center gap-1 bg-slate-950 rounded-lg p-1 border border-slate-800">
                      <button
                        onClick={() => handleQtyChange(item.id, -1)}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="w-7 text-center font-bold text-white text-xs">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => handleQtyChange(item.id, 1)}
                        className="h-6 w-6 rounded bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center transition-colors"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                    </div>

                    <div className="w-20 text-right font-bold text-amber-400">
                      {formatRupiah(lineTotal)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Bill Summary & Actions */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          {/* Discount Field */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs text-slate-400">Diskon Transaksi</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value) || 0)}
                className="w-20 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-right text-white focus:border-amber-400 focus:outline-none"
              />
              <select
                value={discountType}
                onChange={(e) => setDiscountType(e.target.value as 'pct' | 'amt')}
                className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1 text-xs text-slate-300 focus:border-amber-400 focus:outline-none"
              >
                <option value="pct">%</option>
                <option value="amt">Rp</option>
              </select>
            </div>
          </div>

          <div className="space-y-1 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span>{formatRupiah(subtotal)}</span>
            </div>
            {discountValue > 0 && (
              <div className="flex justify-between text-red-400">
                <span>Diskon</span>
                <span>-{formatRupiah(discountValue)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Tagihan</span>
              <span className="text-amber-400">{formatRupiah(grandTotal)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => {
                if (cart.length > 0 && confirm('Kosongkan keranjang belanja?')) {
                  setCart([]);
                }
              }}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 py-3 text-xs font-semibold disabled:opacity-40 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Kosongkan
            </button>

            <button
              onClick={handleCheckoutProcess}
              disabled={cart.length === 0}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 py-3 text-xs font-extrabold shadow-lg disabled:opacity-40 transition-all active:scale-95"
            >
              <Receipt className="h-4 w-4" />
              Bayar &amp; Cetak
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}
