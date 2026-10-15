import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/library';
import { X, Camera, AlertCircle, Volume2 } from 'lucide-react';
import { playBeep } from '../utils/storage';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
  continuous?: boolean;
}

export function BarcodeScannerModal({
  isOpen,
  onClose,
  onScan,
  title = 'Scan Barcode Produk',
  continuous = true
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('Menyiapkan kamera...');
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const lastScanTimeRef = useRef<number>(0);
  const [isContinuous, setIsContinuous] = useState(continuous);

  useEffect(() => {
    if (!isOpen) {
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {
          // ignore cleanup error
        }
        readerRef.current = null;
      }
      return;
    }

    setErrorMessage(null);
    setStatusMessage('Mengakses kamera perangkat...');

    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    codeReader
      .listVideoInputDevices()
      .then((videoInputDevices) => {
        if (!videoInputDevices.length) {
          setErrorMessage('Tidak ada kamera yang ditemukan pada perangkat ini.');
          return;
        }

        // Prefer rear/environment camera on phones
        const selectedDeviceId = videoInputDevices[videoInputDevices.length - 1].deviceId;
        setStatusMessage('Arahkan kamera ke barcode produk...');

        codeReader.decodeFromVideoDevice(
          selectedDeviceId,
          videoRef.current,
          (result) => {
            if (result) {
              const text = result.getText();
              const now = Date.now();
              // Prevent duplicate triggers within 1200ms for same barcode
              if (text === lastScanned && now - lastScanTimeRef.current < 1200) {
                return;
              }
              lastScanTimeRef.current = now;
              setLastScanned(text);
              playBeep();
              setStatusMessage(`✓ Berhasil scan: ${text}`);
              onScan(text);

              if (!isContinuous) {
                setTimeout(() => {
                  onClose();
                }, 500);
              }
            }
          }
        );
      })
      .catch((err) => {
        console.error('Camera access error:', err);
        setErrorMessage('Gagal mengakses kamera: ' + (err.message || 'Izin kamera ditolak.'));
      });

    return () => {
      if (readerRef.current) {
        try {
          readerRef.current.reset();
        } catch {
          // ignore
        }
        readerRef.current = null;
      }
    };
  }, [isOpen, onScan, isContinuous, onClose, lastScanned]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <Camera className="h-5 w-5 text-amber-400" />
            {title}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 relative overflow-hidden rounded-xl border border-slate-700 bg-black aspect-4/3 flex items-center justify-center">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            playsInline
            muted
          />
          {/* Target Scanning Crosshair Box */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="w-64 h-36 border-2 border-amber-400/80 rounded-lg relative">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -mt-0.5 -ml-0.5"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 -mt-0.5 -mr-0.5"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -mb-0.5 -ml-0.5"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 -mb-0.5 -mr-0.5"></div>
              <div className="absolute inset-x-0 top-1/2 h-0.5 bg-red-500/80 animate-pulse"></div>
            </div>
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-950/20 p-3 text-xs text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        ) : (
          <div className="mt-3 text-center text-xs text-slate-300 bg-slate-800/80 py-2 px-3 rounded-lg border border-slate-700/60 flex items-center justify-center gap-1.5">
            <Volume2 className="h-3.5 w-3.5 text-amber-400" />
            <span>{statusMessage}</span>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between pt-2 border-t border-slate-800">
          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isContinuous}
              onChange={(e) => setIsContinuous(e.target.checked)}
              className="rounded border-slate-700 bg-slate-800 text-amber-500 focus:ring-amber-500/30 h-4 w-4"
            />
            <span>Mode Kontinyu (Tembak berulang tanpa tutup)</span>
          </label>

          <button
            onClick={onClose}
            className="rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 px-4 py-2 text-xs font-semibold text-slate-200 transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
