import { useState } from 'react';
import { Branding } from '../types';
import { compressImage } from '../utils/storage';
import { Store, Image as ImageIcon, Save, Check, Upload, Shield, EyeOff, Eye, Globe, ExternalLink, HelpCircle, CheckCircle2 } from 'lucide-react';

interface StoreSettingsViewProps {
  branding: Branding;
  onSaveBranding: (branding: Branding) => void;
  onNavigateToDatabase?: () => void;
}

export function StoreSettingsView({ branding, onSaveBranding, onNavigateToDatabase }: StoreSettingsViewProps) {
  const [storeName, setStoreName] = useState(branding.storeName || 'POS Al-Qassam Analyst');
  const [appLogo, setAppLogo] = useState(branding.appLogo || '');
  const [storeLogo, setStoreLogo] = useState(branding.storeLogo || '');
  const [hideDatabaseMenu, setHideDatabaseMenu] = useState(branding.hideDatabaseMenu ?? false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleAppLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, 250, (dataUrl) => {
      setAppLogo(dataUrl);
    });
  };

  const handleStoreLogoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    compressImage(file, 250, (dataUrl) => {
      setStoreLogo(dataUrl);
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveBranding({
      storeName: storeName.trim(),
      appLogo,
      storeLogo,
      hideDatabaseMenu
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* 1. Pengaturan Identitas & Logo */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-sm space-y-5">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Store className="h-5 w-5 text-amber-400" />
          Identitas &amp; Logo Toko
        </h3>

        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nama Toko (Ditampilkan di Header, Sidebar &amp; Struk Kasir)
            </label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-amber-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* App Logo */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300">Logo Aplikasi / Sidebar</div>
              <div className="h-20 w-20 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
                {appLogo ? (
                  <img src={appLogo} alt="App Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                )}
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 text-xs text-slate-200 cursor-pointer font-medium transition-colors">
                <Upload className="h-3.5 w-3.5" />
                Pilih Logo
                <input type="file" accept="image/*" onChange={handleAppLogoFile} className="hidden" />
              </label>
            </div>

            {/* Store Receipt Logo */}
            <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
              <div className="text-xs font-bold text-slate-300">Logo Struk Belanja</div>
              <div className="h-20 w-20 rounded-xl border border-slate-700 bg-slate-900 flex items-center justify-center overflow-hidden">
                {storeLogo ? (
                  <img src={storeLogo} alt="Store Logo" className="h-full w-full object-cover" />
                ) : (
                  <ImageIcon className="h-8 w-8 text-slate-600" />
                )}
              </div>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 px-3 py-1.5 text-xs text-slate-200 cursor-pointer font-medium transition-colors">
                <Upload className="h-3.5 w-3.5" />
                Pilih Logo
                <input type="file" accept="image/*" onChange={handleStoreLogoFile} className="hidden" />
              </label>
            </div>
          </div>

          {/* 2. Pengaturan Visibilitas Menu Database */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-bold text-white">Privasi Menu Database (Supabase)</span>
              </div>
              {hideDatabaseMenu ? (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <EyeOff className="h-3 w-3" /> Tersembunyi
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Eye className="h-3 w-3" /> Tampil di Sidebar Admin
                </span>
              )}
            </div>

            <label className="flex items-start gap-2.5 cursor-pointer select-none pt-1">
              <input
                type="checkbox"
                checked={hideDatabaseMenu}
                onChange={(e) => setHideDatabaseMenu(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500/20"
              />
              <div className="text-xs text-slate-300">
                <span className="font-semibold text-white block">
                  Sembunyikan menu &quot;Panduan Supabase (SQL)&quot; dari navigasi sidebar
                </span>
                <span className="text-slate-400 text-[11px] block mt-0.5 leading-relaxed">
                  Catatan: Menu database ini <b>sudah 100% aman</b> dan otomatis tersembunyi dari akun kasir dan orang umum. 
                  Mencentang opsi ini akan menyembunyikannya juga dari bilah menu Admin agar layar kerja harian lebih bersih.
                </span>
              </div>
            </label>

            {hideDatabaseMenu && onNavigateToDatabase && (
              <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Perlu membuka panduan database saat tersembunyi?
                </span>
                <button
                  type="button"
                  onClick={onNavigateToDatabase}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-2"
                >
                  Buka Menu Supabase Sekali Ini
                </button>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-800">
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 px-5 py-2.5 text-xs font-bold text-slate-950 transition-all shadow-md active:scale-95"
            >
              <Save className="h-4 w-4" />
              Simpan Pengaturan
            </button>
          </div>

          {savedFeedback && (
            <div className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <Check className="h-4 w-4" /> Perubahan identitas toko dan visibilitas berhasil disimpan!
            </div>
          )}
        </form>
      </div>

      {/* 3. Panduan Publish & Langkah Selanjutnya */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-950/20 via-slate-900 to-slate-900 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2 text-white font-bold text-base">
          <Globe className="h-5 w-5 text-amber-400" />
          Panduan Publish &amp; Langkah Selanjutnya untuk Anda
        </div>

        {/* Jawaban Pertanyaan Pengguna */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <HelpCircle className="h-4 w-4" /> Apakah saya harus publish app ini?
            </div>
            <p className="text-slate-300 leading-relaxed">
              <b>Ya, sangat disarankan!</b> Setelah Anda klik tombol <b>Publish</b> di pojok kanan atas AI Studio, 
              Anda akan mendapatkan <b>Shared App URL</b> permanen yang bisa dibuka oleh kasir di toko dari HP/Tablet/Laptop mana pun tanpa perlu login ke akun Google AI Studio.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-3.5 space-y-1.5">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Shield className="h-4 w-4" /> Apakah orang lain bisa melihat menu Supabase?
            </div>
            <p className="text-slate-300 leading-relaxed">
              <b>Tidak akan pernah.</b> Sistem telah dilengkapi proteksi berbasis Role. Kasir dan pengunjung umum 
              hanya bisa melihat halaman kasir dan dashboard. Mereka sama sekali tidak memiliki akses ke menu SQL, modal beli, atau pengaturan database.
            </p>
          </div>
        </div>

        {/* 4 Langkah Selanjutnya */}
        <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 space-y-3">
          <div className="text-xs font-bold text-white uppercase tracking-wider">
            4 Langkah Selanjutnya Sebelum Toko Beroperasi:
          </div>
          <div className="space-y-2.5 text-xs text-slate-300">
            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                1
              </span>
              <div>
                <b className="text-white">Ganti Password Admin Default</b>: Masuk ke menu <i>Pengguna &amp; Akses</i>, ubah password akun admin dari <code className="text-amber-300 font-mono">admin123</code> menjadi password pribadi Anda agar aman dari pihak lain.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                2
              </span>
              <div>
                <b className="text-white">Buat Akun Kasir untuk Staf Toko</b>: Buat akun khusus karyawan dengan role <span className="text-sky-300 font-semibold">Kasir</span> (misal: username <code className="text-slate-200 font-mono">kasir1</code>). Akun kasir hanya bisa scan barang, input transaksi, dan cetak nota.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                3
              </span>
              <div>
                <b className="text-white">Klik Tombol &quot;Publish&quot; di AI Studio</b>: Klik tombol <b>Publish</b> di pojok kanan atas jendela kerja Anda, lalu salin tautan <b>Shared App URL</b>.
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-500/20 text-amber-400 font-bold text-[11px]">
                4
              </span>
              <div>
                <b className="text-white">Buka di Perangkat Kasir &amp; Tambah ke Home Screen</b>: Buka Shared App URL di browser Chrome/Safari pada tablet/HP kasir, lalu klik menu browser <b>&quot;Tambahkan ke Layar Utama / Install App&quot;</b> agar terbuka otomatis seperti aplikasi kasir profesional.
              </div>
            </div>
          </div>
        </div>

        {/* 5. Google Play AAB & Privacy Policy Info */}
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5 text-xs text-slate-300">
          <div className="flex items-center justify-between">
            <div className="font-bold text-emerald-300 flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              Kesiapan Android Studio (.aab) &amp; Kebijakan Privasi Google Play
            </div>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 px-3 py-1 rounded-lg transition-colors inline-flex items-center gap-1 shadow-sm"
            >
              Buka /privacy.html <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <p className="leading-relaxed text-[11px]">
            Jika Anda ingin membungkus aplikasi ini menjadi file <b>.aab (Android App Bundle)</b> di Android Studio (menggunakan WebView / Trusted Web Activity / Capacitor) untuk diunggah ke Google Play Console, gunakan tautan resmi:
          </p>
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] text-emerald-400 flex items-center justify-between">
            <span>https://&lt;domain-anda&gt;/privacy.html</span>
            <span className="text-[10px] text-slate-500 uppercase font-sans">Siap Pakai</span>
          </div>
          <p className="text-[10.5px] text-slate-400 leading-normal">
            Halaman tersebut sudah memenuhi seluruh standar Google Play mengenai izin kamera (<code className="text-slate-300">android.permission.CAMERA</code>) untuk scan barcode tanpa merekam video, hak hapus data, serta perlindungan data multi-device.
          </p>
        </div>
      </div>
    </div>
  );
}
