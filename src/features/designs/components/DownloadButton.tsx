import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { useDownloadPermission } from '../hooks/useDownloadPermission';
import { supabase } from '../../../services/supabase/client';

interface DownloadButtonProps {
  designId: string;
  filePath?: string;
  fileName?: string;
  price: number;
  isFreeDownload: boolean;
  className?: string;
  onDownloadStarted?: () => void;
  onDownloadComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * A reusable download button component that:
 * - Shows for free products or purchased products
 * - Hides for paid products that haven't been purchased
 * - Handles the download process
 */
export default function DownloadButton({
  designId,
  filePath,
  fileName = 'design-file.zip',
  price,
  isFreeDownload,
  className = '',
  onDownloadStarted,
  onDownloadComplete,
  onError
}: DownloadButtonProps) {
  const { canDownload, loading, checkPermission } = useDownloadPermission();
  const [isChecking, setIsChecking] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const checkDownloadPermission = async () => {
      await checkPermission(designId);
      setIsChecking(false);
    };
    
    checkDownloadPermission();
  }, [designId, checkPermission]);
  
  const handleDownload = async () => {
    try {
      setDownloading(true);
      onDownloadStarted?.();
      
      // Fetch the file path if not provided
      let downloadPath = filePath;
      if (!downloadPath) {
        const { data: fileData, error: fileError } = await supabase
          .from('design_files')
          .select('file_path')
          .eq('design_id', designId)
          .single();
          
        if (fileError || !fileData?.file_path) {
          throw new Error('Could not find file to download');
        }
        
        downloadPath = fileData.file_path;
      }
      
      // Ensure downloadPath is defined
      if (!downloadPath) {
        throw new Error('No file path available for download');
      }
      
      // Download file from Supabase storage
      const { data, error: downloadError } = await supabase.storage
        .from('design-files')
        .download(downloadPath);
        
      if (downloadError) {
        throw downloadError;
      }
      
      // Create download link and trigger download
      const downloadUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Get the file ID for tracking the download
      const { data: fileData } = await supabase
        .from('design_files')
        .select('id')
        .eq('design_id', designId)
        .order('display_order', { ascending: true })
        .limit(1)
        .single();

      // Track download in database
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Record the download in design_files_downloads
        await supabase.from('design_files_downloads').insert({
          design_file_id: fileData?.id,
          user_id: user.id
        });
        
        // Update the downloads count
        await supabase.rpc('increment_download_count', { design_id: designId });
        
        // Add entry to purchases table for free downloads if it doesn't exist
        if (isFreeDownload || price === 0) {
          // Check if purchase record already exists
          const { data: existingPurchase } = await supabase
            .from('purchases')
            .select('id')
            .eq('user_id', user.id)
            .eq('design_id', designId)
            .single();
            
          if (!existingPurchase) {
            await supabase.from('purchases').insert({
              design_id: designId,
              user_id: user.id,
              amount: 0,
              currency: 'USD',
              status: 'completed'
            });
          }
        }
      }
      
      onDownloadComplete?.();
    } catch (err) {
      console.error('Download failed:', err);
      onError?.(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setDownloading(false);
    }
  };
  
  // Don't render button while checking permissions
  if (isChecking || loading) {
    return (
      <button 
        disabled
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-gray-400 ${className}`}
      >
        <span className="mr-2">Checking...</span>
      </button>
    );
  }
  
  // Don't render button if user doesn't have permission
  if (!canDownload) {
    // For paid designs that haven't been purchased, don't show download button
    if (price > 0 && !isFreeDownload) {
      return null;
    }
    
    // For free designs, show login prompt
    return (
      <button 
        disabled
        className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 opacity-70 ${className}`}
      >
        <Download size={16} className="mr-2" />
        <span>Login to download</span>
      </button>
    );
  }
  
  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${className}`}
    >
      <Download size={16} className="mr-2" />
      <span>{downloading ? 'Downloading...' : 'Download'}</span>
    </button>
  );
}
