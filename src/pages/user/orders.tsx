import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { format } from 'date-fns';

// Define the Design interface
interface Design {
  id: string;
  name: string;
  description: string | null;
  file_type: string;
  category: string;
  price: number | null;
  currency: string;
  average_rating: number | null;
}

// Define the Purchase interface
interface Purchase {
  id: string;
  created_at: string;
  design_id: string;
  design: Design;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed';
  design_files?: Array<{
    id: string;
    file_path: string;
    file_type: string;
  }>;
}

const UserOrders: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchases = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setError('User not authenticated');
          setLoading(false);
          return;
        }

        // First, fetch the purchases data without the is_free_download column
        const { data: purchasesData, error: purchasesError } = await supabase
          .from('purchases')
          .select(`
            id,
            created_at,
            design_id,
            amount,
            currency,
            status,
            designs:designs(
              id,
              name,
              description,
              file_type,
              category,
              price,
              currency,
              average_rating
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (purchasesError) throw purchasesError;

        // Transform purchases and include free download info
        const transformedPurchases = await Promise.all(
          (purchasesData || []).map(async (purchase: any) => {
            const { data: files } = await supabase
              .from('design_files')
              .select('id, file_path, file_type')
              .eq('design_id', purchase.design_id)
              .order('display_order', { ascending: true })
              .limit(1);

            // Check if this was a free download based on price
            const isFree = purchase.designs?.price === 0 || purchase.designs?.price === null || purchase.amount === 0;

            return {
              ...purchase,
              design: {
                ...purchase.designs,
                is_free_download: isFree
              },
              design_id: purchase.design_id,
              design_files: files || [],
              is_free: isFree
            };
          })
        );

        setPurchases(transformedPurchases);
      } catch (err) {
        console.error('Error fetching purchases:', err);
        setError('Failed to load your orders');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  const formatPrice = (amount: number | null, currency: string) => {
    if (amount === null) return 'Free';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(amount / 100);
  };

  const getPreviewImage = (purchase: Purchase): string => {
    // First try to get from design_files
    const previewFile = purchase.design_files?.[0]?.file_path;
    if (previewFile) return previewFile;
    
    // Fallback to a placeholder based on file type
    switch(purchase.design?.file_type) {
      case 'font':
        return '/placeholder-font.png';
      case 'template':
        return '/placeholder-template.png';
      default:
        return '/placeholder-image.png';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>
      
      {error ? (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600 mb-4">You haven't made any purchases yet.</p>
          <button 
            onClick={() => window.location.href = '/marketplace'}
            className="inline-block bg-primary text-white px-6 py-2 rounded hover:bg-primary-dark transition-colors"
          >
            Browse Marketplace
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="relative h-10 w-10 rounded overflow-hidden">
                          <img
                            src={getPreviewImage(purchase)}
                            alt={purchase.design?.name || 'Design preview'}
                            className="w-full h-full object-cover"
                            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                              const target = e.target as HTMLImageElement;
                              target.src = '/placeholder-image.png';
                            }}
                          />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {purchase.design?.name || 'Unknown Design'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {purchase.design?.category || 'Design'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(purchase.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatPrice(purchase.amount, purchase.design?.currency || 'USD')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      purchase.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : purchase.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {purchase.status.charAt(0).toUpperCase() + purchase.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button 
                      onClick={() => window.location.href = `/designs/${purchase.design_id}`}
                      className="text-primary hover:text-primary-dark mr-4"
                    >
                      View
                    </button>
                    <button 
                      onClick={() => window.location.href = `/downloads/${purchase.design_id}`}
                      className="text-primary hover:text-primary-dark"
                    >
                      Download
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default UserOrders;
