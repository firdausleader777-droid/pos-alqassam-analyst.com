import { Product, Transaction } from '../types';
import { formatRupiah } from '../utils/storage';
import { Sparkles, AlertTriangle, TrendingUp, PackageCheck, Zap } from 'lucide-react';

interface AiInsightViewProps {
  products: Product[];
  transactions: Transaction[];
}

export function AiInsightView({ products, transactions }: AiInsightViewProps) {
  const insights: { title: string; desc: string; type: 'warning' | 'positive' | 'info' }[] = [];

  // 1. Check stocks against minStock
  const belowMin = products.filter((p) => p.stock <= (p.minStock ?? 5));
  if (belowMin.length > 0) {
    insights.push({
      title: `${belowMin.length} Produk Mencapai Batas Stok Minimum`,
      desc: `Ada ${belowMin.length} produk yang stok fisiknya sudah di bawah atau sama dengan Stok Min yang Anda tentukan (${belowMin.slice(0, 4).map((p) => `${p.name} sisa ${p.stock}`).join(', ')}${belowMin.length > 4 ? ', dll' : ''}). Segera hubungi supplier terkait sebelum stok habis total.`,
      type: 'warning'
    });
  }

  // 2. Sales velocity 7 days vs previous 7 days
  const now = Date.now();
  const last7 = transactions.filter((t) => new Date(t.date).getTime() > now - 7 * 86400000);
  const prev7 = transactions.filter(
    (t) =>
      new Date(t.date).getTime() <= now - 7 * 86400000 &&
      new Date(t.date).getTime() > now - 14 * 86400000
  );

  const s7 = last7.reduce((sum, t) => sum + t.total, 0);
  const sp7 = prev7.reduce((sum, t) => sum + t.total, 0);

  if (sp7 > 0) {
    const change = (((s7 - sp7) / sp7) * 100).toFixed(1);
    const isUp = Number(change) >= 0;
    insights.push({
      title: `Performa Tren Penjualan Mingguan: ${isUp ? 'Meningkat' : 'Menurun'} ${Math.abs(Number(change))}%`,
      desc: `Total omzet 7 hari terakhir tercatat ${formatRupiah(s7)}, dibandingkan periode 7 hari sebelumnya ${formatRupiah(sp7)}. ${isUp ? 'Pertahankan momentum promosi dan ketersediaan stok.' : 'Pertimbangkan promosi bundle atau diskon produk lambat laku.'}`,
      type: isUp ? 'positive' : 'info'
    });
  } else if (s7 > 0) {
    insights.push({
      title: `Penjualan 7 Hari Terakhir: ${formatRupiah(s7)}`,
      desc: `Toko mencatat total perputaran omzet ${formatRupiah(s7)} dalam seminggu terakhir.`,
      type: 'positive'
    });
  }

  // 3. Top selling product
  const soldMap: Record<string, number> = {};
  transactions.forEach((t) => {
    t.items.forEach((i) => {
      soldMap[i.name] = (soldMap[i.name] || 0) + i.qty;
    });
  });

  const sortedSold = Object.entries(soldMap).sort((a, b) => b[1] - a[1]);
  if (sortedSold.length > 0) {
    const top = sortedSold[0];
    insights.push({
      title: `Produk Bintang (Best Seller): ${top[0]}`,
      desc: `Produk ini telah terjual sebanyak ${top[1]} pcs. Pastikan kuota Stok Min produk ini dinaikkan agar toko tidak kehabisan stok saat jam ramai pengunjung.`,
      type: 'positive'
    });
  }

  // 4. Dead stock
  const deadStock = products.filter((p) => !soldMap[p.name] && p.stock > 0);
  if (deadStock.length > 0) {
    insights.push({
      title: `${deadStock.length} Produk Mengendap (Belum Pernah Terjual)`,
      desc: `Beberapa barang seperti ${deadStock.slice(0, 3).map((p) => p.name).join(', ')} belum memiliki transaksi keluar. Terapkan diskon cuci gudang atau bundling dengan produk laris untuk membebaskan modal persediaan.`,
      type: 'info'
    });
  }

  // 5. Retail vs Grosir ratio
  const grosirCount = transactions.filter((t) => t.mode === 'grosir').length;
  const retailCount = transactions.filter((t) => t.mode === 'retail').length;
  if (transactions.length > 0) {
    insights.push({
      title: `Analisis Jalur Penjualan: ${retailCount} Eceran vs ${grosirCount} Grosir`,
      desc: grosirCount > retailCount
        ? 'Transaksi didominasi oleh pembeli grosir/reseller. Berikan insentif volume atau reward langganan grosir.'
        : 'Transaksi didominasi oleh konsumen eceran langsung. Fokuskan promosi pada media sosial dan display toko fisik.',
      type: 'info'
    });
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 p-6 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-amber-400" />
          AI Insight &amp; Analitik Bisnis Otomatis
        </h2>
        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
          Algoritma analitik menghitung pola perputaran barang, perbandingan stok terhadap batas minimum, dan profitabilitas toko untuk membantu Anda mengambil keputusan bisnis terbaik.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((item, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-5 space-y-2 ${
              item.type === 'warning'
                ? 'border-rose-500/30 bg-rose-950/15'
                : item.type === 'positive'
                ? 'border-emerald-500/30 bg-emerald-950/15'
                : 'border-slate-800 bg-slate-900'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-sm text-white">
              {item.type === 'warning' ? (
                <AlertTriangle className="h-4 w-4 text-rose-400" />
              ) : item.type === 'positive' ? (
                <TrendingUp className="h-4 w-4 text-emerald-400" />
              ) : (
                <Zap className="h-4 w-4 text-amber-400" />
              )}
              {item.title}
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
