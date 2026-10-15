import { useState } from 'react';
import { PrinterConfig } from '../types';
import { Printer, Save, Check } from 'lucide-react';

interface PrinterSettingsViewProps {
  printerConfig: PrinterConfig;
  onSavePrinterConfig: (cfg: PrinterConfig) => void;
  onTestPrint: () => void;
}

export function PrinterSettingsView({
  printerConfig,
  onSavePrinterConfig,
  onTestPrint
}: PrinterSettingsViewProps) {
  const [form, setForm] = useState<PrinterConfig>({ ...printerConfig });
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSavePrinterConfig(form);
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Printer className="h-5 w-5 text-amber-400" />
          Pengaturan Printer Thermal Struk Kasir
        </h3>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Lebar Kertas Printer
            </label>
            <select
              value={form.paperWidth}
              onChange={(e) => setForm({ ...form, paperWidth: e.target.value as '58mm' | '80mm' })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            >
              <option value="58mm">58mm (Printer Kasir Mini / Bluetooth Portabel)</option>
              <option value="80mm">80mm (Printer Kasir Desktop Standar Toko)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Alamat Toko (Dicetak di Bagian Atas Struk)
            </label>
            <input
              type="text"
              placeholder="Contoh: Jl. Pemuda No. 88, Pusat Niaga"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nomor Telepon / WhatsApp Toko
            </label>
            <input
              type="text"
              placeholder="Contoh: 0812-3456-7890"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Pesan Footer Struk
            </label>
            <input
              type="text"
              placeholder="Contoh: Terima kasih atas kunjungan Anda!"
              value={form.footer}
              onChange={(e) => setForm({ ...form, footer: e.target.value })}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={form.showLogo}
                onChange={(e) => setForm({ ...form, showLogo: e.target.checked })}
                className="h-4 w-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
              />
              <span>Tampilkan logo toko pada kop struk belanja (jika sudah diunggah)</span>
            </label>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
            >
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </button>

            <button
              type="button"
              onClick={onTestPrint}
              className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-4 py-2.5 text-xs font-semibold text-slate-200 transition-colors"
            >
              <Printer className="h-4 w-4" />
              Test Cetak Struk
            </button>
          </div>

          {savedFeedback && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 pt-1 font-medium">
              <Check className="h-4 w-4" /> Pengaturan printer berhasil disimpan!
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
