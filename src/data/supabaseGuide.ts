export const SUPABASE_SQL_SCHEMA = `-- ==============================================================================
-- SKRIP ALL-IN-ONE: BUAT SEMUA TABEL + ENABLE RLS SEKALIGUS (BEBAS ERROR)
-- Skrip ini otomatis membuat seluruh tabel (termasuk transaction_items dan min_stock)
-- kemudian langsung mengaktifkan Row Level Security (RLS) dalam 1 kali jalan.
-- ==============================================================================

-- 1. Ekstensi UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 2. PEMBUATAN TABEL-TABEL UTAMA (CREATE TABLE IF NOT EXISTS)
-- ------------------------------------------------------------------------------

-- Tabel: suppliers (Pemasok)
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    contact VARCHAR(100),
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: products (Master Produk dengan Kolom min_stock)
CREATE TABLE IF NOT EXISTS public.products (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),
    category VARCHAR(100) DEFAULT 'Umum',
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    min_stock INTEGER NOT NULL DEFAULT 5, -- Stok minimum untuk notifikasi/alert
    buy NUMERIC(15, 2) NOT NULL DEFAULT 0,
    retail NUMERIC(15, 2) NOT NULL DEFAULT 0,
    grosir NUMERIC(15, 2) NOT NULL DEFAULT 0,
    grosir_min INTEGER NOT NULL DEFAULT 6,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tambah kolom min_stock jika tabel products sebelumnya sudah ada tanpa kolom ini
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 5;

-- Indeks pencarian cepat
CREATE INDEX IF NOT EXISTS idx_products_barcode ON public.products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);
CREATE INDEX IF NOT EXISTS idx_products_stock ON public.products(stock);
CREATE INDEX IF NOT EXISTS idx_products_min_stock ON public.products(min_stock);

-- Tabel: transactions (Riwayat Kasir & Multi-Device)
CREATE TABLE IF NOT EXISTS public.transactions (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cashier VARCHAR(100) NOT NULL,
    device_id VARCHAR(50) DEFAULT 'pc-kasir-1',
    device_name VARCHAR(100) DEFAULT 'PC Kasir 1 (Utama)',
    mode VARCHAR(20) NOT NULL DEFAULT 'retail',
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    discount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    profit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS device_id VARCHAR(50);
ALTER TABLE public.transactions ADD COLUMN IF NOT EXISTS device_name VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON public.transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_device ON public.transactions(device_id);

-- Tabel: transaction_items (Rincian Item Nota Transaksi)
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id BIGSERIAL PRIMARY KEY,
    transaction_id TEXT NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    price NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trx_items_trx_id ON public.transaction_items(transaction_id);

-- Tabel: purchases (Pembelian Restock)
CREATE TABLE IF NOT EXISTS public.purchases (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: purchase_items (Rincian Item Restock)
CREATE TABLE IF NOT EXISTS public.purchase_items (
    id BIGSERIAL PRIMARY KEY,
    purchase_id TEXT NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
    product_id TEXT REFERENCES public.products(id) ON DELETE SET NULL,
    name VARCHAR(255) NOT NULL,
    qty INTEGER NOT NULL DEFAULT 1,
    buy NUMERIC(15, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: app_users (Pengguna Aplikasi & Hak Akses Kasir)
CREATE TABLE IF NOT EXISTS public.app_users (
    username VARCHAR(100) PRIMARY KEY,
    password TEXT NOT NULL,
    name VARCHAR(150) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'kasir',
    permissions TEXT, -- JSON Array ID menu yang diizinkan untuk kasir
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.app_users ADD COLUMN IF NOT EXISTS permissions TEXT;

-- Tabel: opening_balances (Saldo Kas Awal Tahunan)
CREATE TABLE IF NOT EXISTS public.opening_balances (
    year VARCHAR(10) PRIMARY KEY,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel: store_settings (Pengaturan Toko, Logo, Alamat & Printer)
CREATE TABLE IF NOT EXISTS public.store_settings (
    id VARCHAR(50) PRIMARY KEY DEFAULT 'main',
    store_name VARCHAR(255) DEFAULT 'POS Al-Qassam Analyst',
    app_logo TEXT,
    store_logo TEXT,
    hide_database_menu BOOLEAN DEFAULT false,
    printer_paper_width VARCHAR(10) DEFAULT '58mm',
    printer_address TEXT,
    printer_phone VARCHAR(50),
    printer_footer TEXT DEFAULT 'Terima kasih telah berbelanja!',
    printer_show_logo BOOLEAN DEFAULT true,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS hide_database_menu BOOLEAN DEFAULT false;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS printer_address TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS printer_phone VARCHAR(50);
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS store_logo TEXT;
ALTER TABLE public.store_settings ADD COLUMN IF NOT EXISTS app_logo TEXT;

-- ------------------------------------------------------------------------------
-- 3. ENABLE ROW LEVEL SECURITY (RLS) & POLICIES SECARA AMAN
-- ------------------------------------------------------------------------------
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opening_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

-- Hapus policy lama jika ada untuk mencegah tabrakan nama policy
DROP POLICY IF EXISTS "Akses penuh suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Akses penuh products" ON public.products;
DROP POLICY IF EXISTS "Akses penuh transactions" ON public.transactions;
DROP POLICY IF EXISTS "Akses penuh transaction_items" ON public.transaction_items;
DROP POLICY IF EXISTS "Akses penuh purchases" ON public.purchases;
DROP POLICY IF EXISTS "Akses penuh purchase_items" ON public.purchase_items;
DROP POLICY IF EXISTS "Akses penuh app_users" ON public.app_users;
DROP POLICY IF EXISTS "Akses penuh opening_balances" ON public.opening_balances;
DROP POLICY IF EXISTS "Akses penuh store_settings" ON public.store_settings;

-- Buat policy baru akses penuh untuk REST API (anon / public)
CREATE POLICY "Akses penuh suppliers" ON public.suppliers FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh products" ON public.products FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh transactions" ON public.transactions FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh transaction_items" ON public.transaction_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh purchases" ON public.purchases FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh purchase_items" ON public.purchase_items FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh app_users" ON public.app_users FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh opening_balances" ON public.opening_balances FOR ALL TO public USING (true) WITH CHECK (true);
CREATE POLICY "Akses penuh store_settings" ON public.store_settings FOR ALL TO public USING (true) WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- 4. SEED DATA AWAL (DEFAULT ADMIN)
-- ------------------------------------------------------------------------------
INSERT INTO public.app_users (username, password, name, role)
VALUES ('admin', 'admin123', 'Administrator', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO public.store_settings (id, store_name, printer_paper_width, printer_footer, printer_show_logo)
VALUES ('main', 'POS Al-Qassam Analyst', '58mm', 'Terima kasih telah berbelanja!', true)
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------------------------
-- 5. VERIFIKASI STATUS SELURUH TABEL
-- ------------------------------------------------------------------------------
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'suppliers', 'transactions', 'transaction_items', 'purchases', 'purchase_items', 'app_users', 'opening_balances', 'store_settings')
ORDER BY tablename;
`;

