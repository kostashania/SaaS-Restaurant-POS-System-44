-- POS System Database Schema with proper isolation
-- This creates a separate schema for the POS system to avoid conflicts

-- Create POS schema
CREATE SCHEMA IF NOT EXISTS pos_system_v1;

-- Set search path to use our schema
SET search_path TO pos_system_v1, public;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create tenants table
CREATE TABLE IF NOT EXISTS pos_system_v1.tenants_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  plan TEXT CHECK (plan IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create locations table
CREATE TABLE IF NOT EXISTS pos_system_v1.locations_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Main Location',
  address JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tables table
CREATE TABLE IF NOT EXISTS pos_system_v1.tables_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES pos_system_v1.locations_pos_v1(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('ready', 'occupied', 'reserved')) DEFAULT 'ready',
  capacity INT DEFAULT 2,
  is_ad_hoc BOOLEAN DEFAULT FALSE,
  position JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create staff table
CREATE TABLE IF NOT EXISTS pos_system_v1.staff_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT CHECK (role IN ('admin', 'manager', 'waiter', 'chef')) DEFAULT 'waiter',
  permissions TEXT[] DEFAULT ARRAY['basic_pos'],
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tenant_id, user_id)
);

-- Create menu categories table
CREATE TABLE IF NOT EXISTS pos_system_v1.menu_categories_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create menu items table
CREATE TABLE IF NOT EXISTS pos_system_v1.menu_items_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  category_id UUID REFERENCES pos_system_v1.menu_categories_pos_v1(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  modifiers JSONB DEFAULT '[]',
  is_available BOOLEAN DEFAULT TRUE,
  inventory_tracking BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inventory table
CREATE TABLE IF NOT EXISTS pos_system_v1.inventory_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  menu_item_id UUID REFERENCES pos_system_v1.menu_items_pos_v1(id) ON DELETE CASCADE,
  location_id UUID REFERENCES pos_system_v1.locations_pos_v1(id) ON DELETE CASCADE,
  quantity INT DEFAULT 0,
  alert_threshold INT DEFAULT 10,
  last_restocked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(menu_item_id, location_id)
);

-- Create orders table
CREATE TABLE IF NOT EXISTS pos_system_v1.orders_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID REFERENCES pos_system_v1.locations_pos_v1(id) ON DELETE CASCADE,
  table_id UUID REFERENCES pos_system_v1.tables_pos_v1(id) ON DELETE SET NULL,
  staff_id UUID REFERENCES pos_system_v1.staff_pos_v1(id) ON DELETE SET NULL,
  order_number TEXT GENERATED ALWAYS AS ('ORD-' || EXTRACT(YEAR FROM created_at) || '-' || LPAD(EXTRACT(DOY FROM created_at)::TEXT, 3, '0') || '-' || LPAD((EXTRACT(EPOCH FROM created_at) * 1000)::BIGINT::TEXT, 10, '0')) STORED,
  order_type TEXT CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')) DEFAULT 'dine-in',
  status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')) DEFAULT 'pending',
  subtotal DECIMAL(10,2) DEFAULT 0,
  tax DECIMAL(10,2) DEFAULT 0,
  tip DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax + tip) STORED,
  split_from UUID REFERENCES pos_system_v1.orders_pos_v1(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create order items table
CREATE TABLE IF NOT EXISTS pos_system_v1.order_items_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES pos_system_v1.orders_pos_v1(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES pos_system_v1.menu_items_pos_v1(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  modifiers JSONB DEFAULT '[]',
  special_instructions TEXT,
  status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'served')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create customers table
CREATE TABLE IF NOT EXISTS pos_system_v1.customers_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  name TEXT,
  loyalty_points INT DEFAULT 0,
  total_visits INT DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  last_visit TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS pos_system_v1.payments_pos_v1 (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES pos_system_v1.orders_pos_v1(id) ON DELETE CASCADE,
  payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital', 'comp')) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'completed', 'failed', 'refunded')) DEFAULT 'pending',
  transaction_id TEXT,
  processor_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE pos_system_v1.tenants_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.locations_pos_v1 ENABLE ROW LEVEL SECURITY;  
ALTER TABLE pos_system_v1.tables_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.staff_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.menu_categories_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.menu_items_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.inventory_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.orders_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.order_items_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.customers_pos_v1 ENABLE ROW LEVEL SECURITY;
ALTER TABLE pos_system_v1.payments_pos_v1 ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for tenant isolation
-- Staff access policy
CREATE POLICY "staff_tenant_access" ON pos_system_v1.tenants_pos_v1
  FOR ALL USING (
    id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Locations access policy
CREATE POLICY "locations_tenant_access" ON pos_system_v1.locations_pos_v1
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Tables access policy
CREATE POLICY "tables_location_access" ON pos_system_v1.tables_pos_v1
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM pos_system_v1.locations_pos_v1 l
      JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
      WHERE s.user_id = auth.uid() AND s.is_active = TRUE
    )
  );

-- Staff access policy
CREATE POLICY "staff_self_access" ON pos_system_v1.staff_pos_v1
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Menu categories access policy
CREATE POLICY "menu_categories_tenant_access" ON pos_system_v1.menu_categories_pos_v1
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Menu items access policy  
CREATE POLICY "menu_items_tenant_access" ON pos_system_v1.menu_items_pos_v1
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Inventory access policy
CREATE POLICY "inventory_location_access" ON pos_system_v1.inventory_pos_v1
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM pos_system_v1.locations_pos_v1 l
      JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
      WHERE s.user_id = auth.uid() AND s.is_active = TRUE
    )
  );

