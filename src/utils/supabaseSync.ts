import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Product, Transaction, Purchase, Supplier, DeviceConfig, User, Branding, PrinterConfig } from '../types';

let supabaseInstance: SupabaseClient | null = null;
let activeChannel: RealtimeChannel | null = null;

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  if (url && anonKey) {
    const cleanUrl = url.trim().replace(/\/$/, '');
    const cleanKey = anonKey.trim();
    if (cleanUrl && cleanKey) {
      if (!supabaseInstance) {
        supabaseInstance = createClient(cleanUrl, cleanKey, {
          realtime: {
            params: {
              eventsPerSecond: 10
            }
          }
        });
      }
      return supabaseInstance;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient(url: string, anonKey: string): SupabaseClient | null {
  if (activeChannel) {
    activeChannel.unsubscribe();
    activeChannel = null;
  }
  supabaseInstance = null;
  return getSupabaseClient(url, anonKey);
}

export interface RealtimeSyncHandlers {
  onProductUpdate?: (product: Product) => void;
  onProductDelete?: (productId: string) => void;
  onTransactionInsert?: (trx: Transaction) => void;
  onPurchaseInsert?: (purchase: Purchase) => void;
  onUserUpdate?: (user: User) => void;
  onUserDelete?: (username: string) => void;
  onStoreSettingsUpdate?: (branding: Branding, printerConfig: Partial<PrinterConfig>) => void;
  onSupplierUpdate?: (supplier: Supplier) => void;
  onStatusChange?: (status: 'connected' | 'connecting' | 'disconnected' | 'error', message?: string) => void;
}

export function subscribeStoreRealtime(
  client: SupabaseClient,
  currentDevice: DeviceConfig,
  handlers: RealtimeSyncHandlers
): () => void {
  if (activeChannel) {
    activeChannel.unsubscribe();
  }

  handlers.onStatusChange?.('connecting', 'Menghubungkan ke saluran realtime Supabase...');

  const channel = client
    .channel('pos_alqassam_realtime_store')
    // 1. Realtime Products (Stok, Harga, dsb)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'products' },
      (payload) => {
        if (payload.eventType === 'DELETE' && payload.old) {
          handlers.onProductDelete?.(payload.old.id);
        } else if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          const updatedProd: Product = {
            id: String(raw.id || ''),
            name: String(raw.name || ''),
            sku: String(raw.sku || ''),
            barcode: String(raw.barcode || ''),
            category: String(raw.category || 'Umum'),
            supplierId: String(raw.supplier_id || ''),
            stock: Number(raw.stock ?? 0),
            minStock: Number(raw.min_stock ?? 5),
            buy: Number(raw.buy ?? 0),
            retail: Number(raw.retail ?? 0),
            grosir: Number(raw.grosir ?? 0),
            grosirMin: Number(raw.grosir_min ?? 6)
          };
          handlers.onProductUpdate?.(updatedProd);
        }
      }
    )
    // 2. Realtime Transactions (Penjualan dari PC/device lain)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transactions' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          if (raw.device_id && raw.device_id === currentDevice.id) {
            return;
          }
          const incomingTrx: Transaction = {
            id: String(raw.id || ''),
            date: String(raw.date || new Date().toISOString()),
            cashier: String(raw.cashier || 'Kasir'),
            deviceId: raw.device_id ? String(raw.device_id) : undefined,
            deviceName: raw.device_name ? String(raw.device_name) : undefined,
            mode: (raw.mode === 'grosir' ? 'grosir' : 'retail'),
            items: [],
            subtotal: Number(raw.subtotal ?? 0),
            discount: Number(raw.discount ?? 0),
            total: Number(raw.total ?? 0),
            profit: Number(raw.profit ?? 0)
          };
          handlers.onTransactionInsert?.(incomingTrx);
        }
      }
    )
    // 3. Realtime Store Settings (Logo, Alamat, Nama Toko dari Owner di Android)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'store_settings' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          const branding: Branding = {
            storeName: String(raw.store_name || 'POS Al-Qassam Analyst'),
            appLogo: raw.app_logo ? String(raw.app_logo) : '',
            storeLogo: raw.store_logo ? String(raw.store_logo) : '',
            hideDatabaseMenu: Boolean(raw.hide_database_menu ?? false)
          };
          const printerConfig: Partial<PrinterConfig> = {
            paperWidth: (raw.printer_paper_width === '80mm' ? '80mm' : '58mm'),
            address: String(raw.printer_address || ''),
            phone: String(raw.printer_phone || ''),
            footer: String(raw.printer_footer || 'Terima kasih telah berbelanja!'),
            showLogo: Boolean(raw.printer_show_logo ?? true)
          };
          handlers.onStoreSettingsUpdate?.(branding, printerConfig);
        }
      }
    )
    // 4. Realtime App Users (Akun Kasir & Hak Akses baru)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'app_users' },
      (payload) => {
        if (payload.eventType === 'DELETE' && payload.old) {
          handlers.onUserDelete?.(String(payload.old.username));
        } else if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          let permissions: string[] | undefined;
          if (raw.permissions) {
            try {
              permissions = typeof raw.permissions === 'string' ? JSON.parse(raw.permissions) : (raw.permissions as string[]);
            } catch {
              permissions = undefined;
            }
          }
          const incomingUser: User = {
            username: String(raw.username || ''),
            password: String(raw.password || ''),
            name: String(raw.name || ''),
            role: (raw.role === 'admin' ? 'admin' : 'kasir'),
            permissions
          };
          handlers.onUserUpdate?.(incomingUser);
        }
      }
    )
    // 5. Realtime Suppliers
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'suppliers' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          const incomingSupplier: Supplier = {
            id: String(raw.id || ''),
            name: String(raw.name || ''),
            contact: String(raw.contact || ''),
            address: String(raw.address || '')
          };
          handlers.onSupplierUpdate?.(incomingSupplier);
        }
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        handlers.onStatusChange?.('connected', 'Terhubung ke Realtime Cloud (Multi-Device Aktif)');
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        handlers.onStatusChange?.('disconnected', 'Koneksi realtime terputus, beralih ke mode lokal');
      }
    });

  activeChannel = channel;

  return () => {
    channel.unsubscribe();
    if (activeChannel === channel) {
      activeChannel = null;
    }
  };
}