export const SUPABASE_SAFE_DYNAMIC_RLS_SQL = `-- ==============================================================================
-- SKRIP KHUSUS: ENABLE RLS HANYA PADA TABEL YANG SUDAH ADA (ANTI ERROR 42P01)
-- Skrip ini mengecek keberadaan tabel terlebih dahulu sebelum menjalankan RLS.
-- Jika tabel transaction_items belum ada, skrip TIDAK akan error!
-- ==============================================================================

DO $$
DECLARE
    tbl text;
    tables text[] := ARRAY[
        'suppliers', 
        'products', 
        'transactions', 
        'transaction_items', 
        'purchases', 
        'purchase_items', 
        'app_users', 
        'opening_balances', 
        'store_settings'
    ];
BEGIN
    FOREACH tbl IN ARRAY tables LOOP
        -- Cek apakah tabel ada di schema public
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
            -- 1. Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
            -- 2. Drop policy lama jika ada
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Akses penuh ' || tbl, tbl);
            -- 3. Buat policy baru
            EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO public USING (true) WITH CHECK (true);', 'Akses penuh ' || tbl, tbl);
            RAISE NOTICE 'RLS berhasil diaktifkan pada tabel: %', tbl;
        ELSE
            RAISE NOTICE 'Tabel % belum dibuat, dilewati dengan aman (tidak error).', tbl;
        END IF;
    END LOOP;
END $$;

-- Verifikasi tabel yang RLS-nya aktif
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('products', 'suppliers', 'transactions', 'transaction_items', 'purchases', 'purchase_items', 'app_users', 'opening_balances', 'store_settings')
ORDER BY tablename;
`;

export const SUPABASE_ALTER_EXISTING_SQL = `-- JIKA ANDA SUDAH MEMILIKI TABEL 'products' DI SUPABASE SEBELUMNYA,
-- CUKUP JALANKAN PERINTAH ALTER INI DI SQL EDITOR UNTUK MENAMBAH KOLOM STOK MIN:

ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS min_stock INTEGER NOT NULL DEFAULT 5;

-- Buat indeks untuk mempercepat filter stok menipis
CREATE INDEX IF NOT EXISTS idx_products_min_stock ON public.products(min_stock);
`;
