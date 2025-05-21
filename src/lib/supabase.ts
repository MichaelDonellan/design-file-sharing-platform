import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
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
      console.error('Supabase connection error:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return false;
    }
    isInitialized = true;
    return true;
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error('Failed to connect to Supabase:', {
        message: err.message,
        stack: err.stack,
        name: err.name
      });
    } else {
      console.error('Failed to connect to Supabase:', {
        message: 'Unknown error occurred'
      });
    }
    return false;
  }
}

// Initialize connection
checkConnection().then(connected => {
  if (!connected) {
    console.error('Failed to establish Supabase connection');
  } else {
    console.log('Successfully connected to Supabase');
  }
});

export { isInitialized };

// Helper function to upload a file
export async function uploadFile(file: File, path: string) {
  try {
    const { data, error } = await supabase.storage
      .from('designs')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });

    if (error) {
      console.error('Error uploading file:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in uploadFile:', error);
    throw error;
  }
}

// Helper function to get a public URL for a file
export function getPublicUrl(path: string) {
  try {
    const { data, error } = supabase.storage
      .from('designs')
      .getPublicUrl(path);

    if (error) {
      console.error('Error getting public URL:', error);
      return { data: { publicUrl: null }, error };
    }
    
    return { data, error: null };
  } catch (err) {
    console.error('Error in getPublicUrl:', err);
    return { data: { publicUrl: null }, error: err };
  }
}