// ----------------------------------------------------------------------------
// PRODUCTS
// ----------------------------------------------------------------------------
export async function pushProductToSupabase(client: SupabaseClient, p: Product): Promise<boolean> {
  try {
    const { error } = await client.from('products').upsert({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category,
      supplier_id: p.supplierId || null,
      stock: p.stock,
      min_stock: p.minStock ?? 5,
      buy: p.buy,
      retail: p.retail,
      grosir: p.grosir,
      grosir_min: p.grosirMin,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Gagal push produk ke Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error pushProductToSupabase:', err);
    return false;
  }
}

export async function pushStockDeductionsToSupabase(
  client: SupabaseClient,
  items: { id: string; newStock: number }[]
): Promise<void> {
  try {
    for (const item of items) {
      await client
        .from('products')
        .update({ stock: item.newStock, updated_at: new Date().toISOString() })
        .eq('id', item.id);
    }
  } catch (err) {
    console.warn('Error pushStockDeductionsToSupabase:', err);
  }
}

export async function fetchRemoteProducts(client: SupabaseClient): Promise<Product[] | null> {
  try {
    const { data, error } = await client.from('products').select('*');
    if (error || !data) return null;
    return data.map((raw: Record<string, unknown>) => ({
      id: String(raw.id || ''),
      name: String(raw.name || ''),
      sku: String(raw.sku || ''),
      barcode: String(raw.barcode || ''),
      category: String(raw.category || 'Umum'),
      supplierId: String(raw.supplier_id || ''),
      stock: Number(raw.stock ?? 0),
      minStock: Number(raw.min_stock ?? 5),
      buy: Number(raw.buy ?? 0),
      retail: Number(raw.retail ?? 0),
      grosir: Number(raw.grosir ?? 0),
      grosirMin: Number(raw.grosir_min ?? 6)
    }));
  } catch (err) {
    console.warn('Error fetchRemoteProducts:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// TRANSACTIONS
// ----------------------------------------------------------------------------
export async function pushTransactionToSupabase(
  client: SupabaseClient,
  trx: Transaction,
  device: DeviceConfig
): Promise<boolean> {
  try {
    const { error: headerErr } = await client.from('transactions').insert({
      id: trx.id,
      date: trx.date,
      cashier: trx.cashier,
      mode: trx.mode,
      subtotal: trx.subtotal,
      discount: trx.discount,
      total: trx.total,
      profit: trx.profit,
      device_id: device.id,
      device_name: device.name
    });

    if (headerErr) {
      const { error: fallbackErr } = await client.from('transactions').insert({
        id: trx.id,
        date: trx.date,
        cashier: trx.cashier,
        mode: trx.mode,
        subtotal: trx.subtotal,
        discount: trx.discount,
        total: trx.total,
        profit: trx.profit
      });
      if (fallbackErr) {
        console.warn('Gagal push transaksi:', fallbackErr.message);
        return false;
      }
    }

    if (trx.items && trx.items.length > 0) {
      const itemsPayload = trx.items.map((it) => ({
        transaction_id: trx.id,
        name: it.name,
        qty: it.qty,
        price: it.price
      }));
      await client.from('transaction_items').insert(itemsPayload).select('id');
    }

    return true;
  } catch (err) {
    console.warn('Error pushTransactionToSupabase:', err);
    return false;
  }
}

export async function fetchRemoteTransactions(client: SupabaseClient): Promise<Transaction[] | null> {
  try {
    const { data, error } = await client
      .from('transactions')
      .select('*')
      .order('date', { ascending: false })
      .limit(200);
    if (error || !data) return null;
    return data.map((raw: Record<string, unknown>) => ({
      id: String(raw.id || ''),
      date: String(raw.date || new Date().toISOString()),
      cashier: String(raw.cashier || 'Kasir'),
      deviceId: raw.device_id ? String(raw.device_id) : undefined,
      deviceName: raw.device_name ? String(raw.device_name) : undefined,
      mode: raw.mode === 'grosir' ? 'grosir' : 'retail',
      items: [],
      subtotal: Number(raw.subtotal ?? 0),
      discount: Number(raw.discount ?? 0),
      total: Number(raw.total ?? 0),
      profit: Number(raw.profit ?? 0)
    }));
  } catch (err) {
    console.warn('Error fetchRemoteTransactions:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// STORE SETTINGS (Branding, Logo, Alamat, Telepon, Format Struk)
// ----------------------------------------------------------------------------
export async function pushStoreSettingsToSupabase(
  client: SupabaseClient,
  branding: Branding,
  printerConfig?: PrinterConfig
): Promise<boolean> {
  try {
    const payload: Record<string, unknown> = {
      id: 'main',
      store_name: branding.storeName,
      app_logo: branding.appLogo || null,
      store_logo: branding.storeLogo || null,
      hide_database_menu: Boolean(branding.hideDatabaseMenu),
      updated_at: new Date().toISOString()
    };

    if (printerConfig) {
      payload.printer_paper_width = printerConfig.paperWidth;
      payload.printer_address = printerConfig.address || null;
      payload.printer_phone = printerConfig.phone || null;
      payload.printer_footer = printerConfig.footer || 'Terima kasih telah berbelanja!';
      payload.printer_show_logo = Boolean(printerConfig.showLogo);
    }

    const { error } = await client.from('store_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.warn('Gagal push store_settings ke Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error pushStoreSettingsToSupabase:', err);
    return false;
  }
}

export async function fetchRemoteStoreSettings(
  client: SupabaseClient
): Promise<{ branding: Branding; printerConfig: Partial<PrinterConfig> } | null> {
  try {
    const { data, error } = await client.from('store_settings').select('*').eq('id', 'main').single();
    if (error || !data) return null;
    const raw = data as Record<string, unknown>;
    const branding: Branding = {
      storeName: String(raw.store_name || 'POS Al-Qassam Analyst'),
      appLogo: raw.app_logo ? String(raw.app_logo) : '',
      storeLogo: raw.store_logo ? String(raw.store_logo) : '',
      hideDatabaseMenu: Boolean(raw.hide_database_menu ?? false)
    };
    const printerConfig: Partial<PrinterConfig> = {
      paperWidth: raw.printer_paper_width === '80mm' ? '80mm' : '58mm',
      address: String(raw.printer_address || ''),
      phone: String(raw.printer_phone || ''),
      footer: String(raw.printer_footer || 'Terima kasih telah berbelanja!'),
      showLogo: Boolean(raw.printer_show_logo ?? true)
    };
    return { branding, printerConfig };
  } catch (err) {
    console.warn('Error fetchRemoteStoreSettings:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// APP USERS & CASHIERS (Akun Kasir, Password, & Hak Akses)
// ----------------------------------------------------------------------------
export async function pushUserToSupabase(client: SupabaseClient, user: User): Promise<boolean> {
  try {
    const payload = {
      username: user.username.trim().toLowerCase(),
      password: user.password,
      name: user.name,
      role: user.role,
      permissions: user.permissions ? JSON.stringify(user.permissions) : null
    };
    const { error } = await client.from('app_users').upsert(payload, { onConflict: 'username' });
    if (error) {
      // If table doesn't have permissions column yet, retry without it
      const fallbackPayload = {
        username: user.username.trim().toLowerCase(),
        password: user.password,
        name: user.name,
        role: user.role
      };
      const { error: fbErr } = await client.from('app_users').upsert(fallbackPayload, { onConflict: 'username' });
      if (fbErr) {
        console.warn('Gagal push user ke Supabase:', fbErr.message);
        return false;
      }
    }
    return true;
  } catch (err) {
    console.warn('Error pushUserToSupabase:', err);
    return false;
  }
}

export async function deleteUserFromSupabase(client: SupabaseClient, username: string): Promise<boolean> {
  try {
    const { error } = await client
      .from('app_users')
      .delete()
      .eq('username', username.trim().toLowerCase());
    if (error) {
      console.warn('Gagal hapus user di Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error deleteUserFromSupabase:', err);
    return false;
  }
}

export async function fetchRemoteUsers(client: SupabaseClient): Promise<User[] | null> {
  try {
    const { data, error } = await client.from('app_users').select('*');
    if (error || !data) return null;
    return data.map((raw: Record<string, unknown>) => {
      let permissions: string[] | undefined;
      if (raw.permissions) {
        try {
          permissions = typeof raw.permissions === 'string' ? JSON.parse(raw.permissions) : (raw.permissions as string[]);
        } catch {
          permissions = undefined;
        }
      }
      return {
        username: String(raw.username || ''),
        password: String(raw.password || ''),
        name: String(raw.name || ''),
        role: raw.role === 'admin' ? 'admin' : 'kasir',
        permissions
      };
    });
  } catch (err) {
    console.warn('Error fetchRemoteUsers:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// SUPPLIERS
// ----------------------------------------------------------------------------
export async function pushSupplierToSupabase(client: SupabaseClient, s: Supplier): Promise<boolean> {
  try {
    const { error } = await client.from('suppliers').upsert({
      id: s.id,
      name: s.name,
      contact: s.contact || null,
      address: s.address || null,
      updated_at: new Date().toISOString()
    });
    if (error) {
      console.warn('Gagal push supplier ke Supabase:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('Error pushSupplierToSupabase:', err);
    return false;
  }
}

export async function fetchRemoteSuppliers(client: SupabaseClient): Promise<Supplier[] | null> {
  try {
    const { data, error } = await client.from('suppliers').select('*');
    if (error || !data) return null;
    return data.map((raw: Record<string, unknown>) => ({
      id: String(raw.id || ''),
      name: String(raw.name || ''),
      contact: String(raw.contact || ''),
      address: String(raw.address || '')
    }));
  } catch (err) {
    console.warn('Error fetchRemoteSuppliers:', err);
    return null;
  }
}

// ----------------------------------------------------------------------------
// CONNECTION DIAGNOSTICS & TEST
// ----------------------------------------------------------------------------
export async function testSupabaseConnection(
  client: SupabaseClient
): Promise<{
  ok: boolean;
  message: string;
  tables: {
    products: boolean;
    app_users: boolean;
    store_settings: boolean;
    transactions: boolean;
  };
}> {
  const result = {
    ok: false,
    message: '',
    tables: {
      products: false,
      app_users: false,
      store_settings: false,
      transactions: false
    }
  };

  try {
    // 1. Check products
    const { data: pData, error: pErr } = await client.from('products').select('id').limit(1);
    result.tables.products = !pErr;

    // 2. Check app_users
    const { data: uData, error: uErr } = await client.from('app_users').select('username').limit(1);
    result.tables.app_users = !uErr;

    // 3. Check store_settings
    const { data: sData, error: sErr } = await client.from('store_settings').select('id').limit(1);
    result.tables.store_settings = !sErr;

    // 4. Check transactions
    const { data: tData, error: tErr } = await client.from('transactions').select('id').limit(1);
    result.tables.transactions = !tErr;

    if (result.tables.products && result.tables.app_users && result.tables.store_settings) {
      result.ok = true;
      result.message = 'Semua tabel cloud terhubung sempurna!';
    } else if (result.tables.products) {
      result.ok = true;
      result.message = 'Terhubung ke database, namun beberapa tabel (app_users/store_settings) belum ada. Jalankan skrip SQL di menu Panduan Supabase.';
    } else {
      result.ok = false;
      result.message = pErr?.message || 'Gagal membaca tabel dari Supabase. Cek URL dan Anon Key Anda.';
    }
  } catch (err) {
    result.ok = false;
    result.message = err instanceof Error ? err.message : 'Koneksi gagal ke Supabase.';
  }

  return result;
}

// ----------------------------------------------------------------------------
// BATCH PRODUCTS PUSH
// ----------------------------------------------------------------------------
export async function batchPushProductsToSupabase(client: SupabaseClient, products: Product[]): Promise<number> {
  let count = 0;
  try {
    const payload = products.map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      barcode: p.barcode,
      category: p.category || 'Umum',
      supplier_id: p.supplierId || null,
      stock: p.stock ?? 0,
      min_stock: p.minStock ?? 5,
      buy: p.buy ?? 0,
      retail: p.retail ?? 0,
      grosir: p.grosir ?? 0,
      grosir_min: p.grosirMin ?? 6,
      updated_at: new Date().toISOString()
    }));
    const { error } = await client.from('products').upsert(payload, { onConflict: 'id' });
    if (!error) {
      count = products.length;
    } else {
      console.warn('Batch push products error, trying one by one:', error.message);
      for (const p of products) {
        const ok = await pushProductToSupabase(client, p);
        if (ok) count++;
      }
    }
  } catch (err) {
    console.warn('batchPushProductsToSupabase error:', err);
  }
  return count;
}

// ----------------------------------------------------------------------------
// UPLOAD ALL LOCAL DATA (HP -> SUPABASE CLOUD)
// ----------------------------------------------------------------------------
export async function uploadAllLocalDataToSupabase(
  client: SupabaseClient,
  data: {
    branding: Branding;
    printerConfig: PrinterConfig;
    users: User[];
    products: Product[];
    suppliers: Supplier[];
  }
): Promise<{
  success: boolean;
  storeSettingsOk: boolean;
  usersUploaded: number;
  productsUploaded: number;
  suppliersUploaded: number;
  message: string;
}> {
  const result = {
    success: false,
    storeSettingsOk: false,
    usersUploaded: 0,
    productsUploaded: 0,
    suppliersUploaded: 0,
    message: ''
  };

  try {
    // 1. Store settings
    result.storeSettingsOk = await pushStoreSettingsToSupabase(client, data.branding, data.printerConfig);

    // 2. Users (Admin + Kasir)
    for (const u of data.users) {
      const ok = await pushUserToSupabase(client, u);
      if (ok) result.usersUploaded++;
    }

    // 3. Products
    result.productsUploaded = await batchPushProductsToSupabase(client, data.products);

    // 4. Suppliers
    for (const s of data.suppliers) {
      const ok = await pushSupplierToSupabase(client, s);
      if (ok) result.suppliersUploaded++;
    }

    result.success = result.storeSettingsOk || result.productsUploaded > 0 || result.usersUploaded > 0;
    result.message = `Berhasil mengunggah ${result.productsUploaded} produk, ${result.usersUploaded} akun pengguna, dan identitas toko ke Cloud!`;
  } catch (err) {
    result.message = err instanceof Error ? err.message : 'Gagal mengunggah data ke Cloud';
  }

  return result;
}

// ----------------------------------------------------------------------------
// QUICK PAIRING & CODE HELPERS (1-Click Connect Link & Code)
// ----------------------------------------------------------------------------
export function generatePairingCode(url: string, anonKey: string): string {
  try {
    const payload = JSON.stringify({ u: url.trim(), k: anonKey.trim() });
    return btoa(payload);
  } catch {
    return '';
  }
}

export function generateQuickConnectLink(url: string, anonKey: string): string {
  try {
    const code = generatePairingCode(url, anonKey);
    const origin = window.location.origin + window.location.pathname;
    return `${origin}?connect=${encodeURIComponent(code)}`;
  } catch {
    return '';
  }
}

export function parseQuickConnectString(input?: string): { url: string; anonKey: string } | null {
  try {
    const target = input ? input.trim() : (window.location.search + window.location.hash);
    if (!target) return null;

    // 1. Check if input is a JSON string
    if (target.startsWith('{') && target.endsWith('}')) {
      const obj = JSON.parse(target);
      if (obj.u && obj.k) return { url: obj.u, anonKey: obj.k };
      if (obj.url && obj.anonKey) return { url: obj.url, anonKey: obj.anonKey };
    }

    // 2. Check if string has connect= query or hash
    if (target.includes('connect=')) {
      const match = target.match(/connect=([^&#\s]+)/);
      if (match && match[1]) {
        const rawCode = decodeURIComponent(match[1]);
        const jsonStr = atob(rawCode);
        const obj = JSON.parse(jsonStr);
        if (obj.u && obj.k) return { url: obj.u, anonKey: obj.k };
      }
    }

    // 3. Check if string has sb_url & sb_key
    if (target.includes('sb_url=') && target.includes('sb_key=')) {
      const urlMatch = target.match(/sb_url=([^&#\s]+)/);
      const keyMatch = target.match(/sb_key=([^&#\s]+)/);
      if (urlMatch && keyMatch) {
        return {
          url: decodeURIComponent(urlMatch[1]),
          anonKey: decodeURIComponent(keyMatch[1])
        };
      }
    }

    // 4. Check if string is raw Base64 code
    if (/^[A-Za-z0-9+/=]+$/.test(target) && target.length > 20) {
      try {
        const jsonStr = atob(target);
        const obj = JSON.parse(jsonStr);
        if (obj.u && obj.k) return { url: obj.u, anonKey: obj.k };
      } catch {
        // Not a base64 json
      }
    }
  } catch (err) {
    console.warn('parseQuickConnectString error:', err);
  }
  return null;
}

// Deprecated alias for backwards compatibility
export const parseQuickConnectHash = parseQuickConnectString;
