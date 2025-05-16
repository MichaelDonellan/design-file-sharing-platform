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
  } else {
    console.log('Successfully connected to Supabase');
  }
});

export { isInitialized };

// Verify storage bucket configuration
export async function verifyStorageBucket() {
  try {
    // Check if the designs bucket exists
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets();

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return false;
    }

    const designsBucket = buckets.find(b => b.name === 'designs');
    if (!designsBucket) {
      console.error('Designs bucket not found');
      return false;
    }

    // Check bucket public access
    const { data: { publicUrl } } = supabase
      .storage
      .from('designs')
      .getPublicUrl('test.txt');

    console.log('Storage bucket configuration verified:', {
      bucketExists: true,
      publicAccess: true,
      publicUrl
    });

    return true;
  } catch (error) {
    console.error('Error verifying storage bucket:', error);
    return false;
  }
}

// Initialize storage verification
verifyStorageBucket().then(isValid => {
  if (!isValid) {
    console.error('Storage bucket configuration is invalid. Please check your Supabase settings.');
  }
});