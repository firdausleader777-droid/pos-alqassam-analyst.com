export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  supplierId: string;
  stock: number;
  minStock: number; // Kolom Stok Min tepat di samping Stok
  buy: number;
  retail: number;
  grosir: number;
  grosirMin: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  address: string;
}

export interface CartItem {
  id: string;
  name: string;
  qty: number;
  buy: number;
  retail: number;
  grosir: number;
  grosirMin: number;
}

export interface TransactionItem {
  name: string;
  qty: number;
  price: number;
}

export interface Transaction {
  id: string;
  date: string;
  cashier: string;
  deviceId?: string;
  deviceName?: string;
  mode: 'retail' | 'grosir';
  items: TransactionItem[];
  subtotal: number;
  discount: number;
  total: number;
  profit: number;
}

export interface PurchaseItem {
  productId: string;
  name: string;
  qty: number;
  buy: number;
}

export interface Purchase {
  id: string;
  date: string;
  supplierId: string;
  items: PurchaseItem[];
  total: number;
  note: string;
}

export interface User {
  username: string;
  password: string;
  role: 'admin' | 'kasir';
  name: string;
  permissions?: string[]; // Daftar ID menu yang diizinkan untuk pengguna ini
}

export interface MenuPermissionItem {
  id: string;
  label: string;
  description: string;
  category: 'operasional' | 'manajemen' | 'pengaturan';
}

export interface Branding {
  storeName: string;
  appLogo?: string;
  storeLogo?: string;
  hideDatabaseMenu?: boolean;
}

export interface PrinterConfig {
  paperWidth: '58mm' | '80mm';
  address: string;
  phone: string;
  footer: string;
  showLogo: boolean;
}

export interface DeviceConfig {
  id: string; // e.g. "pc-1", "pc-2", "tab-3", "hp-android"
  name: string; // "PC Kasir 1 (Utama)", "PC Kasir 2 (Reguler)", "Tablet 3 (Gudang/Kasir)", "HP Android (Mobile)"
  type: 'desktop' | 'tablet' | 'mobile';
  lastRegistered?: string;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  connected?: boolean;
  lastTested?: string;
  autoSync?: boolean;
  lastSyncTime?: string;
  syncStatus?: 'connected' | 'syncing' | 'offline' | 'error';
}
