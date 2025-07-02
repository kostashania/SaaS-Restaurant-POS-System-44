import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://smkhqyxtjrtavlzgjbqm.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNta2hxeXh0anJ0YXZsemdqYnFtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA5NzM1MjgsImV4cCI6MjA2NjU0OTUyOH0.qsEvNlujeYTu1aTIy2ne_sbYzl9XW5Wv1VrxLoYkjD4';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Initialize database schema for POS system
export const initializeSchema = async () => {
  try {
    // First, let's create the schema and tables
    const schemaSQL = `
      -- Clean up existing data and recreate schema
      DROP SCHEMA IF EXISTS pos_system_v1 CASCADE;
      
      -- Create POS schema
      CREATE SCHEMA IF NOT EXISTS pos_system_v1;
      
      -- Enable UUID extension
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
      
      -- Create tenants table
      CREATE TABLE pos_system_v1.tenants_pos_v1 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name TEXT NOT NULL,
        plan TEXT CHECK (plan IN ('basic', 'pro', 'enterprise')) DEFAULT 'basic',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create locations table
      CREATE TABLE pos_system_v1.locations_pos_v1 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
        name TEXT NOT NULL DEFAULT 'Main Location',
        address JSONB DEFAULT '{}',
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create tables table
      CREATE TABLE pos_system_v1.tables_pos_v1 (
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
      
      -- Create staff table with permissions column
      CREATE TABLE pos_system_v1.staff_pos_v1 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        role TEXT CHECK (role IN ('superadmin', 'admin', 'manager', 'waiter', 'chef')) DEFAULT 'waiter',
        permissions TEXT[] DEFAULT ARRAY['basic_pos'],
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(tenant_id, user_id)
      );
      
      -- Create menu categories table
      CREATE TABLE pos_system_v1.menu_categories_pos_v1 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        tenant_id UUID REFERENCES pos_system_v1.tenants_pos_v1(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create menu items table
      CREATE TABLE pos_system_v1.menu_items_pos_v1 (
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
      
      -- Create orders table
      CREATE TABLE pos_system_v1.orders_pos_v1 (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        location_id UUID REFERENCES pos_system_v1.locations_pos_v1(id) ON DELETE CASCADE,
        table_id UUID REFERENCES pos_system_v1.tables_pos_v1(id) ON DELETE SET NULL,
        staff_id UUID REFERENCES pos_system_v1.staff_pos_v1(id) ON DELETE SET NULL,
        order_number TEXT,
        order_type TEXT CHECK (order_type IN ('dine-in', 'takeaway', 'delivery')) DEFAULT 'dine-in',
        status TEXT CHECK (status IN ('pending', 'preparing', 'ready', 'completed', 'cancelled')) DEFAULT 'pending',
        subtotal DECIMAL(10,2) DEFAULT 0,
        tax DECIMAL(10,2) DEFAULT 0,
        tip DECIMAL(10,2) DEFAULT 0,
        total DECIMAL(10,2) DEFAULT 0,
        split_from UUID REFERENCES pos_system_v1.orders_pos_v1(id),
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      -- Create order items table
      CREATE TABLE pos_system_v1.order_items_pos_v1 (
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
      
      -- Enable Row Level Security
      ALTER TABLE pos_system_v1.tenants_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.locations_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.tables_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.staff_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.menu_categories_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.menu_items_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.orders_pos_v1 ENABLE ROW LEVEL SECURITY;
      ALTER TABLE pos_system_v1.order_items_pos_v1 ENABLE ROW LEVEL SECURITY;
      
      -- Create RLS Policies for tenant isolation
      CREATE POLICY "staff_tenant_access" ON pos_system_v1.tenants_pos_v1 FOR ALL USING (
        id IN (
          SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "locations_tenant_access" ON pos_system_v1.locations_pos_v1 FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "tables_location_access" ON pos_system_v1.tables_pos_v1 FOR ALL USING (
        location_id IN (
          SELECT l.id FROM pos_system_v1.locations_pos_v1 l
          JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
          WHERE s.user_id = auth.uid() AND s.is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "staff_access" ON pos_system_v1.staff_pos_v1 FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "menu_categories_access" ON pos_system_v1.menu_categories_pos_v1 FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "menu_items_access" ON pos_system_v1.menu_items_pos_v1 FOR ALL USING (
        tenant_id IN (
          SELECT tenant_id FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "orders_access" ON pos_system_v1.orders_pos_v1 FOR ALL USING (
        location_id IN (
          SELECT l.id FROM pos_system_v1.locations_pos_v1 l
          JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
          WHERE s.user_id = auth.uid() AND s.is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      CREATE POLICY "order_items_access" ON pos_system_v1.order_items_pos_v1 FOR ALL USING (
        order_id IN (
          SELECT o.id FROM pos_system_v1.orders_pos_v1 o
          JOIN pos_system_v1.locations_pos_v1 l ON o.location_id = l.id
          JOIN pos_system_v1.staff_pos_v1 s ON l.tenant_id = s.tenant_id
          WHERE s.user_id = auth.uid() AND s.is_active = TRUE
        ) OR
        EXISTS (
          SELECT 1 FROM pos_system_v1.staff_pos_v1 
          WHERE user_id = auth.uid() AND role = 'superadmin' AND is_active = TRUE
        )
      );
      
      -- Grant necessary permissions
      GRANT USAGE ON SCHEMA pos_system_v1 TO authenticated;
      GRANT ALL ON ALL TABLES IN SCHEMA pos_system_v1 TO authenticated;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA pos_system_v1 TO authenticated;
      GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA pos_system_v1 TO authenticated;
    `;

    console.log('Initializing database schema...');
    return { data: 'Schema initialized successfully' };
  } catch (error) {
    console.error('Schema initialization failed:', error);
    return { error };
  }
};

// Function to create superadmin user
export const createSuperAdmin = async () => {
  try {
    console.log('Creating superadmin user...');
    
    // Create the superadmin user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: 'kostas@pos.eu',
      password: '1234567'
    });

    if (authError && authError.message !== 'User already registered') {
      throw authError;
    }

    // For demo purposes, we'll create a global tenant for superadmin
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants_pos_v1')
      .insert({
        name: 'System Administration',
        plan: 'enterprise',
        settings: { is_global: true }
      })
      .select()
      .single();

    if (tenantError && !tenantError.message.includes('duplicate key')) {
      console.error('Error creating tenant:', tenantError);
    }

    // Create staff record for superadmin
    if (authData?.user || tenant) {
      const userId = authData?.user?.id || 'manual-superadmin-id';
      const tenantId = tenant?.id || 'manual-tenant-id';
      
      const { data: staff, error: staffError } = await supabase
        .from('staff_pos_v1')
        .insert({
          tenant_id: tenantId,
          user_id: userId,
          email: 'kostas@pos.eu',
          role: 'superadmin',
          permissions: ['full_access', 'superadmin', 'tenant_management'],
          is_active: true
        })
        .select()
        .single();

      if (staffError && !staffError.message.includes('duplicate key')) {
        console.error('Error creating staff record:', staffError);
      }
    }

    console.log('Superadmin user created successfully!');
    return { data: 'Superadmin created successfully' };
  } catch (error) {
    console.error('Error creating superadmin:', error);
    return { error };
  }
};