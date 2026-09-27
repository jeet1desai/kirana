-- ==============================================================================
-- KiranaSync Multi-Tenant Database Schema for Supabase (PostgreSQL)
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Store Workspaces table
CREATE TABLE IF NOT EXISTS public.stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    join_code TEXT UNIQUE NOT NULL, -- e.g. 'APNA-2026', 'GUPTA-4821'
    owner_name TEXT NOT NULL DEFAULT 'Owner',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Store Members table
CREATE TABLE IF NOT EXISTS public.store_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'Manager', -- 'Owner', 'Manager', 'Staff'
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Products table (Scoped by store_id)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    brand TEXT,
    unit TEXT NOT NULL, -- 'kg', '500g', '1L', 'pkt', 'pc', 'bag', etc.
    purchase_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    selling_price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    current_stock NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    min_stock NUMERIC(10, 2) NOT NULL DEFAULT 5.00,
    barcode TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by TEXT NOT NULL DEFAULT 'Admin'
);

-- 5. Price History table (Audit trail for price changes)
CREATE TABLE IF NOT EXISTS public.price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    old_price NUMERIC(10, 2) NOT NULL,
    new_price NUMERIC(10, 2) NOT NULL,
    changed_by TEXT NOT NULL, -- e.g. 'Ramesh', 'Suresh'
    reason TEXT, -- e.g. 'Wholesale price hike', 'Special offer'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Activity Logs table (General store activity feed)
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'PRICE_CHANGE', 'STOCK_UPDATE', 'PRODUCT_ADD', 'PRODUCT_DELETE'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. Seed Default Workspace 'Apna Kirana Store'
INSERT INTO public.stores (id, name, join_code, owner_name)
VALUES ('a0000000-0000-0000-0000-000000000001', 'Apna Kirana Store', 'APNA-2026', 'Ramesh')
ON CONFLICT (join_code) DO NOTHING;

INSERT INTO public.store_members (store_id, user_name, role)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', 'Ramesh', 'Owner'),
    ('a0000000-0000-0000-0000-000000000001', 'Suresh', 'Manager')
ON CONFLICT DO NOTHING;

-- 8. Seed initial realistic Kirana store products for Apna Kirana
INSERT INTO public.products (store_id, name, category, brand, unit, purchase_price, selling_price, current_stock, min_stock, updated_by)
VALUES
    ('a0000000-0000-0000-0000-000000000001', 'Amul Butter', 'Dairy & Eggs', 'Amul', '500g', 255.00, 275.00, 18, 5, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Amul Taaza Milk', 'Dairy & Eggs', 'Amul', '1L', 52.00, 56.00, 30, 10, 'Suresh'),
    ('a0000000-0000-0000-0000-000000000001', 'Tata Salt Iodized', 'Spices & Seasoning', 'Tata', '1kg', 24.00, 28.00, 45, 10, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Aashirvaad Shudh Chakki Atta', 'Atta & Flours', 'Aashirvaad', '10kg', 410.00, 445.00, 12, 4, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Fortune Sunlite Sunflower Oil', 'Edible Oils & Ghee', 'Fortune', '1L Pouch', 128.00, 142.00, 22, 6, 'Suresh'),
    ('a0000000-0000-0000-0000-000000000001', 'Madhur Pure & Hygienic Sugar', 'Sugar & Sweeteners', 'Madhur', '5kg', 210.00, 230.00, 15, 5, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Tata Sampann Toor Dal', 'Dal & Pulses', 'Tata Sampann', '1kg', 162.00, 178.00, 14, 5, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Everest Turmeric Powder (Haldi)', 'Spices & Seasoning', 'Everest', '200g', 58.00, 68.00, 25, 8, 'Suresh'),
    ('a0000000-0000-0000-0000-000000000001', 'Maggi 2-Minute Noodles Pack', 'Snacks & Instant Food', 'Nestle', '70g x 4', 52.00, 58.00, 40, 10, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Parle-G Gold Biscuits', 'Biscuits & Cookies', 'Parle', '1kg Bag', 115.00, 130.00, 20, 5, 'Suresh'),
    ('a0000000-0000-0000-0000-000000000001', 'Surf Excel Quick Wash Powder', 'Cleaning & Household', 'Surf Excel', '1kg', 135.00, 148.00, 16, 5, 'Ramesh'),
    ('a0000000-0000-0000-0000-000000000001', 'Dettol Original Bathing Soap', 'Personal Care', 'Dettol', '125g x 3', 132.00, 145.00, 3, 5, 'Suresh')
ON CONFLICT DO NOTHING;

-- 9. Enable Row Level Security (RLS)
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for stores" ON public.stores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for store_members" ON public.store_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for products" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for price_history" ON public.price_history FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read-write for activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- 10. Enable Realtime Publications for instant syncing between workspace members
ALTER PUBLICATION supabase_realtime ADD TABLE public.stores;
ALTER PUBLICATION supabase_realtime ADD TABLE public.store_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.price_history;
ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_logs;
