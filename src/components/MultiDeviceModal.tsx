import { useState } from 'react';
import { DeviceConfig, SupabaseConfig } from '../types';
import { DEVICE_PRESETS } from '../data/defaultData';
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
  FileCode,
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
}

export function MultiDeviceModal({
  isOpen,
  onClose,
  currentDevice,
  onSaveDevice,
  supabaseConfig,
  onSaveSupabaseConfig,
  onOpenSupabaseGuide
}: MultiDeviceModalProps) {
  const [selectedPresetId, setSelectedPresetId] = useState(currentDevice.id);
  const [customName, setCustomName] = useState(currentDevice.name);
  const [deviceType, setDeviceType] = useState<DeviceConfig['type']>(currentDevice.type);

  // Cloud Config state
  const [url, setUrl] = useState(supabaseConfig.url || '');
  const [anonKey, setAnonKey] = useState(supabaseConfig.anonKey || '');
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectPreset = (preset: typeof DEVICE_PRESETS[0]) => {
    setSelectedPresetId(preset.id);
    setCustomName(preset.name);
    setDeviceType(preset.type);
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
                Hubungkan PC 1, PC 2, Tablet 3, &amp; HP Android dalam 1 Database Toko
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
                  Masukkan URL dan Anon Key yang sama di setiap PC/Tablet/HP di toko Anda.
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
          </div>

          {/* Section 3: Android Studio AAB & Privacy Policy link */}
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2 text-xs text-slate-300">
            <div className="flex items-center justify-between">
              <div className="font-bold text-emerald-300 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-emerald-400" />
                3. Dokumen Kebijakan Privasi (Google Play AAB Ready)
              </div>
              <a
                href="/privacy.html"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 inline-flex items-center gap-1 bg-emerald-500/15 px-2.5 py-1 rounded-lg border border-emerald-500/30 transition-colors"
              >
                Buka /privacy.html <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Halaman <code className="text-emerald-300 font-mono">/privacy.html</code> telah siap digunakan sebagai URL Kebijakan Privasi resmi saat Anda membuat file format <b>AAB (Android App Bundle)</b> di Android Studio untuk dipublikasikan ke Google Play Console.
            </p>
          </div>

          {/* Section 4: 3-Step Store Setup Guide */}
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4 space-y-2 text-xs">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4" /> Cara Kerja Multi-Device dalam 1 Toko:
            </div>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 text-[11px] leading-relaxed">
              <li><b>Perangkat 1 (PC Kasir Utama):</b> Masukkan URL &amp; Anon Key Supabase, pilih &quot;PC Kasir 1&quot;.</li>
              <li><b>Perangkat 2 &amp; 3 (PC Kasir 2 / Tablet 3):</b> Buka link toko yang sama, masukkan kredensial Supabase yang sama, pilih &quot;PC Kasir 2&quot; atau &quot;Tablet 3&quot;.</li>
              <li><b>Perangkat 4 (HP Android):</b> Buka di Chrome HP Android, pilih &quot;HP Android&quot;, tap &quot;Tambahkan ke Layar Utama&quot;.</li>
              <li><b>Otomatis Realtime:</b> Ketika PC 1 menjual Serum (stok berkurang 1), layar di PC 2, Tablet 3, dan HP Android otomatis langsung terupdate tanpa perlu refresh!</li>
            </ol>
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
              Batal
            </button>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:brightness-105 px-5 py-2 text-xs font-bold text-slate-950 shadow-md transition-all active:scale-95"
            >
              Simpan Identitas &amp; Aktifkan Sync
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
