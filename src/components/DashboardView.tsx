import { Product, Transaction } from '../types';
import { formatRupiah } from '../utils/storage';
import { TrendingUp, DollarSign, ShoppingCart, AlertTriangle, Package, Calendar, ArrowRight, Database } from 'lucide-react';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  onNavigate: (page: string) => void;
}

export function DashboardView({ products, transactions, onNavigate }: DashboardViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const todayTrx = transactions.filter((t) => t.date.slice(0, 10) === today);
  const omzetToday = todayTrx.reduce((sum, t) => sum + t.total, 0);
  const labaToday = todayTrx.reduce((sum, t) => sum + t.profit, 0);
  const trxCount = todayTrx.length;

  // Calculation based on dynamic MIN_STOCK
  const lowStockProducts = products.filter((p) => p.stock <= (p.minStock ?? 5));
  const lowStockCount = lowStockProducts.length;

  const totalInventoryValue = products.reduce((sum, p) => sum + p.stock * p.buy, 0);
  const totalUnitsInStock = products.reduce((sum, p) => sum + p.stock, 0);

  // 7 Days Chart
  const days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const dayTotals = days.map((day) =>
    transactions
      .filter((t) => t.date.slice(0, 10) === day)
      .reduce((sum, t) => sum + t.total, 0)
  );

  const maxTotal = Math.max(...dayTotals, 1000);

  return (
    <div className="space-y-6">
      {/* Low Stock Notification Banner */}
      {lowStockCount > 0 && (
        <div className="rounded-xl border border-rose-500/30 bg-rose-950/20 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div>
                <div className="font-bold text-rose-300 text-sm">
                  ⚠️ {lowStockCount} Produk Berada di Bawah Batas "Stok Min"
                </div>
                <div className="text-xs text-slate-300 mt-1">
                  Produk perlu segera di-restock: {lowStockProducts.slice(0, 5).map((p) => `${p.name} (Sisa: ${p.stock}, Min: ${p.minStock})`).join(', ')}
                  {lowStockProducts.length > 5 && ` dan ${lowStockProducts.length - 5} lainnya`}.
                </div>
              </div>
            </div>
            <button
              onClick={() => onNavigate('products')}
              className="flex items-center gap-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold px-3.5 py-2 transition-all active:scale-95 shrink-0"
            >
              Lihat di Tabel Produk
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main KPI Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Omzet Hari Ini</span>
            <DollarSign className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatRupiah(omzetToday)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Total penerimaan penjualan hari ini
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Laba Kotor Hari Ini</span>
            <TrendingUp className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {formatRupiah(labaToday)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Selisih harga jual dikurangi harga modal
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Transaksi Hari Ini</span>
            <ShoppingCart className="h-4 w-4 text-sky-400" />
          </div>
          <div className="text-2xl font-black text-white mt-2">
            {trxCount} <span className="text-sm font-normal text-slate-400">struk</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Jumlah nota selesai di kasir
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Stok Menipis (&le; Min)</span>
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          </div>
          <div className={`text-2xl font-black mt-2 ${lowStockCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
            {lowStockCount} <span className="text-sm font-normal text-slate-400">item</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Sesuai kriteria Stok Min yang Anda atur
          </div>
        </div>
      </div>

      {/* Inventory & Units Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Nilai Persediaan (Stok &times; Modal) — Realtime</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {formatRupiah(totalInventoryValue)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Total aset barang dagangan yang berada di etalase/gudang
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400">
            <Package className="h-6 w-6" />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400">Total Unit Stok Tersedia</div>
            <div className="text-xl font-extrabold text-white mt-1">
              {totalUnitsInStock.toLocaleString('id-ID')} <span className="text-sm text-slate-400 font-normal">pcs</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Dari {products.length} macam produk terdaftar
            </div>
          </div>
          <div className="h-12 w-12 rounded-xl bg-slate-800 flex items-center justify-center text-sky-400">
            <Calendar className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Nav Shortcut to Supabase Guide */}
      <div className="rounded-xl border border-amber-500/20 bg-slate-900/90 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-white">Ingin migrasi data ke Cloud Supabase?</div>
            <div className="text-xs text-slate-400">
              Skrip SQL siap pakai untuk membuat tabel <b>products</b> dengan kolom <b>min_stock</b>, transactions, purchases, dan users.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigate('cloud')}
          className="flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 text-xs font-semibold text-amber-300 transition-colors shrink-0"
        >
          Buka Panduan Supabase
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Chart: 7 Hari Terakhir */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-4">Omzet 7 Hari Terakhir</h3>
        <div className="flex items-end gap-2 sm:gap-4 h-40 pt-6 px-2 border-b border-slate-800">
          {dayTotals.map((val, idx) => {
            const heightPct = Math.max((val / maxTotal) * 100, 3);
            const dateObj = new Date(days[idx]);
            const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
            return (
              <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                <div className="text-[10px] text-amber-300 font-mono mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {val > 0 ? formatRupiah(val) : ''}
                </div>
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[40px] rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all group-hover:brightness-110"
                ></div>
                <div className="text-[11px] text-slate-400 mt-2 font-medium">{dayName}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3">Transaksi Kasir Terbaru</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Waktu</th>
                <th className="py-2.5 px-3">Kasir</th>
                <th className="py-2.5 px-3">Item</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {transactions.slice(-6).reverse().map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    {new Date(t.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="py-2.5 px-3">{t.cashier}</td>
                  <td className="py-2.5 px-3 text-slate-400">{t.items.length} macam barang</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.mode === 'grosir'
                        ? 'bg-amber-400/15 text-amber-300'
                        : 'bg-sky-400/15 text-sky-300'
                    }`}>
                      {t.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatRupiah(t.total)}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    Belum ada transaksi tercatat.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
