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
    const { data, error } = await supabase.rpc('initialize_pos_schema_v1');
    if (error) {
      console.error('Schema initialization error:', error);
      return { error };
    }
    return { data };
  } catch (error) {
    console.error('Schema initialization failed:', error);
    return { error };
  }
};