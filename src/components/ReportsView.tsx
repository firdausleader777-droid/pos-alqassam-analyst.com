import { useState } from 'react';
import { Transaction } from '../types';
import { formatRupiah } from '../utils/storage';
import { FileText, TrendingUp, Calendar, ShoppingBag } from 'lucide-react';

interface ReportsViewProps {
  transactions: Transaction[];
}

export function ReportsView({ transactions }: ReportsViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const sixDaysAgo = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);

  const [dateFrom, setDateFrom] = useState(sixDaysAgo);
  const [dateTo, setDateTo] = useState(today);
  const [deviceFilter, setDeviceFilter] = useState('all');

  // Available devices in transactions
  const uniqueDevices = Array.from(
    new Set(transactions.map((t) => t.deviceName || t.deviceId || 'PC Kasir 1 (Utama)'))
  );

  const filteredTrx = transactions.filter((t) => {
    const d = t.date.slice(0, 10);
    const matchDate = d >= dateFrom && d <= dateTo;
    const dev = t.deviceName || t.deviceId || 'PC Kasir 1 (Utama)';
    const matchDevice = deviceFilter === 'all' || dev === deviceFilter;
    return matchDate && matchDevice;
  });

  const totalOmzet = filteredTrx.reduce((sum, t) => sum + t.total, 0);
  const totalLaba = filteredTrx.reduce((sum, t) => sum + t.profit, 0);
  const totalTransactions = filteredTrx.length;
  const avgPerTrx = totalTransactions ? totalOmzet / totalTransactions : 0;

  // Best selling products
  const productCountMap: Record<string, { qty: number; revenue: number }> = {};
  filteredTrx.forEach((t) => {
    t.items.forEach((item) => {
      if (!productCountMap[item.name]) {
        productCountMap[item.name] = { qty: 0, revenue: 0 };
      }
      productCountMap[item.name].qty += item.qty;
      productCountMap[item.name].revenue += item.price * item.qty;
    });
  });

  const topProducts = Object.entries(productCountMap)
    .sort((a, b) => b[1].qty - a[1].qty)
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Date Filter Card */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Dari Tanggal
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Sampai Tanggal
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Filter Perangkat Kasir
              </label>
              <select
                value={deviceFilter}
                onChange={(e) => setDeviceFilter(e.target.value)}
                className="rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
              >
                <option value="all">Semua Perangkat ({transactions.length} Trx)</option>
                {uniqueDevices.map((dev) => (
                  <option key={dev} value={dev}>
                    {dev}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setDateFrom(today);
                setDateTo(today);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs text-slate-300 font-medium"
            >
              Hari Ini
            </button>
            <button
              onClick={() => {
                const startMonth = new Date();
                startMonth.setDate(1);
                setDateFrom(startMonth.toISOString().slice(0, 10));
                setDateTo(today);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-xs text-slate-300 font-medium"
            >
              Bulan Ini
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-400">Total Omzet Penjualan</div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatRupiah(totalOmzet)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-400">Total Laba Kotor</div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {formatRupiah(totalLaba)}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-400">Jumlah Transaksi</div>
          <div className="text-2xl font-black text-white mt-2">
            {totalTransactions}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="text-xs text-slate-400">Rata-rata per Transaksi</div>
          <div className="text-2xl font-black text-sky-400 mt-2">
            {formatRupiah(avgPerTrx)}
          </div>
        </div>
      </div>

      {/* Best Selling Products */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-amber-400" />
          Produk Terlaris pada Periode Ini
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Nama Produk</th>
                <th className="py-2.5 px-3 text-center">Unit Terjual</th>
                <th className="py-2.5 px-3 text-right">Total Nilai Penjualan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {topProducts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-slate-500">
                    Tidak ada transaksi pada rentang tanggal ini.
                  </td>
                </tr>
              ) : (
                topProducts.map(([name, data], idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-medium text-white">{name}</td>
                    <td className="py-2.5 px-3 text-center font-bold text-amber-400">
                      {data.qty} pcs
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-emerald-400">
                      {formatRupiah(data.revenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions History */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <FileText className="h-4 w-4 text-sky-400" />
          Rincian Semua Nota Transaksi
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">ID &amp; Waktu</th>
                <th className="py-2.5 px-3">Kasir &amp; Perangkat</th>
                <th className="py-2.5 px-3">Mode</th>
                <th className="py-2.5 px-3">Item Terjual</th>
                <th className="py-2.5 px-3 text-right">Diskon</th>
                <th className="py-2.5 px-3 text-right">Total Belanja</th>
                <th className="py-2.5 px-3 text-right">Laba</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {filteredTrx.slice().reverse().map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono text-slate-400">
                    <div>{new Date(t.date).toLocaleString('id-ID')}</div>
                    <div className="text-[10px] text-slate-500">{t.id}</div>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-white">{t.cashier}</div>
                    <div className="text-[10px] text-amber-400 font-mono">
                      {t.deviceName || t.deviceId || 'PC Kasir 1 (Utama)'}
                    </div>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      t.mode === 'grosir'
                        ? 'bg-amber-400/15 text-amber-300'
                        : 'bg-sky-400/15 text-sky-300'
                    }`}>
                      {t.mode}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300 max-w-xs truncate">
                    {t.items.map((i) => `${i.name} (x${i.qty})`).join(', ')}
                  </td>
                  <td className="py-2.5 px-3 text-right text-red-400">
                    {t.discount ? `-${formatRupiah(t.discount)}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-white">
                    {formatRupiah(t.total)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-emerald-400">
                    {formatRupiah(t.profit)}
                  </td>
                </tr>
              ))}
              {filteredTrx.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada data transaksi.
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
