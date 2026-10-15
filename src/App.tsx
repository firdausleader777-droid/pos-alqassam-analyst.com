import { useState, useEffect, useRef } from 'react';
import {
  Product,
  Transaction,
  Purchase,
  Supplier,
  User,
  Branding,
  PrinterConfig,
  DeviceConfig,
  SupabaseConfig
} from './types';
import {
  DEFAULT_PRODUCTS,
  DEFAULT_SUPPLIERS,
  DEFAULT_USERS,
  DEFAULT_BRANDING,
  DEFAULT_PRINTER,
  DEFAULT_DEVICE,
  ALL_MENU_IDS,
  CASHIER_DEFAULT_MENU_IDS
} from './data/defaultData';
import { DB } from './utils/storage';
import {
  getSupabaseClient,
  subscribeStoreRealtime,
  pushTransactionToSupabase,
  pushStockDeductionsToSupabase,
  pushProductToSupabase,
  fetchRemoteProducts
} from './utils/supabaseSync';

// Views & Components
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { ProductManagement } from './components/ProductManagement';
import { PurchasesView } from './components/PurchasesView';
import { ReportsView } from './components/ReportsView';
import { YearlyModalView } from './components/YearlyModalView';
import { SuppliersView } from './components/SuppliersView';
import { ImportExportView } from './components/ImportExportView';
import { AiInsightView } from './components/AiInsightView';
import { SupabaseGuideView } from './components/SupabaseGuideView';
import { PrinterSettingsView } from './components/PrinterSettingsView';
import { StoreSettingsView } from './components/StoreSettingsView';
import { UsersView } from './components/UsersView';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { ThermalReceipt } from './components/ThermalReceipt';
import { MultiDeviceModal } from './components/MultiDeviceModal';

import {
  LayoutDashboard,
  ReceiptText,
  Package,
  ShoppingCart,
  TrendingUp,
  Coins,
  Truck,
  FileSpreadsheet,
  Sparkles,
  Database,
  Printer,
  Settings,
  Users,
  LogOut,
  Menu,
  X,
  Lock,
  User as UserIcon,
  Wifi,
  WifiOff,
  AlertTriangle,
  Monitor,
  Tablet,
  Smartphone,
  Cpu,
  Camera,
  ExternalLink,
  FileText,
  Check
} from 'lucide-react';

