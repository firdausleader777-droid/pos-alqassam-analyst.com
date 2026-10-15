import { Product, Supplier, User, Branding, PrinterConfig, MenuPermissionItem } from '../types';

export const DEFAULT_PRODUCTS: Product[] = [
  { id: 'P1', name: 'Serum Vitamin C 30ml', sku: 'SVC-30', barcode: '899123456001', category: 'Skincare', supplierId: 'S1', stock: 42, minStock: 10, buy: 28000, retail: 45000, grosir: 38000, grosirMin: 6 },
  { id: 'P2', name: 'Sabun Muka Whitening 100g', sku: 'SMW-01', barcode: '899123456002', category: 'Skincare', supplierId: 'S1', stock: 8, minStock: 12, buy: 12000, retail: 22000, grosir: 18000, grosirMin: 6 },
  { id: 'P3', name: 'Lipstik Matte Velvet Merah', sku: 'LPM-RD', barcode: '899123456003', category: 'Makeup', supplierId: 'S2', stock: 25, minStock: 8, buy: 15000, retail: 35000, grosir: 28000, grosirMin: 6 },
  { id: 'P4', name: 'Masker Wajah Sheet Collagen', sku: 'MWS-01', barcode: '899123456004', category: 'Skincare', supplierId: 'S1', stock: 110, minStock: 25, buy: 3000, retail: 8000, grosir: 6000, grosirMin: 12 },
  { id: 'P5', name: 'Parfum Mini Roll-On 15ml', sku: 'PRM-15', barcode: '899123456005', category: 'Fragrance', supplierId: 'S2', stock: 4, minStock: 10, buy: 20000, retail: 40000, grosir: 33000, grosirMin: 6 },
  { id: 'P6', name: 'Bedak Compact Natural Beige', sku: 'BDK-01', barcode: '899123456006', category: 'Makeup', supplierId: 'S2', stock: 0, minStock: 15, buy: 18000, retail: 32000, grosir: 27000, grosirMin: 6 },
];

export const DEFAULT_SUPPLIERS: Supplier[] = [
  { id: 'S1', name: 'PT Surya Kosmetika Indah', contact: '0812-9876-5432 / Pak Hendra', address: 'Kawasan Industri Cikarang Blok B4' },
  { id: 'S2', name: 'Distributor Cantik Bersinar', contact: '0857-1122-3344 / Bu Maria', address: 'Pasar Baru Trade Center Lt. 2 No. 18' }
];

export const ALL_MENU_PERMISSIONS: MenuPermissionItem[] = [
  { id: 'dashboard', label: 'Dashboard', description: 'Statistik omzet, laba harian, dan grafik ringkasan', category: 'operasional' },
  { id: 'pos', label: 'Kasir (POS)', description: 'Scan barcode, transaksi kasir, diskon, dan cetak struk', category: 'operasional' },
  { id: 'products', label: 'Produk (Stok & Min)', description: 'Kelola data produk, harga modal/eceran/grosir & stok minimum', category: 'manajemen' },
  { id: 'purchases', label: 'Pembelian (Restock)', description: 'Pencatatan barang masuk dari supplier & tambah stok otomatis', category: 'manajemen' },
  { id: 'reports', label: 'Laporan Penjualan', description: 'Laporan omzet, laba kotor, produk terlaris & riwayat nota', category: 'manajemen' },
  { id: 'modal', label: 'Modal & Tahunan', description: 'Nilai persediaan barang realtime & perbandingan kas tahunan', category: 'manajemen' },
  { id: 'suppliers', label: 'Data Supplier', description: 'Kontak dan alamat distributor/pemasok barang', category: 'manajemen' },
  { id: 'io', label: 'Import / Export Excel', description: 'Ekspor data ke file .xlsx dan impor massal produk', category: 'pengaturan' },
  { id: 'insight', label: 'AI Insight', description: 'Analisis pintar tren penjualan & evaluasi produk menipis', category: 'manajemen' },
  { id: 'cloud', label: 'Panduan Supabase (SQL)', description: 'Skrip database cloud, skema SQL dan pengujian koneksi', category: 'pengaturan' },
  { id: 'printer', label: 'Setting Printer', description: 'Pengaturan printer thermal 58mm/80mm dan kop struk', category: 'pengaturan' },
  { id: 'settings', label: 'Identitas & Logo', description: 'Nama toko, logo aplikasi, kop struk, dan privasi menu', category: 'pengaturan' },
  { id: 'users', label: 'Pengguna & Akses', description: 'Manajemen akun staf dan kontrol hak akses batasan menu', category: 'pengaturan' }
];

export const ALL_MENU_IDS = ALL_MENU_PERMISSIONS.map((m) => m.id);
export const CASHIER_DEFAULT_MENU_IDS = ['dashboard', 'pos'];

export const DEFAULT_USERS: User[] = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'Administrator',
    permissions: ALL_MENU_IDS
  },
  {
    username: 'kasir1',
    password: 'kasir123',
    role: 'kasir',
    name: 'Kasir Salsabila',
    permissions: CASHIER_DEFAULT_MENU_IDS
  }
];

export const DEFAULT_BRANDING: Branding = {
  storeName: 'POS Al-Qassam Analyst',
  appLogo: '',
  storeLogo: ''
};

export const DEFAULT_PRINTER: PrinterConfig = {
  paperWidth: '58mm',
  address: 'Jl. Pemuda No. 88, Pusat Niaga',
  phone: '0812-3456-7890',
  footer: 'Terima kasih telah berbelanja!',
  showLogo: true
};

export const DEVICE_PRESETS: { id: string; name: string; type: 'desktop' | 'tablet' | 'mobile'; desc: string }[] = [
  { id: 'pc-kasir-1', name: 'PC Kasir 1 (Utama)', type: 'desktop', desc: 'Komputer desktop kasir utama dekat pintu masuk' },
  { id: 'pc-kasir-2', name: 'PC Kasir 2 (Kasir Kedua)', type: 'desktop', desc: 'Komputer kasir meja kedua untuk antrean ramai' },
  { id: 'pc-tab-3', name: 'PC / Tablet 3 (Kasir / Gudang)', type: 'tablet', desc: 'Tablet touchscreen atau PC gudang untuk cek stok & kasir tambahan' },
  { id: 'hp-android-1', name: 'HP Android (Owner / Kasir Mobile)', type: 'mobile', desc: 'Smartphone Android untuk owner memantau omzet & scan barang mobile' }
];

export const DEFAULT_DEVICE = {
  id: 'pc-kasir-1',
  name: 'PC Kasir 1 (Utama)',
  type: 'desktop' as const
};
