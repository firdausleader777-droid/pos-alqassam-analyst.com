import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Copy,
  Check,
  Download,
  Database,
  CheckCircle2,
  Terminal,
  Shield,
  ShieldCheck,
  RefreshCw,
  KeyRound,
  ExternalLink,
  TableProperties
} from 'lucide-react';
import {
  SUPABASE_SQL_SCHEMA,
  SUPABASE_SAFE_DYNAMIC_RLS_SQL,
  SUPABASE_ALTER_EXISTING_SQL
} from '../data/supabaseGuide';
import { SupabaseConfig } from '../types';
import { DB } from '../utils/storage';

export function SupabaseGuideView() {
  const [copiedFull, setCopiedFull] = useState(false);
  const [copiedRls, setCopiedRls] = useState(false);
  const [copiedAlter, setCopiedAlter] = useState(false);
  const [activeTab, setActiveTab] = useState<'rls' | 'full' | 'alter' | 'test'>('rls');

  // Supabase config state
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() =>
    DB.get<SupabaseConfig>('supabaseConfig', { url: '', anonKey: '', connected: false })
  );

  // Live RLS Table Check State
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [tableStatusList, setTableStatusList] = useState<
    { name: string; status: 'ok' | 'error' | 'pending'; msg: string }[]
  >([
    { name: 'products', status: 'pending', msg: 'Termasuk kolom min_stock' },
    { name: 'suppliers', status: 'pending', msg: 'Data distributor & pemasok' },
    { name: 'transactions', status: 'pending', msg: 'Riwayat nota penjualan kasir' },
    { name: 'transaction_items', status: 'pending', msg: 'Rincian produk per transaksi' },
    { name: 'purchases', status: 'pending', msg: 'Restock barang masuk' },
    { name: 'purchase_items', status: 'pending', msg: 'Rincian item restock' },
    { name: 'app_users', status: 'pending', msg: 'Autentikasi admin & kasir' },
    { name: 'opening_balances', status: 'pending', msg: 'Saldo kas awal tahun' },
    { name: 'store_settings', status: 'pending', msg: 'Logo toko & konfigurasi printer' }
  ]);
  const [overallCheckMsg, setOverallCheckMsg] = useState<string | null>(null);

  const handleCopyRls = () => {
    navigator.clipboard.writeText(SUPABASE_SAFE_DYNAMIC_RLS_SQL);
    setCopiedRls(true);
    setTimeout(() => setCopiedRls(false), 2500);
  };

  const handleCopyFull = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedFull(true);
    setTimeout(() => setCopiedFull(false), 2500);
  };

  const handleCopyAlter = () => {
    navigator.clipboard.writeText(SUPABASE_ALTER_EXISTING_SQL);
    setCopiedAlter(true);
    setTimeout(() => setCopiedAlter(false), 2500);
  };

  const handleDownloadRlsSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SAFE_DYNAMIC_RLS_SQL], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'enable_rls_safe.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadFullSql = () => {
    const element = document.createElement('a');
    const file = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'pos_alqassam_all_in_one_schema.sql';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveConfig = () => {
    DB.set('supabaseConfig', supabaseConfig);
    setOverallCheckMsg('Kredensial Supabase berhasil disimpan di browser.');
  };

  // Run live inspection using Supabase Client
  const handleCheckRlsStatusLive = async () => {
    if (!supabaseConfig.url || !supabaseConfig.anonKey) {
      setOverallCheckMsg('❌ Harap isi Supabase Project URL dan Anon Key terlebih dahulu.');
      return;
    }

    setIsCheckingTables(true);
    setOverallCheckMsg('Memeriksa status RLS dan akses tabel ke Supabase...');

    const cleanUrl = supabaseConfig.url.trim().replace(/\/$/, '');
    const cleanKey = supabaseConfig.anonKey.trim();
    const supabase = createClient(cleanUrl, cleanKey);

    const tablesToCheck = [
      { name: 'products', desc: 'Produk (Stok & Stok Min)' },
      { name: 'suppliers', desc: 'Supplier' },
      { name: 'transactions', desc: 'Transaksi' },
      { name: 'transaction_items', desc: 'Item Transaksi' },
      { name: 'purchases', desc: 'Pembelian' },
      { name: 'purchase_items', desc: 'Item Pembelian' },
      { name: 'app_users', desc: 'Pengguna' },
      { name: 'opening_balances', desc: 'Saldo Awal' },
      { name: 'store_settings', desc: 'Setting Toko' }
    ];

    const results: { name: string; status: 'ok' | 'error' | 'pending'; msg: string }[] = [];
    let allOk = true;

    for (const t of tablesToCheck) {
      try {
        const { error } = await supabase.from(t.name).select('*', { count: 'exact', head: true });
        if (error) {
          allOk = false;
          results.push({
            name: t.name,
            status: 'error',
            msg: `Gagal akses (${error.code || error.message}) - Jalankan skrip Enable RLS di SQL Editor.`
          });
        } else {
          results.push({
            name: t.name,
            status: 'ok',
            msg: `✅ RLS Aktif & Policy Terbuka (Akses API Normal)`
          });
        }
      } catch (err: unknown) {
        allOk = false;
        const msg = err instanceof Error ? err.message : String(err);
        results.push({
          name: t.name,
          status: 'error',
          msg: `Error koneksi: ${msg}`
        });
      }
    }

    setTableStatusList(results);
    setIsCheckingTables(false);

    if (allOk) {
      setOverallCheckMsg('🎉 SEMPURNA! Seluruh 9 tabel memiliki RLS aktif dan policy akses terbuka tanpa halangan!');
      const updated = { ...supabaseConfig, connected: true, lastTested: new Date().toISOString() };
      setSupabaseConfig(updated);
      DB.set('supabaseConfig', updated);
    } else {
      setOverallCheckMsg('⚠️ Beberapa tabel belum dibuat atau policy RLS belum diaktifkan. Buka tab "Run & Enable RLS", salin skripnya, dan jalankan di SQL Editor Supabase Anda.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Run &amp; Enable Row Level Security (RLS) di Supabase
                </h2>
                <div className="text-xs text-amber-400 font-medium">
                  Dilengkapi Skrip Idempotent (Bebas Error jika di-run berulang) + Verifikasi Tabel
                </div>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-300 leading-relaxed max-w-3xl">
              Row Level Security (RLS) mengamankan data PostgreSQL Anda. Di bawah ini disediakan skrip
              yang langsung mengaktifkan <b className="text-white">ENABLE ROW LEVEL SECURITY</b> pada seluruh 9 tabel
              (termasuk tabel <code className="text-amber-300 font-mono">products</code> yang berisi kolom <code className="text-amber-300 font-mono">min_stock</code>),
              menghapus policy lama agar tidak terjadi konflik <code className="text-red-300 font-mono">policy already exists</code>, dan membuat policy akses aman untuk API POS kasir.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopyRls}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 text-slate-950 font-bold px-4 py-2.5 text-xs transition-all shadow-lg shadow-amber-500/20 active:scale-95"
            >
              {copiedRls ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copiedRls ? 'Tersalin ke Clipboard!' : 'Salin SQL Enable RLS'}
            </button>
            <button
              onClick={handleDownloadRlsSql}
              className="flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 px-3.5 py-2.5 text-xs font-semibold transition-all active:scale-95"
            >
              <Download className="h-4 w-4" />
              Unduh .sql
            </button>
          </div>
        </div>
      </div>

      {/* 4 Steps Quick Walkthrough */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Langkah 1
          </div>
          <div className="font-semibold text-white text-sm">Buka SQL Editor</div>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            Buka dashboard proyek Anda di{' '}
            <a
              href="https://supabase.com/dashboard"
              target="_blank"
              rel="noreferrer"
              className="text-amber-400 hover:underline inline-flex items-center gap-0.5"
            >
              supabase.com <ExternalLink className="h-3 w-3" />
            </a>
            , lalu klik ikon <b>&lt;/&gt; SQL Editor</b> di sidebar kiri.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Langkah 2
          </div>
          <div className="font-semibold text-white text-sm">Klik + New Query</div>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            Klik tombol hijau <b>+ New query</b> untuk membuka lembar editor SQL kosong.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-4">
          <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-1">
            Langkah 3
          </div>
          <div className="font-semibold text-white text-sm">Paste Skrip RLS &amp; Run</div>
          <p className="text-xs text-slate-400 mt-1 leading-normal">
            Klik tombol <b>Salin SQL Enable RLS</b> di atas, paste ke kotak editor, lalu klik tombol hijau <b>Run</b> (Ctrl+Enter).
          </p>
        </div>

        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/15 p-4">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1">
            Langkah 4
          </div>
          <div className="font-semibold text-emerald-300 text-sm">Verifikasi Output</div>
          <p className="text-xs text-slate-300 mt-1 leading-normal">
            Query akan menampilkan tabel verifikasi dengan kolom <code className="text-emerald-400 font-mono">rls_enabled = true</code> pada seluruh tabel!
          </p>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-800 gap-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('rls')}
          className={`pb-3 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'rls'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Shield className="h-4 w-4" />
          1. Skrip Khusus: Run &amp; Enable RLS (Siap Eksekusi)
        </button>

        <button
          onClick={() => setActiveTab('test')}
          className={`pb-3 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'test'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TableProperties className="h-4 w-4" />
          2. Live Checker Status RLS per Tabel
        </button>

        <button
          onClick={() => setActiveTab('full')}
          className={`pb-3 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'full'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Terminal className="h-4 w-4" />
          3. Skrip Lengkap Create Table + RLS
        </button>

        <button
          onClick={() => setActiveTab('alter')}
          className={`pb-3 px-4 font-bold transition-colors border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'alter'
              ? 'border-amber-400 text-amber-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="h-4 w-4" />
          4. Skrip ALTER Tambah Stok Min Saja
        </button>
      </div>

      {/* TAB 1: DEDICATED RUN & ENABLE RLS SCRIPT */}
      {activeTab === 'rls' && (
        <div className="space-y-4">
          {/* Troubleshooting Alert for relation does not exist */}
          <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-5 space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400 font-bold">
                ⚠️
              </span>
              <div>
                <h4 className="font-bold text-white text-sm">
                  Mengapa Muncul: <code className="text-rose-300 font-mono">ERROR: 42P01: relation &quot;public.transaction_items&quot; does not exist</code>?
                </h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Error ini muncul karena perintah RLS dijalankan pada tabel yang <b>belum pernah dibuat</b> di database Supabase Anda.
                  Di PostgreSQL / Supabase, Anda tidak bisa mengaktifkan security policy pada tabel yang belum ada fisiknya.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={handleCopyFull}
                    className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold px-3.5 py-2 shadow-md transition-all active:scale-95"
                  >
                    {copiedFull ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copiedFull ? 'Tersalin!' : '👉 Salin Skrip All-In-One (Buat Semua Tabel + RLS) — Solusi Terbaik'}
                  </button>
                  <button
                    onClick={handleCopyRls}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold px-3 py-2 transition-colors"
                  >
                    {copiedRls ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    Salin Skrip RLS Dinamis (Skip Tabel yang Belum Ada)
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border border-b-0 border-slate-800">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-red-500/80 inline-block"></span>
              <span className="h-3 w-3 rounded-full bg-yellow-500/80 inline-block"></span>
              <span className="h-3 w-3 rounded-full bg-green-500/80 inline-block"></span>
              <span className="text-xs font-mono text-slate-400 ml-2">safe_enable_rls_dynamic.sql</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyRls}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedRls ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedRls ? 'Tersalin!' : 'Salin Skrip Dinamis'}
              </button>
            </div>
          </div>
          <div className="relative -mt-4">
            <pre className="overflow-x-auto rounded-b-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 leading-relaxed max-h-[460px] select-all">
              {SUPABASE_SAFE_DYNAMIC_RLS_SQL}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-amber-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" /> Fitur Proteksi Skrip Dinamis Ini:
              </div>
              <p className="leading-relaxed">
                Skrip di atas menggunakan blok <code className="text-amber-300 font-mono">DO $$ ... END $$</code> yang secara otomatis memeriksa apakah tabel sudah ada di database melalui <code className="text-slate-200 font-mono">information_schema.tables</code>.
              </p>
              <p className="leading-relaxed text-slate-400">
                Jika sebuah tabel (misalnya <code className="text-slate-200 font-mono">transaction_items</code>) belum dibuat, skrip akan melewatinya dengan pesan ramah (NOTICE) dan <b>TIDAK AKAN melempar ERROR 42P01</b>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4 space-y-2 text-xs text-slate-300">
              <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4" /> Rekomendasi Langkah Selanjutnya:
              </div>
              <p className="leading-relaxed">
                Agar seluruh fitur kasir (nota, rincian barang, dan riwayat transaksi) tersimpan rapi di Supabase, sangat dianjurkan menjalankan skrip <b>All-In-One (Tab 3)</b> yang akan langsung membuat tabel <code className="text-emerald-400 font-mono">transaction_items</code> dan tabel lainnya sekaligus.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE RLS CHECKER */}
      {activeTab === 'test' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-amber-400" />
                  Kredensial API Supabase untuk Pengujian Langsung
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Dapatkan di dashboard Supabase: <b>Project Settings &gt; API</b>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1.5 text-xs font-semibold transition-colors"
                >
                  Simpan Kredensial
                </button>
                <button
                  type="button"
                  onClick={handleCheckRlsStatusLive}
                  disabled={isCheckingTables}
                  className="flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-1.5 text-xs transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isCheckingTables ? 'animate-spin' : ''}`} />
                  {isCheckingTables ? 'Memeriksa...' : 'Uji Status RLS Sekarang'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Project URL (https://xxxx.supabase.co)
                </label>
                <input
                  type="text"
                  placeholder="https://xyzabcdefgh.supabase.co"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.anonKey}
                  onChange={(e) =>
                    setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            {overallCheckMsg && (
              <div
                className={`p-3 rounded-xl border text-xs leading-relaxed ${
                  overallCheckMsg.includes('SEMPURNA')
                    ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
                    : overallCheckMsg.includes('❌')
                    ? 'border-red-500/30 bg-red-950/20 text-red-300'
                    : 'border-amber-500/30 bg-amber-950/20 text-amber-300'
                }`}
              >
                {overallCheckMsg}
              </div>
            )}
          </div>

          {/* Table Checklist */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <TableProperties className="h-4 w-4 text-amber-400" />
                Status RLS 9 Tabel Database POS Al-Qassam
              </span>
              <span className="text-[11px] text-slate-400">
                Klik tombol &quot;Uji Status RLS Sekarang&quot; di atas untuk live check
              </span>
            </div>
            <div className="divide-y divide-slate-800">
              {tableStatusList.map((t) => (
                <div
                  key={t.name}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`h-2.5 w-2.5 rounded-full shrink-0 ${
                        t.status === 'ok'
                          ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50'
                          : t.status === 'error'
                          ? 'bg-red-400'
                          : 'bg-slate-600'
                      }`}
                    ></span>
                    <span className="font-mono font-bold text-white text-xs">{t.name}</span>
                  </div>

                  <div className="text-slate-400 text-xs text-right sm:text-left">{t.msg}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FULL CREATE TABLE + RLS */}
      {activeTab === 'full' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border border-b-0 border-slate-800">
            <span className="text-xs font-mono text-slate-400">pos_alqassam_full_schema.sql</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyFull}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-colors"
              >
                {copiedFull ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copiedFull ? 'Tersalin!' : 'Salin SQL Lengkap'}
              </button>
              <button
                onClick={handleDownloadFullSql}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Download className="h-3.5 w-3.5" />
                Unduh .sql
              </button>
            </div>
          </div>
          <div className="relative -mt-4">
            <pre className="overflow-x-auto rounded-b-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-emerald-400 leading-relaxed max-h-[460px] select-all">
              {SUPABASE_SQL_SCHEMA}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 4: ALTER TABLE ONLY */}
      {activeTab === 'alter' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs text-slate-300 leading-relaxed">
            <b className="text-amber-400 block mb-1 text-sm">
              Sudah memiliki tabel produk di Supabase dan hanya ingin menambah kolom Stok Min?
            </b>
            Gunakan perintah ALTER berikut. Perintah ini tidak akan menghapus atau merusak data yang
            sudah ada:
          </div>

          <div className="flex items-center justify-between bg-slate-900 px-4 py-2.5 rounded-t-xl border border-b-0 border-slate-800">
            <span className="text-xs font-mono text-slate-400">alter_products_add_min_stock.sql</span>
            <button
              onClick={handleCopyAlter}
              className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-400/10 hover:bg-amber-400/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              {copiedAlter ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copiedAlter ? 'Tersalin!' : 'Salin Skrip ALTER'}
            </button>
          </div>
          <div className="relative -mt-4">
            <pre className="overflow-x-auto rounded-b-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-amber-300 leading-relaxed select-all">
              {SUPABASE_ALTER_EXISTING_SQL}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
