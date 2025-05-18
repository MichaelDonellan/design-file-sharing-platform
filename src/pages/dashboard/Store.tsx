import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Design, Store as StoreType } from '../../types';

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

export default function Store() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');

  useEffect(() => {
    async function fetchStoreAndDesigns() {
      if (!user) return;

      // Fetch store data
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStore(storeData);

      if (storeData) {
        // Fetch designs for this store
        const { data: designsData } = await supabase
          .from('designs')
          .select('*')
          .eq('store_id', storeData.id)
          .order('created_at', { ascending: false });

        if (designsData) {
          setDesigns(designsData);
        }
      }

      setLoading(false);
    }

    fetchStoreAndDesigns();
  }, [user]);

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
        <div className="text-gray-600">Loading store...</div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">You haven't created a store yet</h2>
          <p className="text-gray-600 mb-6">
            Create a store to start selling your designs
          </p>
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Create Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex justify-end">
        <select
          value={currency}
          onChange={e => {
            setCurrency(e.target.value);
            localStorage.setItem('preferredCurrency', e.target.value);
          }}
          className="border border-gray-300 rounded px-3 py-1 text-sm"
        >
          {SUPPORTED_CURRENCIES.map(c => (
            <option key={c.code} value={c.code}>{c.code} ({c.symbol})</option>
          ))}
        </select>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate max-w-xs sm:max-w-md md:max-w-lg lg:max-w-xl">{store.name}</h1>
            {store.description && (
              <p className="text-gray-600 mt-2">{store.description}</p>
            )}
          </div>
          <Link
            to="/dashboard/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Edit Store
          </Link>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 mb-4">No designs in your store yet</p>
            <Link
              to="/upload"
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              Upload a Design
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Link
                key={design.id}
                to={`/design/${design.id}`}
                className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img
                  src={design.mockup_path}
                  alt={design.name}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 truncate max-w-full">{design.name}</h3>
                  <div className="mt-2 flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center">
                      <Calendar size={16} className="mr-1" />
                      {format(new Date(design.created_at), 'MMM d, yyyy')}
                    </div>
                    <div className="flex items-center">
                      <Download size={16} className="mr-1" />
                      {design.downloads}
                    </div>
                  </div>
                  <div className="mt-2">
                    {design.price && design.price > 0 ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">
                        {getCurrencySymbol(currency)}{convertPrice(design.price, currency).toFixed(2)}
                      </span>
                    ) : (
                      <span className="inline-block bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded">Free</span>
                    )}
                  </div>
                  {design.tags && design.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {design.tags.map((tag) => (
                        <span key={tag} className="inline-block bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}