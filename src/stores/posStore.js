import { create } from 'zustand';
import { supabase } from '../config/supabase';

// Mock data for offline demo
const mockTables = [
  { id: 'table-1', name: 'Table 1', capacity: 4, status: 'ready', is_ad_hoc: false },
  { id: 'table-2', name: 'Table 2', capacity: 2, status: 'occupied', is_ad_hoc: false },
  { id: 'table-3', name: 'Table 3', capacity: 6, status: 'ready', is_ad_hoc: false },
  { id: 'table-4', name: 'Table 4', capacity: 4, status: 'reserved', is_ad_hoc: false },
  { id: 'table-5', name: 'Table 5', capacity: 2, status: 'ready', is_ad_hoc: false },
  { id: 'bar-1', name: 'Bar Seat 1', capacity: 1, status: 'ready', is_ad_hoc: false },
  { id: 'bar-2', name: 'Bar Seat 2', capacity: 1, status: 'ready', is_ad_hoc: false },
  { id: 'bar-3', name: 'Bar Seat 3', capacity: 1, status: 'occupied', is_ad_hoc: false }
];

const mockMenuItems = [
  { id: 'item-1', name: 'Burger Deluxe', base_price: 14.99, description: 'Premium beef burger with all the fixings', category: 'Food' },
  { id: 'item-2', name: 'Caesar Salad', base_price: 12.99, description: 'Fresh romaine with caesar dressing', category: 'Food' },
  { id: 'item-3', name: 'Fish & Chips', base_price: 16.99, description: 'Beer battered fish with crispy fries', category: 'Food' },
  { id: 'item-4', name: 'Pasta Carbonara', base_price: 15.99, description: 'Creamy pasta with bacon and parmesan', category: 'Food' },
  { id: 'item-5', name: 'Chicken Wings', base_price: 13.99, description: '10 piece wings with your choice of sauce', category: 'Food' },
  { id: 'item-6', name: 'French Fries', base_price: 5.99, description: 'Crispy golden fries', category: 'Food' },
  { id: 'item-7', name: 'Coca Cola', base_price: 2.99, description: 'Classic soft drink', category: 'Drinks' },
  { id: 'item-8', name: 'Coffee', base_price: 3.99, description: 'Freshly brewed coffee', category: 'Drinks' }
];

const mockCategories = [
  { id: 'cat-1', name: 'Food', sort_order: 1 },
  { id: 'cat-2', name: 'Drinks', sort_order: 2 }
];

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
  
  // Offline mode
  isOfflineMode: false,

  // Check if we're in offline demo mode
  getOfflineMode: () => {
    // Check if auth store is in offline demo mode
    const authStore = window?.authStore || {};
    return authStore.isOfflineDemo || false;
  },

  // Load tables for current location
  loadTables: async (locationId) => {
    try {
      if (get().getOfflineMode()) {
        // Use mock data for offline demo
        set({ tables: mockTables, isOfflineMode: true });
        return;
      }

      const { data: tables, error } = await supabase
        .from('tables_pos_v1')
        .select('*')
        .eq('location_id', locationId)
        .order('name');

      if (error) {
        console.error('Error loading tables:', error);
        // Fallback to mock data
        set({ tables: mockTables, isOfflineMode: true });
        return;
      }

      set({ tables: tables || [], isOfflineMode: false });
    } catch (error) {
      console.error('Error in loadTables:', error);
      // Fallback to mock data
      set({ tables: mockTables, isOfflineMode: true });
    }
  },

  // Create ad-hoc table
  createAdHocTable: async (locationId, name, capacity = 2) => {
    try {
      if (get().isOfflineMode) {
        // Create mock table for offline demo
        const newTable = {
          id: 'table-' + Date.now(),
          location_id: locationId,
          name,
          capacity,
          is_ad_hoc: true,
          status: 'ready'
        };
        
        set(state => ({
          tables: [...state.tables, newTable]
        }));
        
        return { data: newTable };
      }

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
      if (get().isOfflineMode) {
        // Update mock table status
        set(state => ({
          tables: state.tables.map(table =>
            table.id === tableId ? { ...table, status } : table
          )
        }));
        return {};
      }

      const { error } = await supabase
        .from('tables_pos_v1')
        .update({ 
          status, 
          updated_at: new Date().toISOString() 
        })
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
      if (get().getOfflineMode()) {
        // Use mock data for offline demo
        set({ 
          menuItems: mockMenuItems, 
          categories: mockCategories,
          isOfflineMode: true 
        });
        return;
      }

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
        // Fallback to mock data
        set({ 
          menuItems: mockMenuItems, 
          categories: mockCategories,
          isOfflineMode: true 
        });
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
        categories: categories || [],
        isOfflineMode: false
      });
    } catch (error) {
      console.error('Error in loadMenu:', error);
      // Fallback to mock data
      set({ 
        menuItems: mockMenuItems, 
        categories: mockCategories,
        isOfflineMode: true 
      });
    }
  },

  // Create new order
  createOrder: async (locationId, tableId, orderType = 'dine-in') => {
    try {
      if (get().isOfflineMode) {
        // Create mock order for offline demo
        const mockOrder = {
          id: 'order-' + Date.now(),
          location_id: locationId,
          table_id: tableId,
          order_type: orderType,
          status: 'pending',
          subtotal: 0,
          tax: 0,
          tip: 0,
          items: []
        };
        
        set({ currentOrder: mockOrder });
        return { data: mockOrder };
      }

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
      if (get().isOfflineMode) {
        // Add item to mock order
        const menuItem = mockMenuItems.find(item => item.id === menuItemId);
        if (!menuItem) return { error: { message: 'Menu item not found' } };

        const orderItem = {
          id: 'order-item-' + Date.now(),
          order_id: orderId,
          menu_item_id: menuItemId,
          quantity,
          unit_price: menuItem.base_price,
          modifiers,
          menu_item: menuItem
        };

        // Update current order
        const currentOrder = get().currentOrder;
        if (currentOrder) {
          const updatedOrder = {
            ...currentOrder,
            items: [...(currentOrder.items || []), orderItem],
            subtotal: (currentOrder.subtotal || 0) + (menuItem.base_price * quantity)
          };
          set({ currentOrder: updatedOrder });
        }

        return { data: orderItem };
      }

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
      if (get().isOfflineMode) {
        // Mock split bill for offline demo
        console.log('Split bill (offline demo):', { orderId, itemIds, targetTableId });
        return { data: 'split-order-' + Date.now() };
      }

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
      if (get().isOfflineMode) {
        // Skip real-time setup for offline demo
        console.log('Skipping real-time setup (offline demo mode)');
        return;
      }

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