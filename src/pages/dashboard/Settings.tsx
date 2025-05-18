import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import type { Store } from '../../types';
import { AlertCircle, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

const MIN_PRICE = 0.50; // Minimum price in any currency
const SUPPORTED_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
];

interface ErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

function ErrorModal({ isOpen, onClose, message }: ErrorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-700 mb-4">{message}</p>
        <button
          onClick={onClose}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Settings() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '' });

  useEffect(() => {
    async function fetchStore() {
      if (!user) return;

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setStore(data);
        setName(data.name);
        setDescription(data.description || '');
        setAvatarUrl(data.avatar_url || '');
        setCurrency(data.currency || 'USD');
      }
    }

    fetchStore();
  }, [user]);

  const validatePrice = (price: number, currencyCode: string): boolean => {
    // Convert price to USD for minimum validation
    const exchangeRates: { [key: string]: number } = {
      USD: 1,
      EUR: 1.08,
      GBP: 1.27,
      CAD: 0.74,
      AUD: 0.66,
    };

    const priceInUSD = price * (exchangeRates[currencyCode] || 1);
    return priceInUSD >= MIN_PRICE;
  };

  const handleCurrencyChange = async (newCurrency: string) => {
    if (!store) return;

    // Check if there are any active designs with prices
    const { data: designs } = await supabase
      .from('designs')
      .select('price, currency')
      .eq('store_id', store.id)
      .not('price', 'is', null);

    if (designs && designs.length > 0) {
      // Validate all prices with new currency
      const invalidPrices = designs.filter(design => !validatePrice(design.price, newCurrency));
      
      if (invalidPrices.length > 0) {
        setErrorModal({
          isOpen: true,
          message: `Some of your designs have prices that would be too low in ${newCurrency}. Please update their prices before changing currency.`
        });
        return;
      }
    }

    setCurrency(newCurrency);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setMessage('');

    try {
      if (store) {
        // Update existing store, including currency
        const updatePayload: { name: string; description: string; avatar_url: string; updated_at: string; currency: string } = { name, description, avatar_url: avatarUrl, updated_at: new Date().toISOString(), currency };

        const { error } = await supabase
          .from('stores')
          .update(updatePayload)
          .eq('id', store.id);

        if (error) throw error;
      } else {
        // Create new store
        const { error } = await supabase
          .from('stores')
          .insert({
            name,
            description,
            avatar_url: avatarUrl,
            currency,
            user_id: user.id,
          });

        if (error) throw error;
      }

      setMessage('Store settings saved successfully!');
      toast.success('Store settings updated');
    } catch (error) {
      console.error('Error saving store settings:', error);
      setMessage('Failed to save store settings. Please try again.');
      toast.error('Failed to save store settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Store Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {message && (
            <div className={`p-4 rounded-md ${message.includes('Failed') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
              {message}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Store Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Store Avatar URL
            </label>
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="https://example.com/avatar.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Default Currency
            </label>
            <select
              value={currency}
              onChange={(e) => handleCurrencyChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {SUPPORTED_CURRENCIES.map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) - {curr.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500">
              Minimum price in {currency} is {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol}{MIN_PRICE}
            </p>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        onClose={() => setErrorModal({ isOpen: false, message: '' })}
        message={errorModal.message}
      />
    </div>
  );
}