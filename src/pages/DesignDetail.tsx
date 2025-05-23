// DesignDetail.tsx - Detail page for viewing design information
import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase, getPublicUrl } from '../lib/supabase';
import ImageCarousel from '../components/ImageCarousel';
import { Eye, Download, Heart, ShoppingCart, Tag, Store as StoreIcon, Calendar, Share2 } from 'lucide-react';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import type { Design, Store, Review, DesignMockup, DesignFile } from '../types';
import { format } from 'date-fns';

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
  // Using USD as default currency
  const [currency] = useState('USD');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [hasPurchased, setHasPurchased] = useState(false);

  useEffect(() => {
    if (user && id && design && design.price && design.price > 0) {
      // Check if user has purchased
      const checkPurchase = async () => {
        const { data, error } = await supabase
          .from('purchases')
          .select('id')
          .eq('user_id', user.id)
          .eq('design_id', id)
          .single();
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
      incrementView();
    }
  }, [id]);

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
      if (id && design) {
        // First update locally for immediate feedback
        const currentViews = design.downloads || 0; // Using downloads as a fallback property
        setDesign({
          ...design,
          views: currentViews + 1
        });
        
        // Then try the RPC call
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
      <div>
        <div className="mb-8">
          {/* Mockup carousel section */}
          <div className="mb-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Mockups</h2>
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
                  <h2 className="text-xl font-semibold mb-4">Mockups</h2>
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
                <button
                  onClick={toggleFavorite}
                  disabled={isProcessing}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md ${isFavorited
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                  <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
                </button>
                
                {/* Download button logic: show if free, or if user has purchased */}
                {(design.price === null || design.price === 0 || hasPurchased) && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                  >
                    <Download className="w-5 h-5" />
                    <span>Download</span>
                  </button>
                )}
                
                {/* Show Buy button if not purchased and paid product */}
                {design.price && design.price > 0 && !hasPurchased && (
                  <button
                    onClick={handlePurchase}
                    className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>{`Buy for $${design.price}`}</span>
                  </button>
                )}
                
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
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <h1 className="text-2xl font-bold truncate max-w-full">{design.name}</h1>
                {/* Price badge */}
                <div className="mt-2 sm:mt-0">
                  {design.price && design.price > 0 ? (
                    <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                      {getCurrencySymbol(currency)}{convertPrice(design.price, currency).toFixed(2)}
                    </span>
                  ) : (
                    <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Free</span>
                  )}
                  </div>
              </div>
              {/* Tags below main info */}
              {design.tags && design.tags.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {design.tags.map((tag) => (
                    <span key={tag} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">{tag}</span>
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center space-x-1">
              <Tag size={16} />
              <span>{design.category}</span>
            </span>
            </div>
          </div>

          <div className="mb-8">
            {mockups && mockups.length > 0 && (
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Mockups</h2>
                <ImageCarousel images={mockups.map(m => getPublicUrl(m.mockup_path))} />
              </div>
            )}
          </div>

          {store && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <StoreIcon size={20} />
                <span>Sold by</span>
                <Link
                  to={`/store/${store.name}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {store.name}
                </Link>
              </div>

              {relatedDesigns.length > 0 && (
                <div className="mt-4">
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
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar size={20} />
                <span>{format(new Date(design.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download size={20} />
                <span>{design.downloads} downloads</span>
              </div>
            </div>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">
              {design.description || 'No description provided'}
            </p>
          </div>

          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-gray-600 mb-4">{design.description}</p>
              <div className="flex flex-wrap gap-2">
                {design.tags?.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={toggleFavorite}
                disabled={isProcessing}
                className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                  isFavorited
                    ? 'bg-red-100 text-red-600 hover:bg-red-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
              </button>
              {/* Download button logic: show if free, or if user has purchased */}
              {(design.price === null || design.price === 0 || hasPurchased) && (
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  <Download className="w-5 h-5" />
                  <span>Download</span>
                </button>
              )}
              {/* Show Buy button if not purchased and paid product */}
              {design.price && design.price > 0 && !hasPurchased && (
                <button
                  onClick={handlePurchase}
                  className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>{`Buy for $${design.price}`}</span>
                </button>
              )}
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
        </div>
      </div>
    </div>
  );
}
