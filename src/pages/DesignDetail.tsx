import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design, Store, Review, DesignMockup, DesignFile } from '../types';
import { Download, Calendar, Tag, Store as StoreIcon, Star, ShoppingCart } from 'lucide-react';
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
  const [design, setDesign] = useState<Design | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [mockups, setMockups] = useState<DesignMockup[]>([]);
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedDesigns, setRelatedDesigns] = useState<Design[]>([]);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const { data: designData, error: designError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (designError) {
        console.error('Error fetching design:', designError);
        setLoading(false);
        return;
      }

      setDesign(designData);

      // Fetch store data
      if (designData.store_id) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', designData.store_id)
          .single();

        setStore(storeData);

        // Fetch related designs from the same store
        const { data: relatedData } = await supabase
          .from('designs')
          .select('*')
          .eq('store_id', designData.store_id)
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

      setLoading(false);
    }

    fetchData();
  }, [id]);

  useEffect(() => {
    async function fetchUser() {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData.user);
    }

    fetchUser();
  }, []);

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

  const handleDownload = async () => {
    if (!design) return;
    if (!user) {
      // Redirect to signup page if not logged in
      window.location.href = '/signup';
      return;
    }

    try {
      setLoading(true);
      
      // If it's a freebie, just download
      if (design.is_freebie) {
        const { data: files, error: filesError } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', design.id)
          .order('display_order');

        if (filesError) {
          throw new Error('Failed to fetch design files');
        }

        if (!files || files.length === 0) {
          throw new Error('No files found for this design');
        }

        // Get the file path from the database
        const filePath = files[0].file_path;
        console.log('Downloading file with path:', filePath);

        // Download the file directly using the file path
        const { data: fileData, error: downloadError } = await supabase.storage
          .from('designs')
          .download(filePath);

        if (downloadError) {
          console.error('Storage error:', downloadError);
          throw new Error('Failed to download file. Please try again later.');
        }

        if (!fileData) {
          throw new Error('No file data received');
        }

        const url = URL.createObjectURL(fileData);
        const a = document.createElement('a');
        a.href = url;
        a.download = filePath.split('/').pop() || 'design';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Update download count
        await supabase
          .from('designs')
          .update({ downloads: (design.downloads || 0) + 1 })
          .eq('id', design.id);
      } else {
        // For paid products, redirect to checkout
        setStripeLoading(true);
        console.log('Creating checkout session for design:', design.id);
        
        const { data: session, error: sessionError } = await supabase.functions.invoke('create-checkout-session', {
          body: { designId: design.id }
        });
        
        console.log('Checkout session response:', { session, sessionError });
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Failed to create checkout session: ' + sessionError.message);
          return;
        }
        
        if (!session) {
          console.error('No session data received');
          toast.error('No session data received from server');
          return;
        }
        
        console.log("Stripe session object:", session);
        let parsedSession = session;
        if (typeof session === "string") {
          try {
            parsedSession = JSON.parse(session);
          } catch (e) {
            console.error("Failed to parse session string:", session);
            toast.error("Failed to parse server response.");
            return;
          }
        }

        const checkoutUrl =
          parsedSession?.url ||
          (parsedSession?.data && parsedSession.data.url);

        console.log("checkoutUrl:", checkoutUrl, "type:", typeof checkoutUrl);

        if (checkoutUrl) {
          console.log('Redirecting to:', checkoutUrl);
          window.location.href = checkoutUrl;
        } else {
          console.error('No valid checkout URL in session:', parsedSession);
          toast.error('No valid checkout URL received from server');
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to process your request');
    } finally {
      setLoading(false);
      setStripeLoading(false);
    }
  };

  const getCurrencySymbol = (currency: string) => {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return found ? found.symbol : '$';
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

  if (!design || mockups.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Design not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
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

          {/* Buy/Download button - require login */}
          <div className="mt-6">
            {user ? (
              design.price && design.price > 0 ? (
                <button
                  onClick={handleDownload}
                  disabled={stripeLoading}
                  className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {stripeLoading ? 'Processing...' : 'Buy Now'}
                </button>
              ) : (
                <button
                  onClick={handleDownload}
                  className="w-full bg-green-600 text-white py-3 rounded-md font-semibold hover:bg-green-700 transition-colors"
                >
                  Download
                </button>
              )
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-md font-semibold hover:bg-blue-700 transition-colors"
              >
                {design.price && design.price > 0 ? 'Buy Now' : 'Download'}
              </button>
            )}
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