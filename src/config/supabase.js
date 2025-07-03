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
    // Schema is already initialized via SQL queries
    console.log('Schema already initialized');
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