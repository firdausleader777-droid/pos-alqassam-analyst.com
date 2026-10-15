import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Product, Transaction, Purchase, Supplier } from '../types';
import {
  exportProductsToExcel,
  exportTransactionsToExcel,
  exportPurchasesToExcel
} from '../utils/storage';
import { FileSpreadsheet, Download, Upload, AlertOctagon, CheckCircle2 } from 'lucide-react';

interface ImportExportViewProps {
  products: Product[];
  transactions: Transaction[];
  purchases: Purchase[];
  suppliers: Supplier[];
  onImportProducts: (newProducts: Product[]) => void;
  onResetDatabase: () => void;
}

export function ImportExportView({
  products,
  transactions,
  purchases,
  suppliers,
  onImportProducts,
  onResetDatabase
}: ImportExportViewProps) {
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

        if (!rows.length) {
          setImportStatus('❌ File Excel kosong.');
          return;
        }

        const parseNum = (v: unknown, def = 0): number => {
          if (typeof v === 'number') return v;
          const s = String(v || '').replace(/[^\d.-]/g, '');
          return Number(s) || def;
        };

        const importedProducts: Product[] = [];
        let count = 0;

        for (const row of rows) {
          // Normalize column names
          const keys = Object.keys(row);
          const getVal = (possibleKeys: string[]) => {
            const foundKey = keys.find((k) =>
              possibleKeys.includes(k.trim().toLowerCase().replace(/[\s_-]/g, ''))
            );
            return foundKey ? row[foundKey] : undefined;
          };

          const nameVal = getVal(['name', 'namaproduk', 'produk', 'namabarang']);
          if (!nameVal) continue;

          const skuVal = getVal(['sku', 'kode', 'kodebarang']) || 'SKU-' + (count + 1);
          const barcodeVal = getVal(['barcode', 'kodebarcode']) || '';
          const categoryVal = getVal(['category', 'kategori']) || 'Umum';
          const stockVal = parseNum(getVal(['stock', 'stok']), 0);
          
          // RECOGNIZES STOK MIN / MIN STOCK COLUMN IN IMPORT
          const minStockVal = parseNum(getVal(['minstock', 'stokmin', 'minimumstock', 'stokminimum']), 5);
          
          const buyVal = parseNum(getVal(['buy', 'hargabeli', 'modal']), 0);
          const retailVal = parseNum(getVal(['retail', 'eceran', 'hargajual']), 0);
          const grosirVal = parseNum(getVal(['grosir', 'hargagrosir']), 0);
          const grosirMinVal = parseNum(getVal(['grosirmin', 'mingrosir', 'minimalgrosir']), 6);

          importedProducts.push({
            id: 'P' + Date.now() + count,
            name: String(nameVal).trim(),
            sku: String(skuVal).trim(),
            barcode: String(barcodeVal).trim(),
            category: String(categoryVal).trim(),
            supplierId: '',
            stock: stockVal,
            minStock: minStockVal, // STOK MIN
            buy: buyVal,
            retail: retailVal,
            grosir: grosirVal,
            grosirMin: grosirMinVal
          });
          count++;
        }

        if (importedProducts.length > 0) {
          onImportProducts(importedProducts);
          setImportStatus(`✅ Berhasil mengimpor ${importedProducts.length} produk (termasuk kolom Stok Min)!`);
        } else {
          setImportStatus('❌ Tidak ada baris produk valid yang dapat diimpor. Pastikan ada kolom nama produk.');
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setImportStatus(`❌ Gagal membaca file: ${errorMsg}`);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-emerald-400" />
          Ekspor Data ke Microsoft Excel (.xlsx)
        </h3>
        <p className="text-xs text-slate-400">
          Unduh data lengkap untuk cadangan (backup) atau pembukuan di Microsoft Excel / Google Sheets. 
          File produk menyertakan kolom <b className="text-amber-400">Stok Min</b>.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <button
            onClick={() => exportProductsToExcel(products)}
            className="flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold px-4 py-2.5 text-xs transition-all shadow-md active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Produk ({products.length})
          </button>

          <button
            onClick={() => exportTransactionsToExcel(transactions)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-4 py-2.5 text-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Transaksi ({transactions.length})
          </button>

          <button
            onClick={() => exportPurchasesToExcel(purchases, suppliers)}
            className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-semibold px-4 py-2.5 text-xs transition-all active:scale-95"
          >
            <FileSpreadsheet className="h-4 w-4" />
            Ekspor Pembelian ({purchases.length})
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Upload className="h-5 w-5 text-amber-400" />
          Impor Produk dari Excel (.xlsx / .csv)
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Unggah file Excel daftar produk Anda. Format kolom yang didukung: <br />
          <code className="text-amber-300 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded mt-1 inline-block">
            Nama Produk, SKU, Barcode, Kategori, Stok, Stok Min, Modal, Eceran, Grosir, Min Grosir
          </code>
        </p>

        <div className="flex items-center gap-3 pt-1">
          <label className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 text-xs cursor-pointer transition-all shadow-md active:scale-95">
            <Upload className="h-4 w-4" />
            Pilih File Excel (.xlsx)
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {importStatus && (
          <div className="mt-3 p-3 rounded-xl border border-slate-800 bg-slate-950 text-xs text-slate-200">
            {importStatus}
          </div>
        )}
      </div>

      {/* Danger Zone: Reset Database */}
      <div className="rounded-2xl border border-red-500/30 bg-red-950/10 p-6 shadow-sm space-y-3">
        <h3 className="text-base font-bold text-red-400 flex items-center gap-2">
          <AlertOctagon className="h-5 w-5" />
          Reset Database &amp; Hapus Semua Data
        </h3>
        <p className="text-xs text-slate-400 leading-relaxed">
          Tindakan ini akan mengosongkan seluruh data produk, transaksi, supplier, dan pembelian di perangkat ini. 
          Akun administrator default tetap dipertahankan. Gunakan dengan sangat hati-hati.
        </p>
        <button
          onClick={onResetDatabase}
          className="rounded-xl border border-red-500/40 bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold px-4 py-2 text-xs transition-colors"
        >
          Reset Semua Data Aplikasi
        </button>
      </div>
    </div>
  );
}
