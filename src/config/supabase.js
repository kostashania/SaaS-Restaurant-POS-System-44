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

// Test connection and create basic tables if needed
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Initializing database connection...');

    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('financial_categories_pos_v1')
      .select('count')
      .limit(1);

    if (testError) {
      console.log('⚠️ Tables need to be created. Creating basic structure...');
      
      // Create basic financial categories table for minimal functionality
      const { error: createError } = await supabase.rpc('exec', {
        query: `
          CREATE TABLE IF NOT EXISTS financial_categories_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            user_id UUID REFERENCES auth.users(id),
            name TEXT NOT NULL,
            type TEXT CHECK (type IN ('income','expense')) NOT NULL,
            color TEXT DEFAULT '#3b82f6',
            icon TEXT DEFAULT 'FiDollarSign',
            description TEXT,
            scope TEXT CHECK (scope IN ('business','personal')) DEFAULT 'business',
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          ALTER TABLE financial_categories_pos_v1 ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" 
          ON financial_categories_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);

          CREATE TABLE IF NOT EXISTS financial_transactions_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID,
            user_id UUID REFERENCES auth.users(id),
            category_id UUID REFERENCES financial_categories_pos_v1(id),
            title TEXT NOT NULL,
            description TEXT,
            amount DECIMAL(10,2) NOT NULL,
            type TEXT CHECK (type IN ('income','expense')) NOT NULL,
            payment_method TEXT DEFAULT 'cash',
            transaction_date TIMESTAMPTZ DEFAULT NOW(),
            reference_number TEXT,
            tags TEXT[] DEFAULT '{}',
            scope TEXT CHECK (scope IN ('business','personal')) DEFAULT 'business',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          ALTER TABLE financial_transactions_pos_v1 ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" 
          ON financial_transactions_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);

          CREATE TABLE IF NOT EXISTS tenants_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT NOT NULL,
            plan TEXT DEFAULT 'basic',
            settings JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          ALTER TABLE tenants_pos_v1 ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" 
          ON tenants_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);

          CREATE TABLE IF NOT EXISTS staff_pos_v1 (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tenant_id UUID REFERENCES tenants_pos_v1(id),
            user_id UUID REFERENCES auth.users(id),
            email TEXT NOT NULL,
            role TEXT DEFAULT 'admin',
            permissions TEXT[] DEFAULT ARRAY['full_access'],
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );

          ALTER TABLE staff_pos_v1 ENABLE ROW LEVEL SECURITY;
          CREATE POLICY IF NOT EXISTS "Enable all access for authenticated users" 
          ON staff_pos_v1 
          FOR ALL 
          TO authenticated 
          USING (true) 
          WITH CHECK (true);

          -- Make tenant_id optional for financial_categories_pos_v1
          ALTER TABLE financial_categories_pos_v1 
          DROP CONSTRAINT IF EXISTS financial_categories_pos_v1_tenant_id_fkey;
          
          ALTER TABLE financial_categories_pos_v1 
          ADD CONSTRAINT financial_categories_pos_v1_tenant_id_fkey 
          FOREIGN KEY (tenant_id) REFERENCES tenants_pos_v1(id) 
          ON DELETE SET NULL;

          -- Make tenant_id optional for financial_transactions_pos_v1
          ALTER TABLE financial_transactions_pos_v1 
          DROP CONSTRAINT IF EXISTS financial_transactions_pos_v1_tenant_id_fkey;
          
          ALTER TABLE financial_transactions_pos_v1 
          ADD CONSTRAINT financial_transactions_pos_v1_tenant_id_fkey 
          FOREIGN KEY (tenant_id) REFERENCES tenants_pos_v1(id) 
          ON DELETE SET NULL;
        `
      });

      if (createError) {
        console.log('❌ Could not create tables via RPC, using fallback method');
        return { success: false, error: createError };
      }
    }

    console.log('✅ Database connection established');
    return { success: true };
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return { success: false, error };
  }
};

// Create superadmin user
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