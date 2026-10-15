import { Transaction, Branding, PrinterConfig } from '../types';
import { formatRupiah } from '../utils/storage';
import { Printer, X } from 'lucide-react';

interface ThermalReceiptProps {
  transaction: Transaction | null;
  branding: Branding;
  printerConfig: PrinterConfig;
  onClose: () => void;
}

export function ThermalReceipt({
  transaction,
  branding,
  printerConfig,
  onClose
}: ThermalReceiptProps) {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const is80mm = printerConfig.paperWidth === '80mm';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs receipt-modal-overlay">
      <div className="w-full max-w-sm rounded-2xl border border-slate-700 bg-slate-900 p-5 shadow-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Printer className="h-4 w-4 text-amber-400" />
            Struk Belanja Kasir
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Paper Preview */}
        <div className="flex-1 overflow-y-auto my-3 bg-white text-black p-4 rounded-lg font-mono text-xs shadow-inner">
          <div id="receipt-print-area" className={`mx-auto ${is80mm ? 'max-w-[80mm]' : 'max-w-[58mm]'}`}>
            {printerConfig.showLogo && branding.storeLogo && (
              <div className="text-center mb-2">
                <img
                  src={branding.storeLogo}
                  alt="Logo"
                  className="h-10 w-10 mx-auto object-cover rounded"
                />
              </div>
            )}

            <div className="text-center font-bold text-sm uppercase">
              {branding.storeName || 'POS AL-QASSAM ANALYST'}
            </div>

            {printerConfig.address && (
              <div className="text-center text-[10px] text-gray-700 mt-0.5">
                {printerConfig.address}
              </div>
            )}

            {printerConfig.phone && (
              <div className="text-center text-[10px] text-gray-700">
                Telp: {printerConfig.phone}
              </div>
            )}

            <div className="my-2 border-b border-dashed border-gray-400"></div>

            <div className="text-[10px] space-y-0.5">
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{new Date(transaction.date).toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between">
                <span>No. TRX:</span>
                <span>{transaction.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Kasir:</span>
                <span>{transaction.cashier}</span>
              </div>
              <div className="flex justify-between">
                <span>Mode:</span>
                <span className="capitalize">{transaction.mode}</span>
              </div>
            </div>

            <div className="my-2 border-b border-dashed border-gray-400"></div>

            {/* Items */}
            <div className="space-y-1.5 text-[11px]">
              {transaction.items.map((item, idx) => (
                <div key={idx}>
                  <div className="font-bold">{item.name}</div>
                  <div className="flex justify-between text-[10px] text-gray-800 pl-2">
                    <span>
                      {item.qty} &times; {formatRupiah(item.price)}
                    </span>
                    <span className="font-bold">{formatRupiah(item.qty * item.price)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="my-2 border-b border-dashed border-gray-400"></div>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatRupiah(transaction.subtotal || transaction.total)}</span>
              </div>
              {transaction.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span>-{formatRupiah(transaction.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm pt-1 border-t border-gray-800">
                <span>TOTAL</span>
                <span>{formatRupiah(transaction.total)}</span>
              </div>
            </div>

            <div className="my-3 border-b border-dashed border-gray-400"></div>

            <div className="text-center text-[10px] text-gray-600">
              {printerConfig.footer || 'Terima kasih atas kunjungan Anda!'}
            </div>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 text-xs transition-all shadow-md active:scale-95"
          >
            <Printer className="h-4 w-4" />
            Cetak Struk Sekarang
          </button>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 px-4 py-2.5 text-xs font-semibold"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
