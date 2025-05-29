import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design, CategoryFilter } from '../types';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import CategorySidebar from '../components/CategorySidebar';
import SearchBar from '../components/SearchBar';
import HeroBanner from '../components/HeroBanner';

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

export default function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>({ main: 'all' });
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [currency, setCurrency] = useState('USD');
  const [designMockups, setDesignMockups] = useState<Record<string, string>>({});

  useEffect(() => {
    // Try to get preferred currency from localStorage
    const stored = localStorage.getItem('preferredCurrency');
    if (stored && EXCHANGE_RATES[stored]) {
      setCurrency(stored);
      return;
    }
    // Auto-detect via ipapi.co
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

  const getCurrencySymbol = (currency: string) => {
    const found = SUPPORTED_CURRENCIES.find(c => c.code === currency);
    return found ? found.symbol : '$';
  };

  const convertPrice = (usd: number, to: string) => {
    if (!EXCHANGE_RATES[to]) return usd;
    return Math.round((usd * EXCHANGE_RATES[to]) * 100) / 100;
  };

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    async function fetchDesigns() {
      try {
        setLoading(true);
        setError(null);

        // Check if component is still mounted before proceeding
        if (!isMounted) return;

        let query = supabase
          .from('designs')
          .select('*, stores(name)')
          .order('created_at', { ascending: false });

        if (selectedCategory.main !== 'all') {
          query = query.eq('category', selectedCategory.main);
          if (selectedCategory.sub) {
            query = query.eq('subcategory', selectedCategory.sub);
          }
        }

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
        }

        const { data: designsData, error: supabaseError } = await query;

        // Check if component is still mounted before proceeding
        if (!isMounted) return;

        if (supabaseError) {
          throw supabaseError;
        }

        if (designsData) {
          setDesigns(designsData);
          setError(null);

          // Fetch mockups for all designs
          const { data: mockupsData, error: mockupsError } = await supabase
            .from('design_mockups')
            .select('design_id, mockup_path')
            .in('design_id', designsData.map(d => d.id))
            .order('display_order');

          // Check if component is still mounted before proceeding
          if (!isMounted) return;

          if (mockupsError) {
            console.error('Error fetching mockups:', mockupsError);
          } else if (mockupsData) {
           // Create a map of design_id to first mockup path with proper Supabase Storage URL
const mockupMap = mockupsData.reduce((acc, mockup) => {
  if (!acc[mockup.design_id]) {
    // Generate a proper Supabase Storage URL
    const { data } = supabase.storage
      .from('designs')
      .getPublicUrl(mockup.mockup_path);
    
    // Store the public URL instead of just the path
    acc[mockup.design_id] = data.publicUrl;
  }
  return acc;
}, {} as Record<string, string>);
            
            setDesignMockups(mockupMap);
          }
        }
      } catch (err) {
        console.error('Error fetching designs:', err);
        if (isMounted) {
          setError('Failed to load designs. Please try again later.');
          setDesigns([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDesigns();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading designs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <HeroBanner />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Currency Selector */}
        <div className="mb-6 flex justify-end">
          <select
            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-200"
            value={currency}
            onChange={e => {
              setCurrency(e.target.value);
              localStorage.setItem('preferredCurrency', e.target.value);
            }}
          >
            {SUPPORTED_CURRENCIES.map(c => (
              <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
            ))}
          </select>
        </div>

        <div className="flex-1">
          <div className="mb-8 space-y-4">
            <h1 className="text-3xl font-bold">New Arrivals</h1>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
            />
        {designs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No designs found</p>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              <span>Upload a Design</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <div
                key={design.id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <Link to={`/design/${design.id}`}>  
                  <div className="aspect-w-16 aspect-h-16">
                    <img
                      src={designMockups[design.id] || '/placeholder.png'}
                      alt={design.name}
                      className="w-full h-64 object-cover object-center"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/placeholder.png';
                      }}
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 truncate max-w-full">{design.name}</h3>
                  </div>
                </Link>
                <div className="px-4 pb-4">
                  {/* Price badge */}
                  <div className="mt-2">
                    {design.price && design.price > 0 ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        {getCurrencySymbol(currency)}{convertPrice(design.price, currency).toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Free</span>
                    )}
                  </div>
                  {/* Tags below main info */}
                  {design.tags && design.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.tags.map((tag) => (
                        <span key={tag} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Link to={`/store/${design.store_id}`} className="text-blue-600 font-semibold hover:underline">
                        {design.stores?.name || 'Store'}
                      </Link>
                    </div>
                    <div className="flex items-center">
                      <Download size={16} className="mr-1" />
                      {design.downloads}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  </>
);
}