-- Orders access policy
CREATE POLICY "orders_location_access" ON pos_system_v1.orders_pos_v1
  FOR ALL USING (
    location_id IN (
      SELECT l.id FROM pos_system_v1.locations_pos_v1 l
      JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
      WHERE s.user_id = auth.uid() AND s.is_active = TRUE
    )
  );

-- Order items access policy
CREATE POLICY "order_items_access" ON pos_system_v1.order_items_pos_v1
  FOR ALL USING (
    order_id IN (
      SELECT o.id FROM pos_system_v1.orders_pos_v1 o
      JOIN pos_system_v1.locations_pos_v1 l ON o.location_id = l.id
      JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
      WHERE s.user_id = auth.uid() AND s.is_active = TRUE
    )
  );

-- Customers access policy
CREATE POLICY "customers_tenant_access" ON pos_system_v1.customers_pos_v1
  FOR ALL USING (
    tenant_id IN (
      SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
      WHERE user_id = auth.uid() AND is_active = TRUE
    )
  );

-- Payments access policy
CREATE POLICY "payments_access" ON pos_system_v1.payments_pos_v1
  FOR ALL USING (
    order_id IN (
      SELECT o.id FROM pos_system_v1.orders_pos_v1 o
      JOIN pos_system_v1.locations_pos_v1 l ON o.location_id = l.id
      JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
      WHERE s.user_id = auth.uid() AND s.is_active = TRUE
    )
  );

-- Insert demo data
DO $$
DECLARE
  demo_tenant_id UUID;
  demo_location_id UUID;
  demo_staff_id UUID;
  food_category_id UUID;
  drinks_category_id UUID;
  burger_item_id UUID;
  fries_item_id UUID;
  demo_table_id UUID;
BEGIN
  -- Create demo tenant
  INSERT INTO pos_system_v1.tenants_pos_v1 (name, plan) 
  VALUES ('Demo Restaurant', 'pro') 
  RETURNING id INTO demo_tenant_id;

  -- Create demo location
  INSERT INTO pos_system_v1.locations_pos_v1 (tenant_id, name, address)
  VALUES (
    demo_tenant_id, 
    'Main Location',
    '{"street": "123 Main St", "city": "Demo City", "state": "DC", "zip": "12345"}'
  )
  RETURNING id INTO demo_location_id;

  -- Create demo categories
  INSERT INTO pos_system_v1.menu_categories_pos_v1 (tenant_id, name, sort_order)
  VALUES 
    (demo_tenant_id, 'Food', 1),
    (demo_tenant_id, 'Drinks', 2)
  RETURNING id INTO food_category_id;

  SELECT id INTO drinks_category_id 
  FROM pos_system_v1.menu_categories_pos_v1 
  WHERE tenant_id = demo_tenant_id AND name = 'Drinks';

  -- Create demo menu items
  INSERT INTO pos_system_v1.menu_items_pos_v1 (tenant_id, category_id, name, description, base_price)
  VALUES 
    (demo_tenant_id, food_category_id, 'Burger Deluxe', 'Premium beef burger with all the fixings', 14.99),
    (demo_tenant_id, food_category_id, 'Caesar Salad', 'Fresh romaine with caesar dressing', 12.99),
    (demo_tenant_id, food_category_id, 'Fish & Chips', 'Beer battered fish with crispy fries', 16.99),
    (demo_tenant_id, food_category_id, 'Pasta Carbonara', 'Creamy pasta with bacon and parmesan', 15.99),
    (demo_tenant_id, food_category_id, 'Chicken Wings', '10 piece wings with your choice of sauce', 13.99),
    (demo_tenant_id, food_category_id, 'French Fries', 'Crispy golden fries', 5.99),
    (demo_tenant_id, drinks_category_id, 'Coca Cola', 'Classic soft drink', 2.99),
    (demo_tenant_id, drinks_category_id, 'Coffee', 'Freshly brewed coffee', 3.99);

  -- Create demo tables
  INSERT INTO pos_system_v1.tables_pos_v1 (location_id, name, capacity, status)
  VALUES 
    (demo_location_id, 'Table 1', 4, 'ready'),
    (demo_location_id, 'Table 2', 2, 'ready'),
    (demo_location_id, 'Table 3', 6, 'ready'),
    (demo_location_id, 'Table 4', 4, 'ready'),
    (demo_location_id, 'Table 5', 2, 'ready'),
    (demo_location_id, 'Bar Seat 1', 1, 'ready'),
    (demo_location_id, 'Bar Seat 2', 1, 'ready'),
    (demo_location_id, 'Bar Seat 3', 1, 'ready');

