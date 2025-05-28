// DesignDetail.tsx - Detail page for viewing design information
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Download } from 'lucide-react';
import LoginPanel from '../components/LoginPanel';
import { toast } from 'react-toastify';
import type { Design, DesignFile } from '../types';

function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [design, setDesign] = useState<Design | null>(null);
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [relatedDesigns, setRelatedDesigns] = useState<Design[]>([]);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Increment view count for design
  const incrementView = async () => {
    try {
      if (id) {
        // Get the current views from the design object
        const currentViews = design?.views || 0;
        
        // First update locally for immediate feedback
        if (design) {
          setDesign({
            ...design,
            views: currentViews + 1
          });
        }
        
        // Then update in the database
        try {
          await supabase
            .from('designs')
            .update({ views: currentViews + 1 })
            .eq('id', id);
          
          console.log('View count updated successfully');
        } catch (error) {
          console.warn('Could not update view count in database:', error);
          // Already updated UI, so no need for fallback
        }
      }
    } catch (err) {
      console.error('Error in view count logic:', err);
    }
  };

  // --- Realtime subscription for views ---
  useEffect(() => {
    if (!id) return;
    // Only subscribe if Supabase client supports channel API
    // @ts-ignore
    if (!supabase.channel) return;
    // Subscribe to changes on the 'designs' table for this design
    const channel = supabase.channel(`designs:views:${id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'designs',
          filter: `id=eq.${id}`,
        },
        (payload: any) => {
          if (payload.new && typeof payload.new.views === 'number') {
            setDesign((prev) => prev ? { ...prev, views: payload.new.views } : prev);
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe && channel.unsubscribe();
    };
  }, [id]);

  useEffect(() => {
    if (user && id && design && design.price && design.price > 0) {
      // Check if user has purchased
      const checkPurchase = async () => {
        const { data, error: purchaseError } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('design_id', id)
          .single();
          
        if (purchaseError && purchaseError.code !== 'PGRST116') {
          console.error('Error checking purchase:', purchaseError);
        }
        setHasPurchased(!!data);
      };
      checkPurchase();
    }
  }, [user, id, design]);

  useEffect(() => {
    if (id) {
      fetchDesign();
    }
  }, [id]);

  // Fetch design and related data from database
  const fetchDesign = async () => {
    try {
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      if (data) {
        setDesign(data);
        // Increment view count after design is loaded
        incrementView();
        // Check if the current user has favorited this design

        // Fetch related designs from the same store
        const { data: relatedData } = await supabase
          .from('designs')
          .select('*')
          .eq('store_id', data.store_id)
          .neq('id', id)
          .limit(3);

        if (relatedData) {
          setRelatedDesigns(relatedData);
        }

        // Fetch files
        const { data: fileData } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', id)
          .order('display_order', { ascending: true });

        if (fileData) {
          // Add url property for frontend display
          const processedFiles = fileData.map((file: DesignFile) => ({
            ...file,
            url: file.file_path // Add url property based on file_path
          }));
          setFiles(processedFiles);
        }
      }
    } catch (error) {
      console.error('Error fetching design:', error);
    }
  };

  // Handle file download - Only available for free products or purchased products
  const handleDownload = async () => {
    console.log('Starting download process...');

    if (!design) {
      console.error('No design data available');
      return;
    }
    
    // First check if user is logged in
    if (!user) {
      console.log('User not logged in - showing login popup');
      setIsLoginOpen(true);
      return;
    }
    
    // Check if the user can download (free design or has purchased)
    if (design && design.price && design.price > 0 && !hasPurchased) {
      toast.warning('Please purchase this design to download it.');
      console.log('Download blocked - paid item not purchased');
      return;
    }
    
    try {
      // Use the first file from the files array if available
      if (!files || files.length === 0) {
        toast.error('No files available for download');
        return;
      }
      
      // Extract a filename from the file path since DesignFile doesn't have a name property
      const pathParts = files[0].file_path.split('/');
      const fileName = pathParts[pathParts.length - 1] || 'design-file';
      
      // Verify file_path exists
      if (!files[0].file_path) {
        console.error('file_path is null or empty in the database record');
        alert('Download is not available — missing file path.');
        return;
      }
      
      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('designs')
        .download(files[0].file_path);
      
      if (error) {
        console.error('Download error:', error.message);
        alert('Error downloading the file: ' + error.message);
        return;
      }
      
      // Create download link
      const url = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Unexpected error during download:', err);
      alert('An unexpected error occurred during download.');
    }
  };

  return (
    <>
      {/* Download button - only shown for free designs or if purchased */}
      {(design && (design.free_download || hasPurchased)) && (
        <button
          onClick={handleDownload}
          className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          <Download className="w-5 h-5" />
          <span>Download</span>
        </button>
      )}

      {/* Related Designs Section */}
      {relatedDesigns.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-lg font-bold mb-4">Related Designs</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedDesigns.map((related, index) => (
              <Link key={index} to={`/designs/${related.id}`}>
                <div className="bg-white rounded-lg shadow-md p-4">
                  {related.thumbnail_url && (
                    <img src={related.thumbnail_url} alt={related.name} className="w-full h-48 object-cover mb-4" />
                  )}
                  <h3 className="text-lg font-bold mb-2">{related.name}</h3>
                  <p className="text-gray-600">{related.description}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
          No related products available yet. Products with similar tags will appear here.
        </p>
      )}

      {/* Login Panel */}
      {isLoginOpen && (
        <LoginPanel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
    </>
  );
};

export default DesignDetail;
