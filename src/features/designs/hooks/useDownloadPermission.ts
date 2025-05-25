import { useState, useEffect } from 'react';
import { supabase } from '../../../services/supabase/client';

interface UseDownloadPermissionResult {
  canDownload: boolean;
  loading: boolean;
  error: string | null;
  checkPermission: (designId: string) => Promise<boolean>;
}

/**
 * Custom hook to determine if a user can download a design
 * Logic:
 * - Free products: Always downloadable
 * - Paid products: Only downloadable by users who have purchased it
 */
export function useDownloadPermission(): UseDownloadPermissionResult {
  const [canDownload, setCanDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Checks if the current user has permission to download the specified design
   * @param designId The ID of the design to check
   * @returns boolean indicating if the user can download the design
   */
  const checkPermission = async (designId: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // No user logged in, can only download free products
        const { data: designData, error: designError } = await supabase
          .from('designs')
          .select('price, is_free_download')
          .eq('id', designId)
          .single();
        
        if (designError) {
          throw designError;
        }
        
        // Can download if it's free
        const canDownload = designData.is_free_download || designData.price === 0;
        setCanDownload(canDownload);
        return canDownload;
      }
      
      // User is logged in - check design details
      const { data: designData, error: designError } = await supabase
        .from('designs')
        .select('price, is_free_download, user_id')
        .eq('id', designId)
        .single();
      
      if (designError) {
        throw designError;
      }
      
      // If design is free or user is the owner, allow download
      if (designData.is_free_download || designData.price === 0 || designData.user_id === user.id) {
        setCanDownload(true);
        return true;
      }
      
      // Check if user has purchased this design
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('design_id', designId)
        .single();
      
      if (purchaseError && purchaseError.code !== 'PGRST116') { // PGRST116 is "No rows returned"
        throw purchaseError;
      }
      
      // Can download if purchase record exists
      const hasPermission = !!purchaseData;
      setCanDownload(hasPermission);
      return hasPermission;
      
    } catch (err) {
      console.error('Error checking download permission:', err);
      setError('Failed to check download permission');
      setCanDownload(false);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    canDownload,
    loading,
    error,
    checkPermission
  };
}
