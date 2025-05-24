import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Store as StoreIcon, AlertCircle } from 'lucide-react';

export default function Store() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [storeExists, setStoreExists] = useState<boolean | null>(null);

  // Form state
  const [storeName, setStoreName] = useState('');
  const [description, setDescription] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string>('');
  const [storeUrl, setStoreUrl] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [payoutMethod, setPayoutMethod] = useState('bank');
  const [bankDetails, setBankDetails] = useState({
    accountName: '',
    accountNumber: '',
    bankName: '',
    routingNumber: '',
  });
  const [paypalEmail, setPaypalEmail] = useState('');

  useEffect(() => {
    // Check if user already has a store
    async function checkStore() {
      if (!user) return;
      const { data } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', user.id)
        .single();
      setStoreExists(!!data);
    }
    checkStore();
  }, [user]);

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(res => res.json())
      .then(data => {
        const countryToCurrency: Record<string, string> = {
          US: 'USD', GB: 'GBP', AU: 'AUD', CA: 'CAD', EU: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR', IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR',
        };
        if (data.country && countryToCurrency[data.country]) {
          setCurrency(countryToCurrency[data.country]);
        }
      })
      .catch(() => {});
  }, []);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfileImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError('');

      // Upload avatar if selected
      let avatarUrl = null;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('store-avatars')
          .upload(fileName, avatarFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('store-avatars')
          .getPublicUrl(fileName);
        avatarUrl = publicUrl;
      }

      // Upload profile image if selected
      let profileImageUrl = null;
      if (profileImageFile) {
        const fileExt = profileImageFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('store-profiles')
          .upload(fileName, profileImageFile);
        if (uploadError) throw uploadError;
        const { data: { publicUrl } } = supabase.storage
          .from('store-profiles')
          .getPublicUrl(fileName);
        profileImageUrl = publicUrl;
      }

      // Create store
      const { error: storeError } = await supabase
        .from('stores')
        .insert({
          name: storeName,
          description,
          avatar_url: avatarUrl,
          profile_image_url: profileImageUrl,
          store_url: storeUrl,
          currency,
          payout_method: payoutMethod,
          bank_details: payoutMethod === 'bank' ? bankDetails : null,
          paypal_email: payoutMethod === 'paypal' ? paypalEmail : null,
          user_id: user.id,
        });

      if (storeError) throw storeError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard/seller');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to create store. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (storeExists === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Checking store status...</div>
      </div>
    );
  }
  if (storeExists) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">You already have a store</h2>
          <button
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            onClick={() => navigate('/dashboard/seller')}
          >
            Go to Seller Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Create Your Store</h1>
        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-green-100 text-green-700 rounded flex items-center">
            <StoreIcon className="w-5 h-5 mr-2" />
            <span>Store created successfully! Redirecting...</span>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
            <input
              type="text"
              id="storeName"
              value={storeName}
              onChange={e => setStoreName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Store Avatar</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="w-full"
              />
              {avatarPreview && (
                <img src={avatarPreview} alt="Avatar Preview" className="mt-2 w-24 h-24 rounded-full object-cover border" />
              )}
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Profile Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
                className="w-full"
              />
              {profileImagePreview && (
                <img src={profileImagePreview} alt="Profile Preview" className="mt-2 w-24 h-24 rounded-full object-cover border" />
              )}
            </div>
          </div>
          <div>
            <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700 mb-1">Store URL</label>
            <input
              type="text"
              id="storeUrl"
              value={storeUrl}
              onChange={e => setStoreUrl(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="your-store-url"
            />
          </div>
          <div>
            <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">Default Currency</label>
            <select
              id="currency"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="GBP">GBP (£)</option>
              <option value="CAD">CAD (C$)</option>
              <option value="AUD">AUD (A$)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payout Method</label>
            <div className="flex items-center gap-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bank"
                  checked={payoutMethod === 'bank'}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="mr-2"
                />
                <span>Bank Transfer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="paypal"
                  checked={payoutMethod === 'paypal'}
                  onChange={e => setPayoutMethod(e.target.value)}
                  className="mr-2"
                />
                <span>PayPal</span>
              </label>
            </div>
          </div>
          {payoutMethod === 'bank' && (
            <div className="space-y-4 p-4 bg-gray-50 rounded-md">
              <div>
                <label htmlFor="accountName" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Holder Name
                </label>
                <input
                  type="text"
                  id="accountName"
                  value={bankDetails.accountName}
                  onChange={e => setBankDetails({ ...bankDetails, accountName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  type="text"
                  id="accountNumber"
                  value={bankDetails.accountNumber}
                  onChange={e => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  type="text"
                  id="bankName"
                  value={bankDetails.bankName}
                  onChange={e => setBankDetails({ ...bankDetails, bankName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Routing Number
                </label>
                <input
                  type="text"
                  id="routingNumber"
                  value={bankDetails.routingNumber}
                  onChange={e => setBankDetails({ ...bankDetails, routingNumber: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          {payoutMethod === 'paypal' && (
            <div>
              <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700 mb-1">
                PayPal Email
              </label>
              <input
                type="email"
                id="paypalEmail"
                value={paypalEmail}
                onChange={e => setPaypalEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your@email.com"
              />
            </div>
          )}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Store...' : 'Create Store'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}