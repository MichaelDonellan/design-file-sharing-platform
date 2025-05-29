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
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(44); // default placeholder

  // Fetch favorite state and count
  useEffect(() => {
    if (!id) return;
    const fetchFavoriteState = async () => {
      // Get count
      const { count } = await supabase
        .from('design_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('design_id', id);
      setFavoritesCount(count || 0);
      // Check if user favorited
      if (user) {
        const { data } = await supabase
          .from('design_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('design_id', id)
          .single();
        setIsFavorited(!!data);
      }
    };
    fetchFavoriteState();
  }, [id, user]);

  // Toggle favorite
  const handleFavorite = async () => {
    if (!user) {
      setIsLoginOpen(true);
      return;
    }
    if (!isFavorited) {
      // Add to favorites
      const { error } = await supabase
        .from('design_favorites')
        .insert({ user_id: user.id, design_id: id });
      if (!error) {
        setIsFavorited(true);
        setFavoritesCount((c) => c + 1);
        toast.success('Added to favorites!');
      } else {
        toast.error('Could not add to favorites.');
      }
    } else {
      // Remove from favorites
      const { error } = await supabase
        .from('design_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('design_id', id);
      if (!error) {
        setIsFavorited(false);
        setFavoritesCount((c) => Math.max(0, c - 1));
        toast.info('Removed from favorites.');
      } else {
        toast.error('Could not remove from favorites.');
      }
    }
  };


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
    <div className="bg-gray-50 min-h-screen pb-28">
      {/* Breadcrumb */}
      <nav className="text-sm text-blue-700 py-4 px-4">
        <ol className="flex flex-wrap items-center space-x-2">
          <li><Link to="/" className="hover:underline">Home</Link></li>
          <span>/</span>
          <li><Link to="/graphics" className="hover:underline">Graphics</Link></li>
          <span>/</span>
          <li><Link to="/graphics/printable-illustrations" className="hover:underline">Printable Illustrations</Link></li>
          <span>/</span>
          <li className="text-gray-800 font-semibold">{design?.name || '...'}</li>
        </ol>
      </nav>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto bg-white rounded-lg shadow p-6 md:p-10 flex flex-col md:flex-row gap-8">
        {/* Left: Images & Share */}
        <div className="flex-1 min-w-[280px]">
          {/* Main Image */}
          {files[0]?.url && (
            <img src={files[0].url} alt={design?.name} className="w-full h-72 object-contain rounded-lg border mb-4 bg-gray-100" />
          )}
          {/* Gallery Thumbnails */}
          <div className="flex gap-2 mb-4 overflow-x-auto">
            {files.map((file, idx) => (
              <img
                key={file.id || idx}
                src={file.url}
                alt={`Preview ${idx + 1}`}
                className="w-16 h-16 object-cover rounded border cursor-pointer hover:ring-2 hover:ring-blue-400 transition"
                onClick={() => {
                  // Swap main image with clicked thumbnail
                  const reordered = [...files];
                  const [clicked] = reordered.splice(idx, 1);
                  setFiles([clicked, ...reordered]);
                }}
              />
            ))}
          </div>
          {/* Social Share Buttons */}
          <div className="flex gap-2 mb-2">
            <button className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 text-xs">Share</button>
            <button className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-xs">Pin</button>
          </div>
        </div>

        {/* Right: Details */}
        <div className="flex-1 flex flex-col gap-4">
          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1">{design?.name || '...'}</h1>
          {/* Star Rating & Review */}
          <div className="flex items-center gap-2 mb-2">
            <span className="flex text-yellow-400 text-lg">
              {/* 5 stars always for demo; replace with real rating if available */}
              {[...Array(5)].map((_, i) => (
                <svg key={i} fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" /></svg>
              ))}
            </span>
            <span className="ml-2 text-gray-700 font-semibold">5.0</span>
            <span className="ml-2 text-gray-500 text-sm">based on 1 review</span>
          </div>
          {/* Download Button */}
          {(design && (design.free_download || hasPurchased)) && (
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-green-500 text-white px-6 py-3 rounded-lg font-bold text-lg shadow hover:bg-green-600 w-full max-w-xs"
            >
              <Download className="w-6 h-6" />
              <span>DOWNLOAD FOR FREE</span>
            </button>
          )}
          {/* About Section */}
          <div className="mt-6">
            <h2 className="text-xl font-bold mb-2">About {design?.name || 'this product'}</h2>
            <p className="text-gray-700 whitespace-pre-line">{design?.description}</p>
          </div>

          {/* Favorites and Product Details Section */}
          <div className="mt-8 border-t pt-6">
            {/* Favorites */}
            <div className="flex items-center gap-4 mb-4">
              <span className="text-gray-500 font-semibold text-sm">{favoritesCount}X ADDED TO FAVORITES</span>
              <button
                className={`border font-semibold px-4 py-2 rounded transition text-sm flex items-center gap-1 ${isFavorited ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' : 'border-red-400 text-red-500 hover:bg-red-50'}`}
                onClick={handleFavorite}
              >
                <svg width="20" height="20" fill="none" stroke={isFavorited ? '#fff' : 'currentColor'} strokeWidth="2" viewBox="0 0 24 24"><path d="M12 21C12 21 4 13.5 4 8.5C4 5.42 6.42 3 9.5 3C11.24 3 12.91 3.81 14 5.08C15.09 3.81 16.76 3 18.5 3C21.58 3 24 5.42 24 8.5C24 13.5 16 21 16 21H12Z"/></svg>
                {isFavorited ? 'ADDED TO FAVORITES' : 'ADD TO FAVORITES'}
              </button>
            </div>

            {/* Product Details Emoji List */}
            <ul className="text-gray-800 space-y-1 text-base mb-4">
              <li>👉 You’ll receive 45 Designs</li>
              <li>👉 PNG files – Solid Color / Distressed Effect</li>
              <li>👉 Resolution 300 dpi (12×12 inches) with transparent background.</li>
              <li>👉 Easy to resize with different software.</li>
              <li>👉 Perfect for a multitude of creative projects – frame artwork, cards, scrapbooks, t-shirts, pillows, bags, mugs, stickers, and much more.</li>
              <li>👉 Colors may slightly vary from what you see on your end, as each monitor is calibrated differently.</li>
              <li>👉 If you have any questions or need help, please feel free to message me.</li>
              <li>💖 Project idea is gifted for you so don’t forget to subscribe to me for following up my latest arts.</li>
            </ul>
            <div className="text-gray-700 text-base mb-2">
              <span className="font-bold">NOTE:</span> <br />
              This is a digital instant download. No physical item will be sent to you.<br />Thank you!<span className="ml-1">❤</span>
            </div>

            {/* Share Your Project Section */}
            <div className="mt-6 bg-purple-50 rounded-lg p-4">
              <h3 className="font-bold text-gray-800 mb-1 text-base uppercase tracking-wide">Share your project made with this product!</h3>
              <p className="text-gray-700 text-sm">Did you make something using this product? Share a picture of your project so others can get inspired by your creation! Your post will be visible to others.</p>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {/* Reviews Card */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="font-bold text-xl mb-2 text-gray-900">Reviews</h2>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl font-bold text-gray-900">5.0</span>
                <span className="flex text-yellow-400 text-xl">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} fill="currentColor" viewBox="0 0 20 20" className="w-6 h-6"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" /></svg>
                  ))}
                </span>
                <span className="ml-2 text-gray-700 font-semibold">1 Review</span>
              </div>
              <button className="w-full bg-purple-200 text-purple-900 font-bold rounded-md py-3 mt-4 mb-6 hover:bg-purple-300 transition flex items-center justify-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6m0 0V4m0 10H6m6 0h6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                WRITE A REVIEW
              </button>
              {/* Example Review */}
              <div className="bg-gray-50 rounded-lg p-4 flex flex-col gap-2">
                <div className="flex items-center gap-3 mb-1">
                  <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Anna Arnstein" className="w-10 h-10 rounded-full object-cover border" />
                  <div>
                    <span className="font-bold text-gray-900">Anna Arnstein</span>
                    <div className="text-xs text-gray-500">March 16, 2025</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex text-yellow-400 text-base">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} fill="currentColor" viewBox="0 0 20 20" className="w-5 h-5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.97a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.38 2.455a1 1 0 00-.364 1.118l1.287 3.97c.3.921-.755 1.688-1.54 1.118l-3.38-2.455a1 1 0 00-1.176 0l-3.38 2.455c-.784.57-1.838-.197-1.539-1.118l1.287-3.97a1 1 0 00-.364-1.118L2.05 9.397c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.97z" /></svg>
                    ))}
                  </span>
                  <span className="text-sm text-green-700 flex items-center gap-1 ml-2"><svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Verified purchaser</span>
                </div>
                <div className="text-gray-800 mt-1">Beautiful designs.</div>
              </div>
            </div>

            {/* Get This Graphic For Free Card */}
            <div className="bg-white rounded-lg shadow p-6 flex flex-col justify-between">
              <h3 className="font-bold text-gray-900 mb-3 uppercase text-base tracking-wide">Get this graphic for free</h3>
              <ul className="mb-6 space-y-2">
                <li className="flex items-center gap-2 text-green-700 font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Includes this graphic</li>
                <li className="flex items-center gap-2 text-green-700 font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Unlimited access to 11,316,728 graphics</li>
                <li className="flex items-center gap-2 text-green-700 font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>New graphics added daily</li>
                <li className="flex items-center gap-2 text-green-700 font-medium"><svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>Get 10 downloads 100% FREE</li>
              </ul>
              <div className="text-center mb-2">
                <span className="font-extrabold text-3xl text-gray-900">FREE</span>
              </div>
              <button
                className="w-full bg-purple-600 text-white font-bold rounded-md py-3 text-lg mt-2 hover:bg-purple-700 transition flex items-center justify-center gap-2"
                onClick={handleDownload}
              >
                <Download className="w-6 h-6" />
                DOWNLOAD FOR FREE
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Related Designs Section */}
      <div className="max-w-5xl mx-auto mt-10">
        {relatedDesigns.length > 0 ? (
          <div>
            <h2 className="text-lg font-bold mb-4">Related Designs</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {relatedDesigns.map((related, index) => (
                <Link key={index} to={`/designs/${related.id}`}
                  className="bg-white rounded-lg shadow p-3 hover:shadow-lg transition">
                  {related.thumbnail_url && (
                    <img src={related.thumbnail_url} alt={related.name} className="w-full h-32 object-cover mb-2 rounded" />
                  )}
                  <h3 className="text-base font-bold mb-1">{related.name}</h3>
                  <p className="text-gray-600 text-sm line-clamp-2">{related.description}</p>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
            No related products available yet. Products with similar tags will appear here.
          </p>
        )}
      </div>

      {/* Floating Chat Icon */}
      <button
        className="fixed bottom-24 right-4 bg-blue-600 text-white rounded-full p-4 shadow-lg hover:bg-blue-700 z-50"
        aria-label="Chat"
        style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.2)' }}
      >
        <svg viewBox="0 0 24 24" fill="none" className="w-7 h-7"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6A8.38 8.38 0 0112.5 3h.5a8.5 8.5 0 018 8.5z" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {/* Sticky Footer Bar for Mobile */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg flex items-center justify-between px-4 py-3 md:hidden z-40">
        <div className="flex items-center gap-2">
          {files[0]?.url && (
            <img src={files[0].url} alt="Preview" className="w-10 h-10 object-cover rounded" />
          )}
          <span className="font-semibold text-gray-900 text-sm truncate max-w-[120px]">{design?.name}</span>
        </div>
        {(design && (design.free_download || hasPurchased)) && (
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg font-bold text-sm shadow hover:bg-green-600"
          >
            <Download className="w-5 h-5" />
            <span>Download</span>
          </button>
        )}
      </div>

      {/* Login Panel */}
      {isLoginOpen && (
        <LoginPanel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      )}
    </div>
  );
};

export default DesignDetail;
