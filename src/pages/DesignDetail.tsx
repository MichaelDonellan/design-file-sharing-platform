// DesignDetail.tsx - Detail page for viewing design information
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getPublicUrl } from '../lib/supabase';
import ImageCarousel from '../components/ImageCarousel';
import { Eye, Download, Heart, ShoppingCart, Store as StoreIcon, Share2 } from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import LoginPanel from '../components/LoginPanel';
import type { Design, Store, Review, DesignMockup, DesignFile } from '../types';

const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];
const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.52,
};

// File download functionality now uses real files from Supabase storage

export default function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [design, setDesign] = useState<Design | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [mockups, setMockups] = useState<DesignMockup[]>([]);
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedDesigns, setRelatedDesigns] = useState<Design[]>([]);
  const [tagRelatedDesigns, setTagRelatedDesigns] = useState<Design[]>([]);
  const [tagRelatedMockups, setTagRelatedMockups] = useState<Record<string, string>>({});
  // Currency is used for price display
  const [currency] = useState('USD');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

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

  // Stub for purchase handler
  // Handle purchase of paid designs
  const handlePurchase = () => {
    if (!user) {
      alert('Please log in to purchase this design.');
      navigate('/login', { state: { from: `/design/${id}` } });
      return;
    }
    
    if (!design?.price) {
      alert('This design is free!');
      return;
    }
    
    alert(`Purchase functionality coming soon! This will charge $${design.price}.`);
  };

  useEffect(() => {
    if (id) {
      fetchDesign();
      // incrementView will be called after design is loaded
    }
  }, [id]);

  // Fetch designs with similar tags when the current design changes
  useEffect(() => {
    if (design?.tags && design.tags.length > 0) {
      fetchTagRelatedDesigns();
    }
  }, [design?.id, design?.tags]);

  // Fetch designs with similar tags
  const fetchTagRelatedDesigns = async () => {
    if (!design?.tags || design.tags.length === 0) return;
    
    try {
      // Get all designs that share at least one tag with the current design
      // and are not the current design
      const { data, error: fetchError } = await supabase
        .from('designs')
        .select('*')
        .neq('id', id)
        .filter('tags', 'cs', `{${design.tags.join(',')}}`) // Filter designs that have at least one matching tag
        .limit(6);

      if (fetchError) {
        console.error('Error fetching related designs:', fetchError);
        return;
      }
      
      if (data) {
        // Filter out any designs that are already in relatedDesigns (from same store)
        const existingIds = new Set(relatedDesigns.map((d: Design) => d.id));
        const filteredData = data.filter((d: any) => !existingIds.has(d.id));
        const relatedWithTags = filteredData.slice(0, 3); // Limit to 3 designs
        setTagRelatedDesigns(relatedWithTags);
        
        // Fetch mockups for each related design
        const mockupData: Record<string, string> = {};
        
        await Promise.all(relatedWithTags.map(async (design: Design) => {
          const { data: mockups } = await supabase
            .from('design_mockups')
            .select('mockup_path')
            .eq('design_id', design.id)
            .order('display_order', { ascending: true })
            .limit(1);
            
          if (mockups && mockups.length > 0) {
            mockupData[design.id] = getPublicUrl(mockups[0].mockup_path);
          }
        }));
        
        setTagRelatedMockups(mockupData);
      }
    } catch (error) {
      console.error('Error fetching tag-related designs:', error);
    }
  };

  // Fetch design and related data from database
