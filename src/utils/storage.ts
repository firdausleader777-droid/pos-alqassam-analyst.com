import * as XLSX from 'xlsx';
import { Product, Transaction, Purchase, Supplier } from '../types';

export const DB = {
  get<T>(k: string, defaultVal: T): T {
    try {
      const v = localStorage.getItem('aq_' + k);
      return v ? JSON.parse(v) : defaultVal;
    } catch {
      return defaultVal;
    }
  },
  set<T>(k: string, val: T): boolean {
    try {
      localStorage.setItem('aq_' + k, JSON.stringify(val));
      return true;
    } catch (e) {
      console.error('DB.set failed', e);
      return false;
    }
  },
  remove(k: string): void {
    try {
      localStorage.removeItem('aq_' + k);
    } catch (e) {
      console.error('DB.remove failed', e);
    }
  }
};

export function formatRupiah(num: number): string {
  return 'Rp' + Math.round(num || 0).toLocaleString('id-ID');
}

export function playBeep(): void {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {
    // Ignore audio permission errors
  }
}

export function compressImage(
  file: File,
  maxSize: number,
  onSuccess: (dataUrl: string) => void,
  onError?: (err: string) => void
): void {
  const reader = new FileReader();
  reader.onerror = () => onError?.('Gagal membaca file.');
  reader.onload = (e) => {
    const img = new Image();
    img.onerror = () => onError?.('File bukan gambar yang valid.');
    img.onload = () => {
      let w = img.width;
      let h = img.height;
      if (w > h) {
        if (w > maxSize) {
          h = Math.round((h * maxSize) / w);
          w = maxSize;
        }
      } else {
        if (h > maxSize) {
          w = Math.round((w * maxSize) / h);
          h = maxSize;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        onSuccess(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        onError?.('Gagal mengolah canvas.');
      }
    };
    img.src = e.target?.result as string;
  };
  reader.readAsDataURL(file);
}

export function exportProductsToExcel(products: Product[]): void {
  const header = ['ID', 'Nama Produk', 'SKU', 'Barcode', 'Kategori', 'Stok', 'Stok Min', 'Harga Beli (Modal)', 'Harga Eceran', 'Harga Grosir', 'Min Grosir'];
  const rows = products.map((p) => [
    p.id,
    p.name,
    p.sku,
    p.barcode || '',
    p.category,
    p.stock,
    p.minStock ?? 5,
    p.buy,
    p.retail,
    p.grosir,
    p.grosirMin
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produk');
  XLSX.writeFile(wb, `produk_alqassam_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportTransactionsToExcel(transactions: Transaction[]): void {
  const header = ['ID Transaksi', 'Waktu', 'Kasir', 'Mode', 'Subtotal', 'Diskon', 'Total', 'Laba', 'Rincian Item'];
  const rows = transactions.map((t) => [
    t.id,
    new Date(t.date).toLocaleString('id-ID'),
    t.cashier,
    t.mode,
    t.subtotal || t.total,
    t.discount || 0,
    t.total,
    t.profit,
    t.items.map((i) => `${i.name} (x${i.qty})`).join('; ')
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Transaksi');
  XLSX.writeFile(wb, `transaksi_alqassam_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

export function exportPurchasesToExcel(purchases: Purchase[], suppliers: Supplier[]): void {
  const header = ['ID Pembelian', 'Waktu', 'Supplier', 'Total Beli', 'Catatan', 'Rincian Item'];
  const rows = purchases.map((p) => {
    const sName = suppliers.find((s) => s.id === p.supplierId)?.name || 'Tanpa Supplier';
    return [
      p.id,
      new Date(p.date).toLocaleString('id-ID'),
      sName,
      p.total,
      p.note || '',
      p.items.map((i) => `${i.name} (x${i.qty} @ ${i.buy})`).join('; ')
    ];
  });
  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Pembelian');
  XLSX.writeFile(wb, `pembelian_restock_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
