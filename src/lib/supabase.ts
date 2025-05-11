import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'x-application-name': 'designshare'
    }
  }
});

// Add connection status check
let isInitialized = false;

async function checkConnection() {
  try {
    const { error } = await supabase.from('designs').select('id').limit(1);
    if (error) {
      console.error('Supabase connection error:', error);
      return false;
    }
    isInitialized = true;
    return true;
  } catch (err) {
    console.error('Failed to connect to Supabase:', err);
    return false;
  }
}

// Initialize connection
checkConnection().then(connected => {
  if (!connected) {
    console.error('Failed to establish Supabase connection');
  }
});

export { isInitialized };