export default function App() {
  // Database States
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = DB.get<Product[]>('products', DEFAULT_PRODUCTS);
    // Ensure all products have minStock defined
    return saved.map((p) => ({
      ...p,
      minStock: p.minStock !== undefined ? p.minStock : 5
    }));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() =>
    DB.get<Transaction[]>('transactions', [])
  );

  const [purchases, setPurchases] = useState<Purchase[]>(() =>
    DB.get<Purchase[]>('purchases', [])
  );

  const [suppliers, setSuppliers] = useState<Supplier[]>(() =>
    DB.get<Supplier[]>('suppliers', DEFAULT_SUPPLIERS)
  );

  const [users, setUsers] = useState<User[]>(() => {
    const saved = DB.get<User[]>('users', DEFAULT_USERS);
    return saved.map((u) => ({
      ...u,
      permissions:
        u.permissions && u.permissions.length > 0
          ? u.permissions
          : u.role === 'admin'
          ? ALL_MENU_IDS
          : CASHIER_DEFAULT_MENU_IDS
    }));
  });

  const [branding, setBranding] = useState<Branding>(() =>
    DB.get<Branding>('branding', DEFAULT_BRANDING)
  );

  const [printerConfig, setPrinterConfig] = useState<PrinterConfig>(() =>
    DB.get<PrinterConfig>('printerConfig', DEFAULT_PRINTER)
  );

  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>(() =>
    DB.get<Record<string, number>>('openingBalances', {})
  );

  // Multi-Device & Supabase States
  const [currentDevice, setCurrentDevice] = useState<DeviceConfig>(() =>
    DB.get<DeviceConfig>('currentDevice', DEFAULT_DEVICE)
  );
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(() =>
    DB.get<SupabaseConfig>('supabaseConfig', { url: '', anonKey: '', connected: false })
  );
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [cloudSyncStatus, setCloudSyncStatus] = useState<
    'connected' | 'connecting' | 'disconnected' | 'offline' | 'error'
  >(supabaseConfig.connected ? 'connecting' : 'offline');
  const [cloudSyncMsg, setCloudSyncMsg] = useState('');
  const [realtimeNotification, setRealtimeNotification] = useState<string | null>(null);

  // App Session States
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const sess = DB.get<User | null>('session', null);
    if (!sess) return null;
    return {
      ...sess,
      permissions:
        sess.permissions && sess.permissions.length > 0
          ? sess.permissions
          : sess.role === 'admin'
          ? ALL_MENU_IDS
          : CASHIER_DEFAULT_MENU_IDS
    };
  });
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');

  const [currentPage, setCurrentPage] = useState<string>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Scanner & Receipt States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannerTarget, setScannerTarget] = useState<'cart' | 'barcode' | 'purchase'>('cart');
  const [scannerResult, setScannerResult] = useState<string | null>(null);
  const [currentReceipt, setCurrentReceipt] = useState<Transaction | null>(null);

  // Listen to Online/Offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Realtime Supabase Multi-Device Synchronization
  useEffect(() => {
    if (supabaseConfig.url && supabaseConfig.anonKey) {
      const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
      if (client) {
        // Initial fetch remote products to synchronize
        fetchRemoteProducts(client).then((remoteProds) => {
          if (remoteProds && remoteProds.length > 0) {
            setProducts(remoteProds);
            DB.set('products', remoteProds);
          }
        });

        const unsubscribe = subscribeStoreRealtime(client, currentDevice, {
          onProductUpdate: (updatedProd) => {
            setProducts((prev) => {
              const idx = prev.findIndex((p) => p.id === updatedProd.id);
              let nextList: Product[];
              if (idx >= 0) {
                nextList = [...prev];
                nextList[idx] = updatedProd;
              } else {
                nextList = [...prev, updatedProd];
              }
              DB.set('products', nextList);
              return nextList;
            });
            setRealtimeNotification(`⚡ Stok ${updatedProd.name} disinkronkan (${updatedProd.stock} pcs)`);
            setTimeout(() => setRealtimeNotification(null), 3500);
          },
          onProductDelete: (prodId) => {
            setProducts((prev) => {
              const nextList = prev.filter((p) => p.id !== prodId);
              DB.set('products', nextList);
              return nextList;
            });
          },
          onTransactionInsert: (incomingTrx) => {
            setTransactions((prev) => {
              if (prev.some((t) => t.id === incomingTrx.id)) return prev;
              const nextList = [...prev, incomingTrx];
              DB.set('transactions', nextList);
              return nextList;
            });
            setRealtimeNotification(`🛒 Transaksi dari ${incomingTrx.deviceName || incomingTrx.cashier} (Rp ${incomingTrx.total.toLocaleString('id-ID')})`);
            setTimeout(() => setRealtimeNotification(null), 3500);
          },
          onStatusChange: (status, msg) => {
            setCloudSyncStatus(status);
            setCloudSyncMsg(msg || '');
          }
        });

        return () => {
          unsubscribe();
        };
      }
    } else {
      setCloudSyncStatus('offline');
      setCloudSyncMsg('Supabase belum dihubungkan');
    }
  }, [supabaseConfig.url, supabaseConfig.anonKey, currentDevice.id]);

  // Save to DB on change
  const updateProducts = (newProds: Product[]) => {
    setProducts(newProds);
    DB.set('products', newProds);
  };

  const updateTransactions = (newTrxs: Transaction[]) => {
    setTransactions(newTrxs);
    DB.set('transactions', newTrxs);
  };

  const updatePurchases = (newPurchases: Purchase[]) => {
    setPurchases(newPurchases);
    DB.set('purchases', newPurchases);
  };

  const updateSuppliers = (newSuppliers: Supplier[]) => {
    setSuppliers(newSuppliers);
    DB.set('suppliers', newSuppliers);
  };

  const updateUsers = (newUsers: User[]) => {
    setUsers(newUsers);
    DB.set('users', newUsers);
  };

  const updateBranding = (newBranding: Branding) => {
    setBranding(newBranding);
    DB.set('branding', newBranding);
  };

  const updatePrinter = (newCfg: PrinterConfig) => {
    setPrinterConfig(newCfg);
    DB.set('printerConfig', newCfg);
  };

  const updateOpeningBalances = (year: string, amount: number) => {
    const updated = { ...openingBalances, [year]: amount };
    setOpeningBalances(updated);
    DB.set('openingBalances', updated);
  };

  // Auth Handlers
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const found = users.find(
      (u) =>
        u.username.toLowerCase() === loginUsername.trim().toLowerCase() &&
        u.password === loginPassword
    );
    if (found) {
      setCurrentUser(found);
      DB.set('session', found);
      setLoginError('');
      setCurrentPage('dashboard');
    } else {
      setLoginError('Username atau password salah.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    DB.remove('session');
  };

  // Reset Database
  const handleResetDatabase = () => {
    if (
      confirm(
        'Yakin ingin MENGHAPUS SEMUA DATA?\nProduk, transaksi, supplier, dan pengaturan akan dihapus. Akun default admin tetap ada.'
      )
    ) {
      const confirmText = prompt('Ketik "RESET" dengan huruf besar untuk mengonfirmasi:');
      if (confirmText === 'RESET') {
        const resetAdmin = DEFAULT_USERS.filter((u) => u.username === 'admin');
        updateProducts(DEFAULT_PRODUCTS);
        updateTransactions([]);
        updatePurchases([]);
        updateSuppliers(DEFAULT_SUPPLIERS);
        updateUsers(resetAdmin);
        updateOpeningBalances(new Date().getFullYear().toString(), 0);
        alert('Semua data berhasil di-reset.');
        setCurrentPage('dashboard');
      }
    }
  };

  // Scanner Handler
  const handleScanCode = (code: string) => {
    setScannerResult(code);
    if (scannerTarget === 'cart') {
      const p = products.find(
        (x) =>
          x.barcode?.toLowerCase() === code.toLowerCase() ||
          x.sku.toLowerCase() === code.toLowerCase()
      );
      if (p) {
        if (p.stock <= 0) {
          alert(`Stok produk "${p.name}" sudah habis.`);
        }
      }
    }
  };

  // Device & Cloud Handlers
  const handleSaveDevice = (dev: DeviceConfig) => {
    setCurrentDevice(dev);
    DB.set('currentDevice', dev);
  };

  const handleSaveSupabaseConfig = (cfg: SupabaseConfig) => {
    setSupabaseConfig(cfg);
    DB.set('supabaseConfig', cfg);
  };

  // Checkout Handler
  const handleCheckout = (trx: Transaction) => {
    // Tag with current device
    const taggedTrx: Transaction = {
      ...trx,
      deviceId: currentDevice.id,
      deviceName: currentDevice.name
    };

    // 1. Deduct product stocks
    const updatedProds = products.map((prod) => {
      const foundItem = taggedTrx.items.find((item) => item.name === prod.name);
      if (foundItem) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - foundItem.qty)
        };
      }
      return prod;
    });
    updateProducts(updatedProds);

    // 2. Save transaction
    const updatedTrxs = [...transactions, taggedTrx];
    updateTransactions(updatedTrxs);

    // 3. Push to Supabase if connected
    const client = getSupabaseClient(supabaseConfig.url, supabaseConfig.anonKey);
    if (client && supabaseConfig.connected) {
      pushTransactionToSupabase(client, taggedTrx, currentDevice);
      const stockDeductions = updatedProds
        .filter((p) => taggedTrx.items.some((it) => it.name === p.name))
        .map((p) => ({ id: p.id, newStock: p.stock }));
      pushStockDeductionsToSupabase(client, stockDeductions);
    }

    // 4. Open receipt
    setCurrentReceipt(taggedTrx);
  };

  // Test Print
  const handleTestPrint = () => {
    setCurrentReceipt({
      id: 'TEST-' + Date.now(),
      date: new Date().toISOString(),
      cashier: currentUser?.name || 'Administrator',
      mode: 'retail',
      items: [
        { name: 'Contoh Produk Skincare 30ml', qty: 1, price: 45000 },
        { name: 'Masker Wajah Sheet Collagen', qty: 2, price: 8000 }
      ],
      subtotal: 61000,
      discount: 1000,
      total: 60000,
      profit: 22000
    });
  };

  // Save or Update User with custom menu permissions
  const handleSaveUser = (u: User) => {
    const existingIdx = users.findIndex((x) => x.username.toLowerCase() === u.username.toLowerCase());
    let updatedUsers: User[];
    if (existingIdx >= 0) {
      updatedUsers = [...users];
      updatedUsers[existingIdx] = u;
    } else {
      updatedUsers = [...users, u];
    }
    updateUsers(updatedUsers);

    // If current user modified their own user record, update session
    if (currentUser?.username.toLowerCase() === u.username.toLowerCase()) {
      setCurrentUser(u);
      DB.set('session', u);
    }
  };

  // Low stock badge count for sidebar
  const lowStockCount = products.filter((p) => p.stock <= (p.minStock ?? 5)).length;

  // -------------------------------------------------------------
  // 1. LOGIN SCREEN
  // -------------------------------------------------------------
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950/40 flex items-center justify-center p-4">
        <div className="w-full max-w-sm rounded-3xl border border-amber-500/20 bg-slate-900/90 p-8 shadow-2xl backdrop-blur-md">
          {/* Logo Mark */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 p-0.5 shadow-lg shadow-amber-500/20 flex items-center justify-center mb-3">
              {branding.appLogo ? (
                <img
                  src={branding.appLogo}
                  alt="Logo"
                  className="h-full w-full object-cover rounded-[14px]"
                />
              ) : (
                <span className="text-3xl">💎</span>
              )}
            </div>
            <h1 className="text-xl font-black tracking-tight text-white">
              POS <span className="text-amber-400">Al-Qassam</span> Analyst
            </h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">
              Sistem Kasir &amp; Manajemen Stok
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Username
              </label>
              <div className="relative">
                <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="admin"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white focus:border-amber-400 focus:outline-none"
                />
              </div>
            </div>

            {loginError && (
              <div className="text-xs text-red-400 bg-red-950/30 p-2.5 rounded-lg border border-red-500/20 text-center">
                {loginError}
              </div>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-amber-500/20 hover:brightness-105 transition-all active:scale-98"
            >
              Masuk ke Aplikasi
            </button>
          </form>

          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-center text-[11px] text-slate-400 leading-relaxed">
            Akun default admin: <b className="text-amber-400 font-mono">admin</b> /{' '}
            <b className="text-amber-400 font-mono">admin123</b>
          </div>
        </div>
      </div>
    );
  }

  // Daftar hak akses menu pengguna yang sedang login (dikonfigurasi oleh Admin)
  const userPermissions =
    currentUser.permissions && currentUser.permissions.length > 0
      ? currentUser.permissions
      : currentUser.role === 'admin'
      ? ALL_MENU_IDS
      : CASHIER_DEFAULT_MENU_IDS;

  const allPossibleNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pos', label: 'Kasir (POS)', icon: ReceiptText },
    {
      id: 'products',
      label: 'Produk (Stok & Min)',
      icon: Package,
      badge: lowStockCount > 0 ? `${lowStockCount}` : undefined
    },
    { id: 'purchases', label: 'Pembelian (Restock)', icon: ShoppingCart },
    { id: 'reports', label: 'Laporan Penjualan', icon: TrendingUp },
    { id: 'modal', label: 'Modal & Tahunan', icon: Coins },
    { id: 'suppliers', label: 'Data Supplier', icon: Truck },
    { id: 'io', label: 'Import / Export Excel', icon: FileSpreadsheet },
    { id: 'insight', label: 'AI Insight', icon: Sparkles },
    ...(!branding.hideDatabaseMenu
      ? [
          {
            id: 'cloud',
            label: 'Panduan Supabase (SQL)',
            icon: Database,
            highlight: true
          }
        ]
      : []),
    { id: 'printer', label: 'Setting Printer', icon: Printer },
    { id: 'settings', label: 'Identitas & Logo', icon: Settings },
    { id: 'users', label: 'Pengguna & Akses', icon: Users }
  ];

  // Filter menu navigasi berdasarkan izin hak akses yang ditentukan oleh Admin
  const navItems = allPossibleNavItems.filter((item) =>
    userPermissions.includes(item.id)
  );

  // Proteksi otomatis: jika halaman aktif tidak diizinkan, arahkan ke menu pertama yang diizinkan
  useEffect(() => {
    if (currentUser) {
      if (!userPermissions.includes(currentPage)) {
        const fallback = userPermissions.includes('pos')
          ? 'pos'
          : navItems[0]?.id || 'dashboard';
        setCurrentPage(fallback);
      }
    }
  }, [currentUser, currentPage, userPermissions, navItems]);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Backdrop overlay for mobile drawer */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-30 lg:hidden transition-opacity cursor-pointer"
          title="Klik di luar untuk menutup menu"
        />
      )}

      {/* -------------------------------------------------------------
          2. SIDEBAR
      ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[85vw] transform bg-slate-900 border-r border-slate-800 flex flex-col transition-all duration-200 ease-in-out ${
          isSidebarOpen
            ? 'translate-x-0 shadow-2xl'
            : '-translate-x-full'
        } ${
          isDesktopSidebarCollapsed
            ? 'lg:-translate-x-full lg:w-0 lg:border-none lg:overflow-hidden'
            : 'lg:static lg:translate-x-0 lg:w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-bold text-white shadow-md shadow-amber-500/20 overflow-hidden shrink-0">
              {branding.appLogo ? (
                <img src={branding.appLogo} alt="Logo" className="h-full w-full object-cover" />
              ) : (
                '💎'
              )}
            </div>
            <div>
              <div className="font-extrabold text-sm text-white tracking-tight">
                Al-Qassam
              </div>
              <div className="text-[10px] text-amber-400 font-semibold tracking-wider uppercase">
                POS Analyst
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsDesktopSidebarCollapsed(true);
            }}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition-colors"
            title="Tutup Menu"
          >
            <span className="text-[11px] font-medium">Tutup</span>
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentPage(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/10 font-bold'
                    : item.highlight
                    ? 'text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-slate-950' : item.highlight ? 'text-amber-400' : 'text-slate-400'}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Tools & Device Info in Sidebar */}
        <div className="p-3 border-t border-slate-800 space-y-1.5 bg-slate-900/40">
          <button
            onClick={() => {
              setIsDeviceModalOpen(true);
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-750 text-slate-200 border border-slate-700/80 text-xs transition-colors"
          >
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-amber-400 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-white truncate max-w-[130px]">
                  {currentDevice.name}
                </div>
                <div className="text-[10px] text-slate-400">Multi-Device Cloud</div>
              </div>
            </div>
            <span
              className={`h-2 w-2 rounded-full ${
                cloudSyncStatus === 'connected' ? 'bg-emerald-400' : 'bg-slate-500'
              }`}
            />
          </button>

          <a
            href="/privacy.html"
            target="_blank"
            rel="noreferrer"
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-slate-400 hover:text-emerald-300 text-[11px] transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" />
              Kebijakan Privasi (AAB)
            </span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>

        {/* User Foot */}
        <div className="p-3 border-t border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="text-xs">
              <div className="font-bold text-white truncate max-w-[130px]">{currentUser.name}</div>
              <div className="text-[10px] text-amber-400 uppercase font-mono font-semibold">
                {currentUser.role}
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
              title="Keluar / Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => {
              setIsSidebarOpen(false);
              setIsDesktopSidebarCollapsed(true);
            }}
            className="w-full mt-1 py-1.5 text-center text-[11px] text-slate-400 hover:text-amber-400 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center justify-center gap-1.5"
            title="Sembunyikan menu agar preview lebih luas"
          >
            <span>◀ Sembunyikan Menu (Layar Penuh)</span>
          </button>
        </div>
      </aside>

      {/* -------------------------------------------------------------
          3. MAIN CONTENT
      ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900 px-3 sm:px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                if (window.innerWidth >= 1024) {
                  setIsDesktopSidebarCollapsed((prev) => !prev);
                } else {
                  setIsSidebarOpen((prev) => !prev);
                }
              }}
              className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-750 transition-colors flex items-center gap-1.5 active:scale-95 shrink-0"
              title={
                isDesktopSidebarCollapsed
                  ? 'Tampilkan Menu'
                  : 'Sembunyikan Menu'
              }
            >
              <Menu className="h-5 w-5 text-amber-400" />
              <span className="text-xs font-semibold text-slate-200">
                Menu
              </span>
            </button>
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate max-w-[150px] sm:max-w-none">
              {navItems.find((n) => n.id === currentPage)?.label ||
                (currentPage === 'cloud' ? 'Panduan Supabase (SQL)' : 'Dashboard')}
            </h1>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 text-xs">
            {/* Multi-Device & Cloud Realtime Pill */}
            <button
              onClick={() => setIsDeviceModalOpen(true)}
              className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 border border-slate-750 hover:border-amber-400 text-xs text-white transition-all shadow-sm active:scale-95"
              title="Klik untuk ganti identitas perangkat atau setting cloud realtime"
            >
              {currentDevice.type === 'mobile' ? (
                <Smartphone className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
              ) : currentDevice.type === 'tablet' ? (
                <Tablet className="h-3.5 w-3.5 text-sky-400 shrink-0" />
              ) : (
                <Monitor className="h-3.5 w-3.5 text-amber-400 shrink-0" />
              )}
              <span className="font-bold truncate max-w-[85px] sm:max-w-[150px]">
                {currentDevice.name}
              </span>
              <span
                className={`h-2 w-2 rounded-full shrink-0 ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50'
                    : cloudSyncStatus === 'connecting'
                    ? 'bg-amber-400 animate-ping'
                    : 'bg-slate-500'
                }`}
                title={
                  cloudSyncStatus === 'connected'
                    ? 'Cloud Realtime Aktif'
                    : cloudSyncStatus === 'connecting'
                    ? 'Menghubungkan...'
                    : 'Mode Offline / Lokal'
                }
              />
            </button>

            {/* Online Status */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-300">
              {isOnline ? (
                <>
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Online</span>
                </>
              ) : (
                <>
                  <span className="h-2 w-2 rounded-full bg-red-400"></span>
                  <span className="text-red-300">Offline</span>
                </>
              )}
            </div>

            <span className="hidden md:inline text-slate-400">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>
        </header>

        {/* Realtime Broadcast Alert Banner */}
        {realtimeNotification && (
          <div className="bg-gradient-to-r from-amber-500/25 via-emerald-500/20 to-slate-900 border-b border-amber-500/30 px-4 py-2 text-xs font-semibold text-amber-300 flex items-center gap-2 animate-fade-in shrink-0">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="truncate">{realtimeNotification}</span>
          </div>
        )}

        {/* Scrollable View Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-950 pb-24 lg:pb-6">
          {currentPage === 'dashboard' && (
            <DashboardView
              products={products}
              transactions={transactions}
              onNavigate={(page) => setCurrentPage(page)}
            />
          )}

          {currentPage === 'pos' && (
            <PosView
              products={products}
              cashierName={currentUser.name}
              onCheckout={handleCheckout}
              onOpenScanner={() => {
                setScannerTarget('cart');
                setIsScannerOpen(true);
              }}
              onTriggerReceipt={(trx) => setCurrentReceipt(trx)}
            />
          )}

          {currentPage === 'products' && (
            <ProductManagement
              products={products}
              suppliers={suppliers}
              onSaveProduct={(p) => {
                const idx = products.findIndex((x) => x.id === p.id);
                if (idx >= 0) {
                  const updated = [...products];
                  updated[idx] = p;
                  updateProducts(updated);
                } else {
                  updateProducts([...products, p]);
                }
              }}
              onDeleteProduct={(id) => {
                updateProducts(products.filter((p) => p.id !== id));
              }}
              onOpenScanner={(target) => {
                setScannerTarget(target);
                setIsScannerOpen(true);
              }}
              scannerResult={scannerResult}
              onClearScannerResult={() => setScannerResult(null)}
            />
          )}

          {currentPage === 'purchases' && (
            <PurchasesView
              purchases={purchases}
              products={products}
              suppliers={suppliers}
              onSavePurchase={(newPu, newProds) => {
                updatePurchases([...purchases, newPu]);
                updateProducts(newProds);
              }}
              onDeletePurchase={(id) => {
                updatePurchases(purchases.filter((p) => p.id !== id));
              }}
              onOpenScanner={() => {
                setScannerTarget('purchase');
                setIsScannerOpen(true);
              }}
              scannerResult={scannerResult}
            />
          )}

          {currentPage === 'reports' && <ReportsView transactions={transactions} />}

          {currentPage === 'modal' && (
            <YearlyModalView
              products={products}
              transactions={transactions}
              openingBalances={openingBalances}
              onSaveOpeningBalance={updateOpeningBalances}
            />
          )}

          {currentPage === 'suppliers' && (
            <SuppliersView
              suppliers={suppliers}
              onSaveSupplier={(s) => {
                const idx = suppliers.findIndex((x) => x.id === s.id);
                if (idx >= 0) {
                  const updated = [...suppliers];
                  updated[idx] = s;
                  updateSuppliers(updated);
                } else {
                  updateSuppliers([...suppliers, s]);
                }
              }}
              onDeleteSupplier={(id) => {
                updateSuppliers(suppliers.filter((s) => s.id !== id));
              }}
            />
          )}

          {currentPage === 'io' && (
            <ImportExportView
              products={products}
              transactions={transactions}
              purchases={purchases}
              suppliers={suppliers}
              onImportProducts={(newProds) => {
                updateProducts([...products, ...newProds]);
              }}
              onResetDatabase={handleResetDatabase}
            />
          )}

          {currentPage === 'insight' && (
            <AiInsightView products={products} transactions={transactions} />
          )}

          {currentPage === 'cloud' && <SupabaseGuideView />}

          {currentPage === 'printer' && (
            <PrinterSettingsView
              printerConfig={printerConfig}
              onSavePrinterConfig={updatePrinter}
              onTestPrint={handleTestPrint}
            />
          )}

          {currentPage === 'settings' && (
            <StoreSettingsView
              branding={branding}
              onSaveBranding={updateBranding}
              onNavigateToDatabase={() => setCurrentPage('cloud')}
            />
          )}

          {currentPage === 'users' && (
            <UsersView
              users={users}
              currentUser={currentUser}
              onSaveUser={handleSaveUser}
              onDeleteUser={(username) =>
                updateUsers(users.filter((u) => u.username !== username))
              }
            />
          )}
        </main>
      </div>

      {/* -------------------------------------------------------------
          4. MODALS: Barcode Scanner, Thermal Receipt & MultiDevice
      ------------------------------------------------------------- */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={handleScanCode}
        title={
          scannerTarget === 'cart'
            ? 'Scan Barcode Kasir'
            : scannerTarget === 'purchase'
            ? 'Scan Barcode Pembelian Masuk'
            : 'Scan Barcode Produk'
        }
      />

      <ThermalReceipt
        transaction={currentReceipt}
        branding={branding}
        printerConfig={printerConfig}
        onClose={() => setCurrentReceipt(null)}
      />

      <MultiDeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        currentDevice={currentDevice}
        onSaveDevice={handleSaveDevice}
        supabaseConfig={supabaseConfig}
        onSaveSupabaseConfig={handleSaveSupabaseConfig}
        onOpenSupabaseGuide={() => setCurrentPage('cloud')}
      />

      {/* -------------------------------------------------------------
          5. MOBILE BOTTOM NAVIGATION (Android Smartphone Experience)
      ------------------------------------------------------------- */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-slate-900/95 border-t border-slate-800 px-2 py-1.5 flex items-center justify-around backdrop-blur-md shadow-2xl">
        <button
          onClick={() => setCurrentPage('pos')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
            currentPage === 'pos' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <ReceiptText className="h-4 w-4" />
          <span>Kasir POS</span>
        </button>

        <button
          onClick={() => setCurrentPage('products')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
            currentPage === 'products' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Package className="h-4 w-4" />
          <span>Produk</span>
        </button>

        {/* Quick Camera Scan Center Floating Button */}
        <button
          onClick={() => {
            setScannerTarget('cart');
            setIsScannerOpen(true);
          }}
          className="flex flex-col items-center justify-center h-11 w-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950 font-black shadow-lg shadow-amber-500/30 active:scale-95 -mt-3.5 border-2 border-slate-900"
          title="Scan Barcode Cepat Kamera"
        >
          <Camera className="h-5 w-5" />
        </button>

        <button
          onClick={() => setCurrentPage('reports')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
            currentPage === 'reports' ? 'text-amber-400 font-black' : 'text-slate-400 hover:text-white'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          <span>Laporan</span>
        </button>

        <button
          onClick={() => setIsSidebarOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all"
        >
          <Menu className="h-4 w-4" />
          <span>Menu Lain</span>
        </button>
      </div>
    </div>
  );
}
