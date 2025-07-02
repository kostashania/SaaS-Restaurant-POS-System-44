import { create } from 'zustand';
import { supabase } from '../config/supabase';

export const usePosStore = create((set, get) => ({
  // Tables
  tables: [],
  selectedTable: null,
  
  // Orders
  currentOrder: null,
  orders: [],
  
  // Menu
  menuItems: [],
  categories: [],
  
  // Real-time subscriptions
  subscriptions: [],

  // Load tables for current location
  loadTables: async (locationId) => {
    try {
      const { data: tables, error } = await supabase
        .from('tables_pos_v1')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) {
        console.error('Error loading tables:', error);
        return;
      }

      set({ tables: tables || [] });
    } catch (error) {
      console.error('Error in loadTables:', error);
    }
  },

  // Create ad-hoc table
  createAdHocTable: async (locationId, name, capacity = 2) => {
    try {
      const { data, error } = await supabase
        .from('tables_pos_v1')
        .insert({
          location_id: locationId,
          name,
          capacity,
          is_ad_hoc: true,
          status: 'ready'
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating table:', error);
        return { error };
      }

      if (data) {
        set(state => ({
          tables: [...state.tables, data]
        }));
      }

      return { data };
    } catch (error) {
      console.error('Error in createAdHocTable:', error);
      return { error };
    }
  },

  // Update table status
  updateTableStatus: async (tableId, status) => {
    try {
      const { error } = await supabase
        .from('tables_pos_v1')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', tableId);

      if (error) {
        console.error('Error updating table status:', error);
        return { error };
      }

      set(state => ({
        tables: state.tables.map(table =>
          table.id === tableId ? { ...table, status } : table
        )
      }));

      return {};
    } catch (error) {
      console.error('Error in updateTableStatus:', error);
      return { error };
    }
  },

  // Select table
  selectTable: (table) => {
    set({ selectedTable: table });
  },

  // Load menu items
  loadMenu: async (tenantId) => {
    try {
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items_pos_v1')
        .select(`
          *,
          inventory:inventory_pos_v1 (
            quantity,
            alert_threshold,
            last_restocked
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('is_available', true);

      if (menuError) {
        console.error('Error loading menu items:', menuError);
        return;
      }

      const { data: categories, error: catError } = await supabase
        .from('menu_categories_pos_v1')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_active', true)
        .order('sort_order');

      if (catError) {
        console.error('Error loading categories:', catError);
      }

      set({ 
        menuItems: menuItems || [], 
        categories: categories || [] 
      });
    } catch (error) {
      console.error('Error in loadMenu:', error);
    }
  },

  // Create new order
  createOrder: async (locationId, tableId, orderType = 'dine-in') => {
    try {
      const { data, error } = await supabase
        .from('orders_pos_v1')
        .insert({
          location_id: locationId,
          table_id: tableId,
          order_type: orderType,
          status: 'pending',
          subtotal: 0,
          tax: 0,
          tip: 0
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        return { error };
      }

      set({ currentOrder: data });
      return { data };
    } catch (error) {
      console.error('Error in createOrder:', error);
      return { error };
    }
  },

  // Add item to order
  addItemToOrder: async (orderId, menuItemId, quantity = 1, modifiers = []) => {
    try {
      // Get menu item price
      const { data: menuItem } = await supabase
        .from('menu_items_pos_v1')
        .select('base_price')
        .eq('id', menuItemId)
        .single();

      if (!menuItem) {
        return { error: { message: 'Menu item not found' } };
      }

      const { data, error } = await supabase
        .from('order_items_pos_v1')
        .insert({
          order_id: orderId,
          menu_item_id: menuItemId,
          quantity,
          unit_price: menuItem.base_price,
          modifiers,
          status: 'pending'
        })
        .select(`
          *,
          menu_item:menu_item_id (
            name,
            base_price,
            modifiers
          )
        `)
        .single();

      if (error) {
        console.error('Error adding item to order:', error);
        return { error };
      }

      // Update order subtotal
      const { error: updateError } = await supabase.rpc('update_order_total', {
        order_id: orderId
      });

      if (updateError) {
        console.error('Error updating order total:', updateError);
      }

      return { data };
    } catch (error) {
      console.error('Error in addItemToOrder:', error);
      return { error };
    }
  },

  // Split bill
  splitBill: async (orderId, itemIds, targetTableId) => {
    try {
      const { data, error } = await supabase.rpc('split_order_pos_v1', {
        original_order_id: orderId,
        item_ids: itemIds,
        target_table_id: targetTableId
      });

      if (error) {
        console.error('Error splitting bill:', error);
        return { error };
      }

      return { data };
    } catch (error) {
      console.error('Error in splitBill:', error);
      return { error };
    }
  },

  // Setup real-time subscriptions
  setupRealtime: (locationId) => {
    try {
      // Clean up existing subscriptions
      get().cleanup();

      const ordersChannel = supabase
        .channel('orders-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'pos_system_v1',
            table: 'orders_pos_v1',
            filter: `location_id=eq.${locationId}`
          },
          (payload) => {
            console.log('Order update:', payload);
            // Refresh orders if needed
          }
        )
        .subscribe();

      const tablesChannel = supabase
        .channel('tables-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'pos_system_v1',
            table: 'tables_pos_v1',
            filter: `location_id=eq.${locationId}`
          },
          (payload) => {
            console.log('Table update:', payload);
            get().loadTables(locationId);
          }
        )
        .subscribe();

      set({ subscriptions: [ordersChannel, tablesChannel] });
    } catch (error) {
      console.error('Error setting up realtime:', error);
    }
  },

  // Clean up subscriptions
  cleanup: () => {
    const { subscriptions } = get();
    subscriptions.forEach(sub => {
      try {
        sub.unsubscribe();
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    });
    set({ subscriptions: [] });
  }
}));