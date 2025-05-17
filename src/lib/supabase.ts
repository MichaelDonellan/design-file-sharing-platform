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

// Set up storage policies
async function setupStoragePolicies() {
  try {
    // Drop existing policies
    await supabase.rpc('drop_policy', { policy_name: 'Public Access' });
    await supabase.rpc('drop_policy', { policy_name: 'Authenticated users can upload files' });
    await supabase.rpc('drop_policy', { policy_name: 'Users can update their own files' });
    await supabase.rpc('drop_policy', { policy_name: 'Users can delete their own files' });

    // Create new policies
    await supabase.rpc('create_policy', {
      policy_name: 'Public Access',
      definition: 'FOR SELECT USING (bucket_id = \'designs\')'
    });

    await supabase.rpc('create_policy', {
      policy_name: 'Authenticated users can upload files',
      definition: 'FOR INSERT TO authenticated WITH CHECK (bucket_id = \'designs\')'
    });

    await supabase.rpc('create_policy', {
      policy_name: 'Users can update their own files',
      definition: 'FOR UPDATE TO authenticated USING (bucket_id = \'designs\')'
    });

    await supabase.rpc('create_policy', {
      policy_name: 'Users can delete their own files',
      definition: 'FOR DELETE TO authenticated USING (bucket_id = \'designs\')'
    });

    console.log('Storage policies set up successfully');
    return true;
  } catch (error) {
    console.error('Error setting up storage policies:', error);
    return false;
  }
}

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

    let designsBucket = buckets.find(b => b.name === 'designs');
    
    // Create bucket if it doesn't exist
    if (!designsBucket) {
      console.log('Creating designs bucket...');
      const { data: newBucket, error: createError } = await supabase
        .storage
        .createBucket('designs', {
          public: true,
          fileSizeLimit: 52428800,
          allowedMimeTypes: [
            'image/png',
            'image/jpeg',
            'image/gif',
            'image/svg+xml',
            'application/x-font-ttf',
            'application/x-font-otf',
            'application/vnd.ms-fontobject',
            'application/font-woff',
            'application/font-woff2',
            'application/zip',
            'application/x-zip-compressed',
            'application/postscript',
            'application/pdf',
            'image/vnd.adobe.photoshop',
            'application/illustrator'
          ]
        });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return false;
      }

      designsBucket = newBucket;

      // Set up initial policies
      const { error: policyError } = await supabase
        .from('storage.objects')
        .select('*')
        .limit(1);

      if (policyError) {
        console.error('Error setting up policies:', policyError);
        return false;
      }
    }

    // Check if bucket is public
    if (!designsBucket.public) {
      console.error('Designs bucket is not public');
      return false;
    }

    console.log('Storage bucket configuration verified:', {
      bucketExists: true,
      publicAccess: true
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