END $$;

-- Create a function to initialize the schema (for RPC calls)
CREATE OR REPLACE FUNCTION initialize_pos_schema_v1()
RETURNS TEXT
LANGUAGE SQL
AS $$
  SELECT 'POS System schema initialized successfully'::TEXT;
$$;

-- Create helper functions for the POS system

-- Function to get user's tenants
CREATE OR REPLACE FUNCTION get_user_tenants_pos_v1(user_uuid UUID)
RETURNS TABLE (
  tenant_id UUID,
  tenant_name TEXT,
  tenant_plan TEXT,
  user_role TEXT,
  user_permissions TEXT[]
)
LANGUAGE SQL
SECURITY DEFINER
AS $$
  SELECT 
    t.id,
    t.name,
    t.plan,
    s.role,
    s.permissions
  FROM pos_system_v1.tenants_pos_v1 t
  JOIN pos_system_v1.staff_pos_v1 s ON t.id = s.tenant_id
  WHERE s.user_id = user_uuid AND s.is_active = TRUE;
$$;

-- Function to split order (for bill splitting)
CREATE OR REPLACE FUNCTION split_order_pos_v1(
  original_order_id UUID,
  item_ids UUID[],
  target_table_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_order_id UUID;
  original_order RECORD;
  item_record RECORD;
  new_subtotal DECIMAL(10,2) := 0;
BEGIN
  -- Get original order details
  SELECT * INTO original_order 
  FROM pos_system_v1.orders_pos_v1 
  WHERE id = original_order_id;

  -- Create new order
  INSERT INTO pos_system_v1.orders_pos_v1 (
    location_id, table_id, staff_id, order_type, 
    status, split_from, notes
  )
  VALUES (
    original_order.location_id,
    target_table_id,
    original_order.staff_id,
    original_order.order_type,
    'pending',
    original_order_id,
    'Split from order ' || original_order.order_number
  )
  RETURNING id INTO new_order_id;

  -- Move selected items to new order
  FOR item_record IN 
    SELECT * FROM pos_system_v1.order_items_pos_v1 
    WHERE id = ANY(item_ids) AND order_id = original_order_id
  LOOP
    -- Add to new subtotal
    new_subtotal := new_subtotal + (item_record.unit_price * item_record.quantity);
    
    -- Update item to new order
    UPDATE pos_system_v1.order_items_pos_v1 
    SET order_id = new_order_id 
    WHERE id = item_record.id;
  END LOOP;

  -- Update new order subtotal
  UPDATE pos_system_v1.orders_pos_v1 
  SET subtotal = new_subtotal
  WHERE id = new_order_id;

  -- Recalculate original order subtotal
  UPDATE pos_system_v1.orders_pos_v1 
  SET subtotal = (
    SELECT COALESCE(SUM(unit_price * quantity), 0)
    FROM pos_system_v1.order_items_pos_v1 
    WHERE order_id = original_order_id
  )
  WHERE id = original_order_id;

  RETURN new_order_id;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON pos_system_v1.staff_pos_v1(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_tenant_id ON pos_system_v1.staff_pos_v1(tenant_id);
CREATE INDEX IF NOT EXISTS idx_locations_tenant_id ON pos_system_v1.locations_pos_v1(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tables_location_id ON pos_system_v1.tables_pos_v1(location_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_tenant_id ON pos_system_v1.menu_items_pos_v1(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_location_id ON pos_system_v1.orders_pos_v1(location_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON pos_system_v1.order_items_pos_v1(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON pos_system_v1.orders_pos_v1(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON pos_system_v1.orders_pos_v1(status);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA pos_system_v1 TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA pos_system_v1 TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA pos_system_v1 TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pos_system_v1 TO authenticated;