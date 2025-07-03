import { create } from 'zustand';
import { supabase } from '../config/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  currentTenant: null,
  currentLocation: null,
  tenants: [],
  locations: [],
  loading: false,
  isOfflineDemo: false,
  isSuperAdmin: false,
  initialized: false,

  // Initialize auth state
  initialize: async () => {
    if (get().initialized) return; // Prevent multiple initializations

    set({ loading: true });
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await get().loadUserData(session.user);
      }
      
      set({ initialized: true });
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({ initialized: true });
    }
    
    set({ loading: false });
  },

  // Load user tenants and locations
  loadUserData: async (user) => {
    set({ user });
    
    try {
      // First check if staff table has permissions column
      const { data: columns } = await supabase.rpc('exec', {
        query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_pos_v1' AND column_name = 'permissions';`
      });

      let query;
      if (columns && columns.length > 0) {
        // Permissions column exists, use it
        query = supabase
          .from('staff_pos_v1')
          .select(`
            tenant_id,
            role,
            permissions,
            tenant:tenant_id (
              id,
              name,
              plan
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);
      } else {
        // Permissions column doesn't exist, don't select it
        query = supabase
          .from('staff_pos_v1')
          .select(`
            tenant_id,
            role,
            tenant:tenant_id (
              id,
              name,
              plan
            )
          `)
          .eq('user_id', user.id)
          .eq('is_active', true);
      }

      const { data: tenants, error } = await query;

      if (error) {
        console.error('Error loading tenants:', error);
        // Fallback to offline demo
        await get().accessDemo();
        return;
      }

      if (tenants && tenants.length > 0) {
        const tenantsData = tenants.map(t => ({
          ...t.tenant,
          role: t.role,
          permissions: t.permissions || ['full_access'] // Default permissions if column doesn't exist
        }));

        // Check if user is superadmin
        const isSuperAdmin = tenants.some(t => t.role === 'superadmin');

        set({
          tenants: tenantsData,
          isSuperAdmin,
          isOfflineDemo: false
        });

        // If superadmin, auto-select system tenant and skip location requirement
        if (isSuperAdmin) {
          const systemTenant = tenantsData.find(t => t.name === 'System Administration');
          if (systemTenant) {
            set({
              currentTenant: systemTenant,
              currentLocation: { id: 'system', name: 'System Administration' }
            });
          }
        }
      } else {
        // No tenants found, create demo staff record
        await get().createDemoStaff(user);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
      // Fallback to offline demo
      await get().accessDemo();
    }
  },

  // Create demo staff record for testing
  createDemoStaff: async (user) => {
    try {
      // Get or create the demo tenant
      let { data: tenant, error: tenantError } = await supabase
        .from('tenants_pos_v1')
        .select('*')
        .eq('name', 'Demo Restaurant')
        .single();

      if (tenantError || !tenant) {
        // Create demo tenant if it doesn't exist
        const { data: newTenant, error: createTenantError } = await supabase
          .from('tenants_pos_v1')
          .insert({
            name: 'Demo Restaurant',
            plan: 'pro',
            settings: {}
          })
          .select()
          .single();

        if (createTenantError) {
          console.error('Error creating demo tenant:', createTenantError);
          // Fallback to offline demo
          await get().accessDemo();
          return;
        }
        tenant = newTenant;
      }

      if (tenant) {
        // Check if staff record already exists
        const { data: existingStaff } = await supabase
          .from('staff_pos_v1')
          .select('*')
          .eq('tenant_id', tenant.id)
          .eq('user_id', user.id)
          .single();

        if (!existingStaff) {
          // Create staff record with or without permissions column
          const staffData = {
            tenant_id: tenant.id,
            user_id: user.id,
            email: user.email,
            role: 'admin',
            is_active: true
          };

          // Check if permissions column exists before adding it
          const { data: columns } = await supabase.rpc('exec', {
            query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_pos_v1' AND column_name = 'permissions';`
          });

          if (columns && columns.length > 0) {
            staffData.permissions = ['full_access'];
          }

          const { data: staff, error: staffError } = await supabase
            .from('staff_pos_v1')
            .insert(staffData)
            .select()
            .single();

          if (staffError) {
            console.error('Error creating staff record:', staffError);
            // Fallback to offline demo
            await get().accessDemo();
            return;
          }
        }

        // Create demo data
        await get().createDemoData(tenant.id);

        // Reload user data
        await get().loadUserData(user);
      }
    } catch (error) {
      console.error('Error creating demo staff:', error);
      // Fallback to offline demo
      await get().accessDemo();
    }
  },

  // Create demo data (menu items, tables, etc.)
  createDemoData: async (tenantId) => {
    try {
      // This is handled by the database initialization
      console.log('Demo data creation handled by database initialization');
    } catch (error) {
      console.error('Error creating demo data:', error);
    }
  },

  // Select tenant and load locations
  selectTenant: async (tenantId) => {
    try {
      const tenant = get().tenants.find(t => t.id === tenantId);
      set({ currentTenant: tenant });

      if (tenantId) {
        if (get().isOfflineDemo) {
          // Use offline demo locations with proper UUIDs
          const locations = [{
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            name: 'Main Location',
            address: {
              street: '123 Demo Street',
              city: 'Demo City',
              state: 'DC',
              zip: '12345'
            }
          }];
          set({ locations });
        } else {
          // For now, create a default location
          const locations = [{
            id: crypto.randomUUID(),
            tenant_id: tenantId,
            name: 'Main Location',
            address: {}
          }];
          set({ locations });
        }
      } else {
        set({ currentTenant: null, locations: [], currentLocation: null });
      }
    } catch (error) {
      console.error('Error in selectTenant:', error);
    }
  },

  // Select location
  selectLocation: (locationId) => {
    const location = get().locations.find(l => l.id === locationId);
    set({ currentLocation: location });
  },

  // Sign in with email/password
  signIn: async (email, password) => {
    set({ loading: true });
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        set({ loading: false });
        return { error };
      }

      if (data.user) {
        await get().loadUserData(data.user);
      }

      set({ loading: false });
      return { data };
    } catch (error) {
      console.error('Sign in exception:', error);
      set({ loading: false });
      return { error };
    }
  },

  // Sign up new user
  signUp: async (email, password) => {
    set({ loading: true });
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Sign up error:', error);
        set({ loading: false });
        return { error };
      }

      set({ loading: false });
      return { data, error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      set({ loading: false });
      return { error };
    }
  },

  // Setup superadmin - this actually creates the user and staff record
  setupSuperAdmin: async () => {
    set({ loading: true });
    
    try {
      console.log('Setting up superadmin...');
      
      // First try to sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: 'kostas@pos.eu',
        password: '1234567'
      });

      if (authError && !authError.message.includes('already registered')) {
        console.error('Auth error:', authError);
        set({ loading: false });
        return { error: authError };
      }

      // Get or create the system tenant
      let { data: systemTenant, error: tenantError } = await supabase
        .from('tenants_pos_v1')
        .select('*')
        .eq('name', 'System Administration')
        .single();

      if (tenantError || !systemTenant) {
        // Create system tenant
        const { data: newTenant, error: createError } = await supabase
          .from('tenants_pos_v1')
          .insert({
            name: 'System Administration',
            plan: 'enterprise',
            settings: { is_global: true }
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating system tenant:', createError);
          set({ loading: false });
          return { error: createError };
        }
        systemTenant = newTenant;
      }

      // Create or update staff record for superadmin
      const userId = authData?.user?.id;
      if (userId && systemTenant) {
        // Check if staff record exists
        const { data: existingStaff } = await supabase
          .from('staff_pos_v1')
          .select('*')
          .eq('user_id', userId)
          .eq('role', 'superadmin')
          .single();

        if (!existingStaff) {
          // Check if permissions column exists
          const { data: columns } = await supabase.rpc('exec', {
            query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_pos_v1' AND column_name = 'permissions';`
          });

          const staffData = {
            tenant_id: systemTenant.id,
            user_id: userId,
            email: 'kostas@pos.eu',
            role: 'superadmin',
            is_active: true
          };

          if (columns && columns.length > 0) {
            staffData.permissions = ['full_access', 'superadmin', 'tenant_management'];
          }

          const { data: staff, error: staffError } = await supabase
            .from('staff_pos_v1')
            .insert(staffData)
            .select()
            .single();

          if (staffError) {
            console.error('Error creating superadmin staff record:', staffError);
            set({ loading: false });
            return { error: staffError };
          }
        }
      }

      set({ loading: false });
      return { data: 'Superadmin created successfully' };
    } catch (error) {
      console.error('Superadmin setup exception:', error);
      set({ loading: false });
      return { error };
    }
  },

  // Quick demo access (completely offline)
  accessDemo: async () => {
    set({ loading: true });
    
    try {
      // Create a mock user for demo purposes with proper UUID
      const mockUser = {
        id: crypto.randomUUID(),
        email: 'demo@restaurant.com',
        created_at: new Date().toISOString(),
        app_metadata: {},
        user_metadata: {}
      };

      // Create mock tenant and location data with proper UUIDs
      const mockTenant = {
        id: crypto.randomUUID(),
        name: 'Demo Restaurant',
        plan: 'pro',
        role: 'admin',
        permissions: ['full_access']
      };

      const mockLocation = {
        id: crypto.randomUUID(),
        tenant_id: mockTenant.id,
        name: 'Main Location',
        address: {
          street: '123 Demo Street',
          city: 'Demo City',
          state: 'DC',
          zip: '12345'
        }
      };

      // Set everything in offline demo mode
      set({
        user: mockUser,
        tenants: [mockTenant],
        locations: [mockLocation],
        currentTenant: mockTenant,
        currentLocation: mockLocation,
        isOfflineDemo: true,
        isSuperAdmin: false,
        loading: false,
        initialized: true
      });

      return { data: { user: mockUser }, error: null };
    } catch (error) {
      console.error('Demo access error:', error);
      set({ loading: false, initialized: true });
      return { error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      if (!get().isOfflineDemo) {
        await supabase.auth.signOut();
      }
      
      set({
        user: null,
        currentTenant: null,
        currentLocation: null,
        tenants: [],
        locations: [],
        isOfflineDemo: false,
        isSuperAdmin: false,
        initialized: false
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}));