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

// Simple initialization that doesn't try to create tables
export const initializeDatabase = async () => {
  try {
    console.log('🔄 Testing database connection...');

    // Simple connection test
    const { data, error } = await supabase
      .from('financial_categories_pos_v1')
      .select('count')
      .limit(1);

    if (error) {
      console.log('⚠️ Table does not exist, will use in-memory storage');
      return { success: false, error };
    }

    console.log('✅ Database connection successful');
    return { success: true };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { success: false, error };
  }
};