const fetchDesign = async () => {
    try {
      setLoading(true);
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
        if (user) {
          const { data: favoriteData } = await supabase
            .from('design_favorites')
            .select('id')
            .eq('design_id', id)
            .eq('user_id', user.id)
            .single();
          
          setIsFavorited(!!favoriteData);
        }

        // Fetch store data
        if (data.store_id) {
          const { data: storeData } = await supabase
            .from('stores')
            .select('*')
            .eq('id', data.store_id)
            .single();

          setStore(storeData);

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
        }

        // Fetch mockups
        const { data: mockupData } = await supabase
          .from('design_mockups')
          .select('*')
          .eq('design_id', id)
          .order('display_order', { ascending: true });

        if (mockupData) {
          // Map mockup_path to url for frontend display
          const processedMockups = mockupData.map(mockup => ({
            ...mockup,
            url: mockup.mockup_path // Add url property based on mockup_path
          }));
          setMockups(processedMockups);
        }

        // Fetch files
        const { data: fileData } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', id)
          .order('display_order', { ascending: true });

        if (fileData) {
          // Add url property for frontend display
          const processedFiles = fileData.map(file => ({
            ...file,
            url: file.file_path // Add url property based on file_path
          }));
          setFiles(processedFiles);
        }

        // Fetch reviews - Use a simpler query without foreign key reference
        try {
          const { data: reviewsData, error: reviewsError } = await supabase
            .from('reviews')
            .select('*')
            .eq('design_id', id)
            .order('created_at', { ascending: false });

          if (reviewsError) {
            console.error('Error fetching reviews:', reviewsError);
          } else if (reviewsData) {
            // If we have review data, fetch user data separately for each review
            const reviewsWithUsers = await Promise.all(
              reviewsData.map(async (review) => {
                if (review.user_id) {
                  const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', review.user_id)
                    .single();
                  
                  return { ...review, user: userData };
                }
                return review;
              })
            );
            
            setReviews(reviewsWithUsers);
          }
        } catch (reviewError) {
          console.error('Error processing reviews:', reviewError);
        }
      }
    } catch (error) {
      console.error('Error fetching design:', error);
      setError('Failed to load design details.');
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      if (id) {
        // Get the current views from the design object
        const currentViews = design?.views || 0; // Correctly using views property
         design 
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
      // Fail silently to user
    }
  };

  const getCurrencySymbol = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find(c => c.code === code);
    return currency ? currency.symbol : '$';
  };

  // Toggle favorite status of design
  const toggleFavorite = async () => {
    if (!user) {
      alert('Please log in to favorite designs.');
      return;
    }

    if (isProcessing) return;

    try {
      setIsProcessing(true);

      if (isFavorited) {
        // Remove favorite
        const { error } = await supabase
          .from('design_favorites')
          .delete()
          .eq('design_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFavorited(false);

        // Update count
        if (design) {
          const { error: updateError } = await supabase
            .from('designs')
            .update({ favorites: (design.favorites || 0) - 1 })
            .eq('id', design.id);

          if (updateError) throw updateError;
          setDesign({ ...design, favorites: (design.favorites || 0) - 1 });
        }
      } else {
        // Add favorite
        const { error } = await supabase
          .from('design_favorites')
          .insert({ design_id: id, user_id: user.id });

        if (error) throw error;
        setIsFavorited(true);

        // Update count
        if (design) {
          const { error: updateError } = await supabase
            .from('designs')
            .update({ favorites: (design.favorites || 0) + 1 })
            .eq('id', design.id);

          if (updateError) throw updateError;
          setDesign({ ...design, favorites: (design.favorites || 0) + 1 });
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle file download - Only available for free products or purchased products
  const handleDownload = async () => {
    console.log('Starting download process...');
    setIsProcessing(true);
    
    if (!design) {
      console.error('No design data available');
      setIsProcessing(false);
      return;
    }
    
    // Check if user is logged in
    if (!user) {
      console.log('User not logged in, showing login modal');
      setIsProcessing(false);
      setShowLoginModal(true);
      return;
    }
    
    // Check if the user can download (free design or has purchased)
    if (design.price && design.price > 0 && !hasPurchased) {
      alert('Please purchase this design to download it.');
      console.log('Download blocked - paid item not purchased');
      setIsProcessing(false);
      return;
    }
    
    try {
      // Use the first file from the files array if available
      if (!files || files.length === 0) {
        setError('No files available for download');
        setIsProcessing(false);
        return;
      }
      
      // Extract a filename from the file path since DesignFile doesn't have a name property
      const pathParts = files[0].file_path.split('/');
      const fileName = pathParts[pathParts.length - 1] || 'design-file';
      
      // Verify file_path exists
      if (!files[0].file_path) {
        console.error('file_path is null or empty in the database record');
        alert('Download is not available — missing file path.');
        setIsProcessing(false);
        return;
      }
      
      // Download the file from Supabase storage
      const { data, error } = await supabase.storage
        .from('designs')
        .download(files[0].file_path);
      
      if (error) {
        console.error('Download error:', error.message);
        alert('Error downloading the file: ' + error.message);
        setIsProcessing(false);
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
      
      console.log('Download completed successfully');
      
      // Increment download count
      const { error: updateError } = await supabase
        .from('designs')
        .update({ downloads: (design.downloads || 0) + 1 })
        .eq('id', design.id);
      
      if (updateError) {
        console.error('Error updating download count:', updateError);
      }
      
      setIsProcessing(false);
    } catch (err) {
      console.error('Error downloading design:', err);
      alert(`Failed to download design: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  const convertPrice = (usd: number, to: string) => {
    if (!EXCHANGE_RATES[to]) return usd;
    return Math.round((usd * EXCHANGE_RATES[to]) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !design) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error || 'Design not found'}</div>
        <button 
          onClick={() => navigate(-1)}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Login Modal */}
      <LoginPanel 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      <div>
        <div className="mb-8">
          {/* Mockup carousel section */}
          <div className="mb-8">
            <div className="mb-6">
              <div className="relative group">
                <div className="swiper swiper-initialized swiper-horizontal rounded-lg overflow-hidden">
                  <div className="swiper-wrapper">
                    <div className="swiper-slide swiper-slide-active bg-gray-100" style={{ width: '339px' }}>
                      <div className="swiper-zoom-container relative">
                        <img 
                          src={mockups && mockups.length > 0 
                            ? `https://rlldapmwdyeeoloivwfi.supabase.co/storage/v1/object/public/designs/${mockups[0].mockup_path}`
                            : "/placeholder.png"} 
                          alt={design.name} 
                          className="w-full h-[500px] object-contain cursor-zoom-in transition-opacity duration-300 opacity-100" 
                        />
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-center py-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        1 of {mockups ? mockups.length : 1}
                      </div>
                    </div>
                  </div>
                  <div className="swiper-button-prev swiper-button-disabled swiper-button-lock"></div>
                  <div className="swiper-button-next swiper-button-disabled swiper-button-lock"></div>
                  <div className="swiper-pagination swiper-pagination-clickable swiper-pagination-bullets swiper-pagination-horizontal swiper-pagination-bullets-dynamic swiper-pagination-lock" style={{ width: '40px' }}>
                    <span className="swiper-pagination-bullet swiper-pagination-bullet-active swiper-pagination-bullet-active-main" style={{ left: '0px' }}></span>
                  </div>
                </div>
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm bg-black bg-opacity-50 px-3 py-1 rounded-full">
                  1 / {mockups ? mockups.length : 1}
                </div>
              </div>
            </div>
            
            {/* Design info section */}
            <h1 className="text-3xl font-bold mb-2">{design.name}</h1>
            <div className="flex items-center space-x-4 text-gray-700">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-1" aria-hidden="true" />
                <span>{design.views || 0} views</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-1" aria-hidden="true" />
                <span>{design.favorites || 0} favorites</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-1" aria-hidden="true" />
                <span>{design.downloads || 0} downloads</span>
              </div>
            </div>
          </div>
          
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              {mockups && mockups.length > 1 ? (
                <div className="mb-6">
                  <ImageCarousel images={mockups.map(m => getPublicUrl(m.mockup_path))} />
                </div>
              ) : null}
            </div>
            <div>
              <div className="flex items-center mb-4">
                <Link 
                  to={`/store/${store?.id}`} 
                  className="flex items-center text-blue-600 hover:underline"
                >
                  <StoreIcon className="w-5 h-5 mr-2" />
                  <span>{store?.name || 'Unknown Store'}</span>
                </Link>
              </div>
              
              <div className="prose max-w-none mb-8">
                <h2 className="text-xl font-semibold mb-2">Description</h2>
                <p className="text-gray-700">
                  {design.description || 'No description provided'}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                {design.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              
              <div className="flex space-x-4 mb-8">
                {/* Favorite button */}
                <button
                  onClick={toggleFavorite}
                  disabled={isProcessing}
                  className="flex items-center space-x-2 px-4 py-2 rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200"
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                  <span>Favorite</span>
                </button>
                
                {/* Download button - only shown for free designs or if purchased */}
                {(design.price === null || design.price === 0 || hasPurchased) && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                )}
                
                {/* Buy button - only shown for paid designs that haven't been purchased */}
                {design.price && design.price > 0 && !hasPurchased && (
                  <button
                    onClick={handlePurchase}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{`Buy for $${design.price}`}</span>
                  </button>
                )}
                
                {/* Share button */}
                <button
                  onClick={() => {
                    navigator.share({
                      title: design.name,
                      text: design.description,
                      url: window.location.href
                    }).catch(() => {
                      // Fallback for browsers that don't support Web Share API
                      navigator.clipboard.writeText(window.location.href);
                      alert('Link copied to clipboard!');
                    });
                  }}
                  className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {relatedDesigns.length > 0 && (
            <div className="mt-4 mb-6">
              <h3 className="text-lg font-semibold mb-3">More from this seller</h3>
              <div className="grid grid-cols-3 gap-4">
                {relatedDesigns.map((related) => (
                  <Link
                    key={related.id}
                    to={`/design/${related.id}`}
                    className="block hover:opacity-90 transition-opacity"
                  >
                    <img
                      src={related.mockup_path}
                      alt={related.name}
                      className="w-full h-32 object-cover rounded"
                    />
                    <p className="mt-2 text-sm font-medium truncate">
                      {related.name}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Reviews section follows */}

          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-6">Reviews</h2>
            <div className="space-y-8">
              <ReviewForm
                designId={design.id}
                onReviewSubmitted={() => {
                  // Refresh reviews after submission
                  window.location.reload();
                }}
              />
              {reviews && reviews.length > 0 ? (
                <ReviewsList reviews={reviews} />
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No reviews yet. Be the first to review this design!
                </p>
              )}
            </div>
          </div>

          {/* Related Products section - designs with similar tags */}
          <div className="border-t pt-8 mt-8">
            <h2 className="text-xl font-semibold mb-6">Related Products</h2>
            {tagRelatedDesigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {tagRelatedDesigns.map((related) => (
                  <Link
                    key={related.id}
                    to={`/design/${related.id}`}
                    className="group">
                    <div className="overflow-hidden rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-100">
                        <img
                          src={tagRelatedMockups[related.id] || '/placeholder.png'}
                          alt={related.name}
                          className="object-cover w-full h-48 transform group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src = '/placeholder.png';
                          }}
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-medium text-gray-900 mb-1 truncate">{related.name}</h3>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-gray-500">
                            {related.category}
                          </p>
                          <p className="font-medium text-blue-600">
                            {related.price ? `$${related.price}` : 'Free'}
                          </p>
                        </div>
                        {related.tags && related.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {related.tags.slice(0, 2).map((tag, index) => (
                              <span key={index} className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {related.tags.length > 2 && (
                              <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                                +{related.tags.length - 2} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 text-center py-8 bg-gray-50 rounded-lg">
                No related products available yet. Products with similar tags will appear here.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
