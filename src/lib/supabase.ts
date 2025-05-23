import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Get Supabase URL and key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Track initialization status
export let isInitialized = false;

// Create a client (real or mock depending on available credentials)
let client: any;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase credentials. Using mock implementation for UI testing.');
  
  // Create a simple mock client for UI testing
  client = {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: (_event: string, _session: any) => {
        // Just return a mock subscription that does nothing
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
    },
    storage: {
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: '/placeholder.png' } }),
        download: async () => ({ data: new Blob(), error: null }),
        upload: async () => ({ data: { path: '/mock-path' }, error: null }),
      }),
    },
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: getMockData(table), error: null }),
          limit: () => ({ data: getMockData(table), error: null }),
          order: () => ({ data: getMockData(table), error: null }),
        }),
        order: () => ({
          eq: () => ({ data: getMockData(table), error: null }),
        }),
        limit: () => ({ data: getMockData(table), error: null }),
      }),
      insert: () => ({ error: null }),
      update: () => ({
        eq: () => ({ error: null }),
      }),
      delete: () => ({
        eq: () => ({ error: null }),
      }),
    }),
  };
  
  // Since we're using a mock, we can consider it initialized
  isInitialized = true;
} else {
  // Create a real Supabase client
  client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    },
    global: {
      headers: {
        'x-application-name': 'designshare'
      }
    }
  });
  
  // Check connection
  (async () => {
    try {
      const { error } = await client.from('designs').select('id').limit(1);
      if (error) {
        console.error('Supabase connection error:', error);
      } else {
        console.log('Successfully connected to Supabase');
        isInitialized = true;
      }
    } catch (err) {
      console.error('Failed to connect to Supabase:', err);
    }
  })();
}

// Export the client
export const supabase = client;

// Helper function to generate a standardized file path
export function generateStoragePath(designId: string, filename: string): string {
  const baseName = filename.includes('.')
    ? filename.substring(0, filename.lastIndexOf('.'))
    : filename;
  
  const extension = filename.includes('.')
    ? filename.substring(filename.lastIndexOf('.') + 1)
    : '';
  
  const slugified = baseName
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
  
  return `designs/${designId}/${slugified}.${extension}`;
}

// Helper function to upload a file
export async function uploadFile(file: File, path: string, designId?: string) {
  try {
    const uploadPath = designId 
      ? generateStoragePath(designId, file.name)
      : path;
    
    console.log(`Uploading file to ${uploadPath}`);
    
    const { data, error } = await supabase.storage
      .from('designs')
      .upload(uploadPath, file, {
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
export function getPublicUrl(path: string): string {
  if (!supabaseUrl || !supabaseAnonKey) {
    return '/placeholder.png';
  }
  
  const { data } = supabase.storage
    .from('designs')
    .getPublicUrl(path);
  
  return data.publicUrl;
}

// Mock data for UI testing
function getMockData(table: string): any[] {
  const mockData: Record<string, any[]> = {
    designs: [{
      id: '1',
      name: 'Testing downloads',
      description: 'A beautiful design for testing the download functionality',
      file_type: 'image',
      user_id: '1',
      downloads: 2,
      views: 0,
      favorites: 0,
      store_id: '1',
      category: 'Templates',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      price: 0, // Free design
      tags: ['modern', 'minimal', 'download'],
      thumbnail_url: '/placeholder.png',
    }],
    design_mockups: [
      {
        id: '1',
        design_id: '1',
        mockup_path: '/placeholder.png',
        created_at: new Date().toISOString(),
        display_order: 1
      }
    ],
    design_files: [
      {
        id: '1',
        design_id: '1',
        file_path: 'designs/1/test-file.png',
        file_type: 'image',
        created_at: new Date().toISOString(),
        display_order: 1
      }
    ],
    stores: [
      {
        id: '1',
        name: 'Test Store',
        description: 'A store for testing purposes',
        user_id: '1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        logo_url: null,
        banner_url: null
      }
    ],
    reviews: [],
    design_favorites: []
  };
  
  return mockData[table] || [];
}
