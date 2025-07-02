import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

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