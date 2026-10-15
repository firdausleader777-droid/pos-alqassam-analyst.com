import { useState } from 'react';
import { Product, Transaction } from '../types';
import { formatRupiah } from '../utils/storage';
import { Coins, Layers, ArrowUpRight, Save } from 'lucide-react';

interface YearlyModalViewProps {
  products: Product[];
  transactions: Transaction[];
  openingBalances: Record<string, number>;
  onSaveOpeningBalance: (year: string, amount: number) => void;
}

export function YearlyModalView({
  products,
  transactions,
  openingBalances,
  onSaveOpeningBalance
}: YearlyModalViewProps) {
  const currentYear = new Date().getFullYear().toString();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [balanceInput, setBalanceInput] = useState(
    openingBalances[currentYear]?.toString() || ''
  );
  const [savedFeedback, setSavedFeedback] = useState(false);

  // Modal inventory realtime = stock * buy
  const inventoryAsset = products.reduce((sum, p) => sum + p.stock * p.buy, 0);
  const currentCashOpening = openingBalances[currentYear] || 0;
  const totalAssets = currentCashOpening + inventoryAsset;

  const yearsInHistory = Array.from(
    new Set([currentYear, ...transactions.map((t) => t.date.slice(0, 4))])
  ).sort();

  const handleSave = () => {
    const num = Number(balanceInput) || 0;
    onSaveOpeningBalance(selectedYear, num);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Modal Inventori Saat Ini (Otomatis Realtime)</span>
            <Layers className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-2">
            {formatRupiah(inventoryAsset)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Dihitung otomatis dari perkalian Stok &times; Harga Modal Beli seluruh produk
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Total Nilai Aset Usaha (Kas Awal + Modal Barang)</span>
            <Coins className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-2">
            {formatRupiah(totalAssets)}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Estimasi total kekayaan operasional toko tahun {currentYear}
          </div>
        </div>
      </div>

      {/* Input Saldo Awal Kas */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Coins className="h-4 w-4 text-amber-400" />
          Saldo Kas Tunai Awal Tahun (Modal Kas)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Modal barang/inventori sudah dihitung secara otomatis realtime oleh sistem. Anda cukup memasukkan nominal <b>kas tunai atau modal uang</b> yang disiapkan pada awal tahun pembukuan.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="number"
            placeholder="Tahun"
            value={selectedYear}
            onChange={(e) => {
              setSelectedYear(e.target.value);
              setBalanceInput(openingBalances[e.target.value]?.toString() || '');
            }}
            className="w-28 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          />

          <input
            type="number"
            placeholder="Nominal Kas Awal (Rp)"
            value={balanceInput}
            onChange={(e) => setBalanceInput(e.target.value)}
            className="w-60 rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
          />

          <button
            onClick={() => setBalanceInput(inventoryAsset.toString())}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-2 text-xs text-slate-300 font-medium transition-colors"
          >
            Gunakan Nilai Inventori
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-4 py-2 text-xs font-bold text-slate-950 transition-all shadow-md"
          >
            <Save className="h-3.5 w-3.5" />
            Simpan Saldo
          </button>
        </div>

        {savedFeedback && (
          <div className="text-xs text-emerald-400 font-medium">
            ✓ Saldo awal kas tahun {selectedYear} berhasil disimpan.
          </div>
        )}
      </div>

      {/* Comparison Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <ArrowUpRight className="h-4 w-4 text-sky-400" />
          Perbandingan Kinerja Keuangan Tahun ke Tahun
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Tahun</th>
                <th className="py-2.5 px-3 text-right">Saldo Kas Awal</th>
                <th className="py-2.5 px-3 text-right">Total Omzet</th>
                <th className="py-2.5 px-3 text-right">Total Laba</th>
                <th className="py-2.5 px-3 text-right">Estimasi Kas Akhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300">
              {yearsInHistory.map((yr) => {
                const yearTrx = transactions.filter((t) => t.date.slice(0, 4) === yr);
                const omzet = yearTrx.reduce((sum, t) => sum + t.total, 0);
                const laba = yearTrx.reduce((sum, t) => sum + t.profit, 0);
                const kasAwal = openingBalances[yr] || 0;
                const estAkhir = kasAwal + laba;

                return (
                  <tr key={yr} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-bold text-white">{yr}</td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {formatRupiah(kasAwal)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-medium text-white">
                      {formatRupiah(omzet)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-semibold text-amber-400">
                      {formatRupiah(laba)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                      {formatRupiah(estAkhir)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
