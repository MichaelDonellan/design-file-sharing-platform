import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import type { Design, Store, Review, DesignMockup, DesignFile } from '../types';
import { Download, Calendar, Tag, Store as StoreIcon, Star, ShoppingCart, Heart, Share2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import ImageCarousel from '../components/ImageCarousel';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';
import { toast } from 'react-hot-toast';

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
  const [stripeLoading, setStripeLoading] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [isFavorited, setIsFavorited] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

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
  const handlePurchase = () => {
    alert('Purchase functionality coming soon!');
  };

 
  useEffect(() => {
    if (id) {
      fetchDesign();
      incrementView();
    }
  }, [id]);

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
        const { data: mockupsData } = await supabase
          .from('design_mockups')
          .select('*')
          .eq('design_id', id)
          .order('display_order');

        if (mockupsData) {
          setMockups(mockupsData);
        }

        // Fetch files
        const { data: filesData } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', id)
          .order('display_order');

        if (filesData) {
          setFiles(filesData);
        }

        // Fetch reviews - Modified query to not use foreign key relationship
        const { data: reviewsData } = await supabase
          .from('reviews')
          .select('*')
          .eq('design_id', id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          // Fetch user data separately for each review
          const reviewsWithUsers = await Promise.all(
            reviewsData.map(async (review) => {
              const { data: userData } = await supabase
                .from('auth.users')
                .select('id, email')
                .eq('id', review.user_id)
                .single();
              
              return {
                ...review,
                user: userData
              };
            })
          );
          
          setReviews(reviewsWithUsers);
        }
      }
    } catch (err) {
      console.error('Error fetching design:', err);
      setError('Failed to load design');
    } finally {
      setLoading(false);
    }
  };

  const incrementView = async () => {
    try {
      const { error } = await supabase.rpc('increment_design_views', {
        design_id: id
      });
      if (error) throw error;
    } catch (err) {
      console.error('Error incrementing view:', err);
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('preferredCurrency');
    if (stored && EXCHANGE_RATES[stored]) {
      setCurrency(stored);
      return;
    }
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const countryToCurrency: Record<string, string> = {
          US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD', EU: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
        };
        if (data.country && countryToCurrency[data.country] && EXCHANGE_RATES[countryToCurrency[data.country]]) {
          setCurrency(countryToCurrency[data.country]);
          localStorage.setItem('preferredCurrency', countryToCurrency[data.country]);
        }
      })
      .catch(() => {});
  }, []);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      setIsProcessing(true);
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('design_favorites')
          .delete()
          .eq('design_id', id)
          .eq('user_id', user.id);

        if (error) throw error;
        setIsFavorited(false);
      } else {
        // Add to favorites
        const { error } = await supabase
          .from('design_favorites')
          .insert({
            design_id: id,
            user_id: user.id
          });

        if (error) throw error;
        setIsFavorited(true);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Failed to update favorite status');
    } finally {

const handleDownload = async () => {
if (!design || !files.length) {
console.warn('Download aborted: missing design or files', { design, files });
alert('No design or files available for download.');
return;
}

// Always require login before download/purchase
if (!user) {
console.warn('Download aborted: user not logged in');
navigate('/login');
return;
}

if (design.price && user) {
// Handle purchase/download logic here
alert('Purchase functionality coming soon!');
return;
}

// For free designs, proceed with download
try {
// Get the first file from the files array
const mainFile = files[0];
if (!mainFile?.file_path) {
console.error('No file path available in mainFile:', mainFile);
alert('No file path available for this design.');
return;
}

// Extract the filename from the file path
const filePath = mainFile.file_path;
const fileName = filePath.split('/').pop() || design.name;

// Debug logs
console.log('Download attempt:', { filePath, user, files, design });

// Check if file exists in storage before download
const pathParts = filePath.split('/');
const fileParent = pathParts.slice(0, -1).join('/');
const fileBase = pathParts[pathParts.length - 1];
console.log('Checking existence in bucket:', { fileParent, fileBase });
const { data: listData, error: listError } = await supabase.storage.from('designs').list(fileParent || undefined);
if (listError) {
console.error('Error listing files in storage:', listError);
} else {
const found = listData && listData.some(f => f.name === fileBase);
console.log('File existence check:', found, listData);
if (!found) {
alert('File does not exist in storage. Please contact support.');
return;
}
}

// Download the file
const { data, error } = await supabase.storage
.from('designs')
.download(filePath);

if (error) {
console.error('Supabase download error:', error, { filePath });
alert(`Failed to download design: ${error.message || error.error || JSON.stringify(error)}`);
return;
}

// Create a download link and trigger it
const url = URL.createObjectURL(data);
const link = document.createElement('a');
link.href = url;
link.download = fileName;
document.body.appendChild(link);
link.click();
document.body.removeChild(link);
URL.revokeObjectURL(url);

// Increment download count
const { error: updateError } = await supabase
.from('designs')
.update({ downloads: (design.downloads || 0) + 1 })
.eq('id', design.id);

if (updateError) {
console.error('Error updating download count:', updateError);
}
} catch (err) {
console.error('Error downloading design:', err);
alert(`Failed to download design: ${err && err.message ? err.message : JSON.stringify(err)}`);
}
};
  };

  const convertPrice = (usd: number, to: string) => {
    if (!EXCHANGE_RATES[to]) return usd;
    return Math.round((usd * EXCHANGE_RATES[to]) * 100) / 100;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading design...</div>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">
          <img
            src={design.thumbnail_url || '/placeholder.png'}
            alt={design.name}
            className="w-full h-96 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
            <h1 className="text-3xl font-bold text-white mb-2">{design.name}</h1>
            <div className="flex items-center space-x-4 text-white">
              <div className="flex items-center">
                <Eye className="w-5 h-5 mr-1" />
                <span>{design.views || 0} views</span>
              </div>
              <div className="flex items-center">
                <Heart className="w-5 h-5 mr-1" />
                <span>{design.favorites || 0} favorites</span>
              </div>
              <div className="flex items-center">
                <Download className="w-5 h-5 mr-1" />
                <span>{design.downloads || 0} downloads</span>
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
            <ImageCarousel mockups={mockups} />
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
    <span>{design.price ? 'Download' : 'Download'}</span>
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
) }
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
              {reviews.length > 0 ? (
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

export default DesignDetail;