import { useState } from 'react';
import { DeviceConfig, SupabaseConfig } from '../types';
import { DEVICE_PRESETS } from '../data/defaultData';
import {
  getSupabaseClient,
  testSupabaseConnection,
  generateQuickConnectLink
} from '../utils/supabaseSync';
import {
  Monitor,
  Tablet,
  Smartphone,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  ExternalLink,
  Layers,
  ArrowRight,
  Copy,
  Check,
  Share2,
  FileText
} from 'lucide-react';

interface MultiDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDevice: DeviceConfig;
  onSaveDevice: (device: DeviceConfig) => void;
  supabaseConfig: SupabaseConfig;
  onSaveSupabaseConfig: (cfg: SupabaseConfig) => void;
  onOpenSupabaseGuide: () => void;
  onTriggerSync?: () => Promise<void>;
}

export function MultiDeviceModal({
  isOpen,
  onClose,
  currentDevice,
  onSaveDevice,
  supabaseConfig,
  onSaveSupabaseConfig,
  onOpenSupabaseGuide,
  onTriggerSync
}: MultiDeviceModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(currentDevice.id);
  const [customName, setCustomName] = useState(currentDevice.name);
  const [deviceType, setDeviceType] = useState<DeviceConfig['type']>(currentDevice.type);

  // Cloud Config state
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Diagnostics state
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
    tables: { products: boolean; app_users: boolean; store_settings: boolean; transactions: boolean };
  } | null>(null);

  // Quick link copy feedback
  const [copiedLink, setCopiedLink] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof DEVICE_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setCustomName(preset.name);
    setDeviceType(preset.type);
  };

  const handleTestConnection = async () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      alert('Silakan isi URL dan Anon Key Supabase terlebih dahulu.');
      return;
    }
    setIsTesting(true);
    setTestResult(null);

    const client = getSupabaseClient(cleanUrl, cleanKey);
    if (!client) {
      setIsTesting(false);
      setTestResult({
        ok: false,
        message: 'Format URL atau Anon Key tidak valid.',
        tables: { products: false, app_users: false, store_settings: false, transactions: false }
      });
      return;
    }

    const res = await testSupabaseConnection(client);
    setIsTesting(false);
    setTestResult(res);
  };

  const handleCopyQuickLink = () => {
    const cleanUrl = url.trim();
    const cleanKey = anonKey.trim();
    if (!cleanUrl || !cleanKey) {
      alert('Isi URL dan Anon Key terlebih dahulu untuk membuat tautan cepat.');
      return;
    }
    const link = generateQuickConnectLink(cleanUrl, cleanKey);
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
    }).catch(() => {
      prompt('Salin tautan ini secara manual:', link);
    });
  };

  const handleManualSyncNow = async () => {
    if (onTriggerSync) {
      setIsSyncingNow(true);
      try {
        await onTriggerSync();
        setSaveSuccessMsg('Sinkronisasi cloud berhasil dijalankan!');
        setTimeout(() => setSaveSuccessMsg(null), 3000);
      } finally {
        setIsSyncingNow(false);
      }
    }
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedDevice: DeviceConfig = {
      id: selectedPresetId,
      name: customName.trim() || 'Perangkat Kasir',
      type: deviceType,
      lastRegistered: new Date().toISOString()
    };
    onSaveDevice(updatedDevice);

    const updatedCfg: SupabaseConfig = {
      ...supabaseConfig,
      url: url.trim(),
      anonKey: anonKey.trim(),
      connected: !!(url.trim() && anonKey.trim())
    };
    onSaveSupabaseConfig(updatedCfg);

    setSaveSuccessMsg('Pengaturan perangkat & database cloud berhasil disimpan!');
    setTimeout(() => {
      setSaveSuccessMsg(null);
      onClose();
    }, 1200);
  };

  const getDeviceIcon = (type: DeviceConfig['type']) => {
    if (type === 'mobile') return <Smartphone className="h-5 w-5 text-emerald-400" />;
    if (type === 'tablet') return <Tablet className="h-5 w-5 text-sky-400" />;
    return <Monitor className="h-5 w-5 text-amber-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Cpu className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-white">
                Multi-Device &amp; Sinkronisasi Cloud Realtime
              </h3>
              <p className="text-xs text-slate-400">
                Hubungkan PC 1, PC 2, Tablet 3, &amp; HP Android dalam 1 Database Toko Bersama
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSaveAll} className="flex-1 overflow-y-auto pr-1 mt-4 space-y-5">
          {/* Section 1: Device Preset Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="h-4 w-4 text-amber-400" />
                1. Pilih Peran Perangkat Ini Saat Ini:
              </label>
              <span className="text-[11px] text-amber-400 font-mono">
                Aktif: {currentDevice.name}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {DEVICE_PRESETS.map((preset) => {
                const isSelected = selectedPresetId === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 text-xs ${
                      isSelected
                        ? 'border-amber-400 bg-amber-500/10 text-white shadow-md shadow-amber-500/10'
                        : 'border-slate-800 bg-slate-950/70 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getDeviceIcon(preset.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-xs flex items-center justify-between">
                        <span>{preset.name}</span>
                        {isSelected && (
                          <span className="h-2 w-2 rounded-full bg-amber-400"></span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 leading-tight">
                        {preset.desc}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Custom Name Override */}
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Label / Nama Perangkat Kustom
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                  placeholder="Misal: PC Kasir Depan, Tablet Gudang"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Tipe Form Factor
                </label>
                <select
                  value={deviceType}
                  onChange={(e) => setDeviceType(e.target.value as DeviceConfig['type'])}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                >
                  <option value="desktop">Desktop / Laptop</option>
                  <option value="tablet">Tablet Touchscreen</option>
                  <option value="mobile">Smartphone Android</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Shared Supabase Database Connection */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div>
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-400" />
                  2. Kredensial Database Cloud Supabase (Satu Database untuk Semua Device)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Hubungkan database agar akun kasir, logo, alamat, produk &amp; stok tersinkron otomatis.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSupabaseGuide();
                }}
                className="text-[11px] text-amber-400 hover:underline inline-flex items-center gap-1"
              >
                Lihat Skrip SQL <ArrowRight className="h-3 w-3" />
              </button>
            </div>

            <div className="space-y-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="text"
                  placeholder="https://xyzabcdefgh.supabase.co"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Anon Public Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-amber-400 focus:outline-none font-mono"
                />
              </div>
            </div>

            {/* Diagnostics & Quick Actions */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting || !url || !anonKey}
                className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                {isTesting ? 'Menguji...' : 'Uji Koneksi Database'}
              </button>

              <button
                type="button"
                onClick={handleCopyQuickLink}
                disabled={!url || !anonKey}
                className="rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 text-xs font-semibold text-amber-300 inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {copiedLink ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5" />}
                {copiedLink ? 'Tautan Tersalin!' : 'Salin Tautan Cepat untuk PC 1, 2, 3'}
              </button>

              {onTriggerSync && (
                <button
                  type="button"
                  onClick={handleManualSyncNow}
                  disabled={isSyncingNow || !url || !anonKey}
                  className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 text-xs font-semibold text-emerald-300 inline-flex items-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
                  {isSyncingNow ? 'Menyinkronkan...' : 'Tarik & Sinkronkan Sekarang'}
                </button>
              )}
            </div>

            {/* Test Connection Results Card */}
            {testResult && (
              <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${testResult.ok ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-300' : 'border-rose-500/40 bg-rose-950/20 text-rose-300'}`}>
                <div className="font-bold flex items-center gap-1.5">
                  {testResult.ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <AlertCircle className="h-4 w-4 text-rose-400" />}
                  {testResult.message}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <span className={testResult.tables.products ? 'text-emerald-400' : 'text-rose-400'}>
                    Produk: {testResult.tables.products ? '✓ Aktif' : '✗ Belum Ada'}
                  </span>
                  <span className={testResult.tables.app_users ? 'text-emerald-400' : 'text-rose-400'}>
                    Akun Kasir: {testResult.tables.app_users ? '✓ Aktif' : '✗ Belum Ada'}
                  </span>
                  <span className={testResult.tables.store_settings ? 'text-emerald-400' : 'text-rose-400'}>
                    Identitas Toko: {testResult.tables.store_settings ? '✓ Aktif' : '✗ Belum Ada'}
                  </span>
                  <span className={testResult.tables.transactions ? 'text-emerald-400' : 'text-rose-400'}>
                    Transaksi: {testResult.tables.transactions ? '✓ Aktif' : '✗ Belum Ada'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Cara Kerja Tautan Cepat Multi-Device */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/15 p-4 space-y-2 text-xs">
            <div className="font-bold text-amber-300 flex items-center gap-1.5">
              <Share2 className="h-4 w-4 text-amber-400" />
              💡 Solusi Mudah Menghubungkan Komputer 1, 2, dan 3:
            </div>
            <p className="text-slate-300 text-[11.5px] leading-relaxed">
              Anda <b>tidak perlu mengetik URL dan Anon Key panjang</b> di setiap komputer. Cukup klik tombol <b>&quot;Salin Tautan Cepat untuk PC 1, 2, 3&quot;</b> di atas, lalu kirim via WhatsApp Web / email ke Komputer 1, 2, dan 3. Saat link dibuka di browser komputer, seluruh database, logo, alamat, dan akun kasir otomatis tersambung dalam 1 detik!
            </p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-950/20 text-emerald-300 text-xs font-semibold text-center animate-fade-in">
              {saveSuccessMsg}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 px-4 py-2 text-xs font-semibold text-slate-300 transition-colors"
            >
              Tutup
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all active:scale-95"
            >
              Simpan &amp; Aktifkan Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
