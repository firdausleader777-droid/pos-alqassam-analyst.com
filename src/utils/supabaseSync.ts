import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';
import { Product, Transaction, Purchase, Supplier, DeviceConfig } from '../types';

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
    // 1. Realtime Products (Stock deductions, price updates, new products)
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
    // 2. Realtime Transactions (Sales from other cashiers/devices)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transactions' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          // Ignore if originated from this exact device if device_id matches
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
    // 3. Realtime Purchases
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'purchases' },
      (payload) => {
        if (payload.new) {
          const raw = payload.new as Record<string, unknown>;
          const incomingPu: Purchase = {
            id: String(raw.id || ''),
            date: String(raw.date || new Date().toISOString()),
            supplierId: String(raw.supplier_id || ''),
            items: [],
            total: Number(raw.total ?? 0),
            note: String(raw.note || '')
          };
          handlers.onPurchaseInsert?.(incomingPu);
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

// Push local product change to Supabase
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

// Push batch product stock deduction (e.g. after sale)
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

// Push local transaction to Supabase
export async function pushTransactionToSupabase(
  client: SupabaseClient,
  trx: Transaction,
  device: DeviceConfig
): Promise<boolean> {
  try {
    // 1. Insert Transaction Header
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
      // If table doesn't have device_id column yet, fallback to insert without it
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

    // 2. Insert Transaction Items if table exists
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

// Fetch all initial data from Supabase
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
