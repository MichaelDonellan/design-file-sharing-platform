import { supabase } from './supabase';

/**
 * Generates a public URL for a file stored in Supabase Storage
 * @param path The storage path of the file
 * @returns A public URL for the file
 */
export function getStorageUrl(path: string): string {
  if (!path) return '/placeholder.png';
  
  try {
    const { data } = supabase.storage
      .from('designs')
      .getPublicUrl(path);
    
    return data.publicUrl;
  } catch (error) {
    console.error('Error generating storage URL:', error);
    return '/placeholder.png';
  }
}
