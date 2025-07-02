import { create } from 'zustand';
import { supabase } from '../config/supabase';

export const useAuthStore = create((set, get) => ({
  user: null,
  currentTenant: null,
  currentLocation: null,
  tenants: [],
  locations: [],
  loading: false,

  // Initialize auth state
  initialize: async () => {
    set({ loading: true });
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await get().loadUserData(session.user);
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
    set({ loading: false });
  },

  // Load user tenants and locations
  loadUserData: async (user) => {
    set({ user });
    try {
      // Load user's tenants using the new schema
      const { data: tenants, error } = await supabase
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

      if (error) {
        console.error('Error loading tenants:', error);
        // If no staff record exists, create one
        await get().createDemoStaff(user);
        return;
      }

      if (tenants && tenants.length > 0) {
        const tenantsData = tenants.map(t => ({
          ...t.tenant,
          role: t.role,
          permissions: t.permissions
        }));
        set({ tenants: tenantsData });
      } else {
        // Create demo staff record if none exists
        await get().createDemoStaff(user);
      }
    } catch (error) {
      console.error('Error in loadUserData:', error);
      // Try to create demo staff as fallback
      await get().createDemoStaff(user);
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
          // Create staff record
          const { data: staff, error: staffError } = await supabase
            .from('staff_pos_v1')
            .insert({
              tenant_id: tenant.id,
              user_id: user.id,
              email: user.email,
              role: 'admin',
              permissions: ['full_access'],
              is_active: true
            })
            .select()
            .single();

          if (staffError) {
            console.error('Error creating staff record:', staffError);
            return;
          }
        }

        // Ensure demo location exists
        let { data: location } = await supabase
          .from('locations_pos_v1')
          .select('*')
          .eq('tenant_id', tenant.id)
          .single();

        if (!location) {
          const { data: newLocation } = await supabase
            .from('locations_pos_v1')
            .insert({
              tenant_id: tenant.id,
              name: 'Main Location',
              address: {
                street: '123 Main St',
                city: 'Demo City',
                state: 'DC',
                zip: '12345'
              },
              settings: {}
            })
            .select()
            .single();
          location = newLocation;
        }

        // Reload user data
        await get().loadUserData(user);
      }
    } catch (error) {
      console.error('Error creating demo staff:', error);
    }
  },

  // Select tenant and load locations
  selectTenant: async (tenantId) => {
    try {
      const tenant = get().tenants.find(t => t.id === tenantId);
      set({ currentTenant: tenant });

      if (tenantId) {
        const { data: locations, error } = await supabase
          .from('locations_pos_v1')
          .select('*')
          .eq('tenant_id', tenantId);

        if (error) {
          console.error('Error loading locations:', error);
        } else {
          set({ locations: locations || [] });
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
        set({ loading: false });
        return { error };
      }

      if (data.user) {
        await get().loadUserData(data.user);
      }

      set({ loading: false });
      return { data };
    } catch (error) {
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
        password,
        options: {
          emailRedirectTo: window.location.origin
        }
      });

      set({ loading: false });
      return { data, error };
    } catch (error) {
      set({ loading: false });
      return { error };
    }
  },

  // Sign out
  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({
        user: null,
        currentTenant: null,
        currentLocation: null,
        tenants: [],
        locations: []
      });
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }
}));