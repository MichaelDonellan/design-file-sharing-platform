import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Heart, DollarSign, ShoppingBag, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Design as Listing } from '../../types';

// Extend the Listing type to include total_revenue for internal use
type ListingWithRevenue = Listing & {
  total_revenue?: number;
};



export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingWithRevenue[]>([]);
  const [favorites, setFavorites] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  // --- Realtime subscription for views across all listings ---
  useEffect(() => {
    if (!user) return;
    // Only subscribe if Supabase client supports channel API
    // @ts-ignore
    if (!supabase.channel) return;
    // Subscribe to all 'designs' updates for this user
    const channel = supabase.channel(`seller_dashboard:designs:${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'designs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload: any) => {
          // Update the relevant listing in state
          if (payload.new && payload.new.id) {
            setListings((prev) => {
              if (!prev) return prev;
              return prev.map((listing) =>
                listing.id === payload.new.id
                  ? { ...listing, views: payload.new.views }
                  : listing
              );
            });
            // Update total views
            setTotalViews((prevTotal) => {
              // Recalculate from all listings if possible
              return listings
                ? listings.reduce(
                    (sum, listing) =>
                      sum +
                      (listing.id === payload.new.id
                        ? payload.new.views || 0
                        : listing.views || 0),
                    0
                  )
                : prevTotal;
            });
          }
        }
      )
      .subscribe();
    return () => {
      channel.unsubscribe && channel.unsubscribe();
    };
  }, [user, listings]);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<ListingWithRevenue[]>([]);
  const [favorites, setFavorites] = useState<number>(0);
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalViews, setTotalViews] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    checkStoreStatus();
  }, [user]);

  const checkStoreStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) {
        console.error('Error checking store status:', error);
        setHasStore(false);
        return;
      }

      if (!data) {
        setHasStore(false);
        return;
      }

      setHasStore(true);
    } catch (error) {
      console.error('Error checking store status:', error);
      setHasStore(false);
    }
  };

  useEffect(() => {
    if (!user || !hasStore) return;

    fetchSellerData();
  }, [user, hasStore]);

  const fetchSellerData = async () => {
    try {
      setLoading(true);

      // Fetch designs
      const { data: listingsData, error: listingsError } = await supabase
        .from('designs')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (listingsError) {
        console.error('Error fetching seller data:', listingsError);
        toast.error('Failed to load seller data');
        return;
      }

      if (!listingsData) {
        setListings([]);
        setFavorites(0);
        setTotalRevenue(0);
        setTotalViews(0);
        return;
      }

      // Fetch total revenue for each listing
      const listingIds = listingsData.map((listing: Listing) => listing.id);
      const { data: purchaseData, error: purchaseError } = await supabase
        .from('purchases')
        .select('design_id, amount')
        .in('design_id', listingIds)
        .eq('status', 'completed');

      if (purchaseError) {
        console.error('Error fetching purchase data:', purchaseError);
        toast.error('Failed to fetch purchase data');
        return;
      }

      // Calculate total revenue for each listing
      const revenueByListing = purchaseData.reduce((acc: Record<string, number>, purchase: { design_id: string, amount: number }) => {
        if (!acc[purchase.design_id]) {
          acc[purchase.design_id] = 0;
        }
        acc[purchase.design_id] += purchase.amount || 0;
        return acc;
      }, {} as Record<string, number>);

      // Update listings with their total revenue
      const listingsWithRevenue = listingsData.map((listing: Listing) => ({
        ...listing,
        total_revenue: revenueByListing[listing.id] || 0
      }));

      // Calculate totals
      const totalFavorites = listingsWithRevenue.reduce((sum: number, listing: ListingWithRevenue) => sum + (listing.average_rating || 0), 0);
      const totalRevenue = listingsWithRevenue.reduce((sum: number, listing: ListingWithRevenue) => sum + (listing.total_revenue || 0), 0);
      const totalViews = listingsWithRevenue.reduce((sum: number, listing: ListingWithRevenue) => sum + (listing.views || 0), 0);

      setListings(listingsWithRevenue);
      setFavorites(totalFavorites);
      setTotalRevenue(totalRevenue);
      setTotalViews(totalViews);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast.error('Failed to load seller data');
      setListings([]);
      setFavorites(0);
      setTotalRevenue(0);
      setTotalViews(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId: string) => {
    if (!listingId) {
      toast.error('Invalid design ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    try {
      // First, get all associated files
      const { data: files, error: filesError } = await supabase
        .from('design_files')
        .select('*')
        .eq('design_id', listingId);

      if (filesError) {
        console.error('Error fetching files:', filesError);
        toast.error('Failed to fetch associated files');
        return;
      }

      // Delete files from storage
      if (files && files.length > 0) {
        const fileResponses = await Promise.all(
          files.map(async (file: { file_path: string }) => {
            // Delete file from storage
            const { error: storageError } = await supabase.storage
              .from('designs')
              .remove([file.file_path]);
            if (storageError) {
              console.error('Error deleting file from storage:', storageError);
            }
            return storageError;
          })
        );
      }

      // Delete files from design_files table
      const { error: designFilesError } = await supabase
        .from('design_files')
        .delete()
        .eq('design_id', listingId);

      if (designFilesError) {
        console.error('Error deleting design files:', designFilesError);
        toast.error('Failed to delete design files from database');
        return;
      }

      // Delete mockups from storage
      const { data: mockups, error: mockupsError } = await supabase
        .from('design_mockups')
        .select('*')
        .eq('design_id', listingId);

      if (mockupsError) {
        console.error('Error fetching mockups:', mockupsError);
        toast.error('Failed to fetch associated mockups');
        return;
      }

      if (mockups && mockups.length > 0) {
        const mockupPaths = mockups.map(mockup => mockup.path);
        const { error: mockupStorageError } = await supabase.storage
          .from('designs')
          .remove(mockupPaths);

        if (mockupStorageError) {
          console.error('Error deleting mockup files:', mockupStorageError);
          toast.error('Failed to delete mockup files');
          return;
        }

        // Delete mockups from database
        const { error: mockupDbError } = await supabase
          .from('design_mockups')
          .delete()
          .eq('design_id', listingId);

        if (mockupDbError) {
          console.error('Error deleting mockups:', mockupDbError);
          toast.error('Failed to delete mockups from database');
          return;
        }
      }

      // Delete the design
      const { error } = await supabase
        .from('designs')
        .delete()
        .eq('id', listingId);

      if (error) {
        console.error('Error deleting design:', error);
        toast.error(error.message || 'Failed to delete design');
        return;
      }

      toast.success('Design deleted successfully');
      await fetchSellerData();
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Seller Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <Eye className="text-blue-500 w-6 h-6" />
              <h3 className="text-sm font-medium text-gray-500">Total Views</h3>
              <p className="text-2xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <Heart className="text-red-500 w-6 h-6" />
              <h3 className="text-sm font-medium text-gray-500">Favorites</h3>
              <p className="text-2xl font-bold text-gray-900">{favorites}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <DollarSign className="text-green-500 w-6 h-6" />
              <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow">
          <div className="flex items-center justify-between">
            <div>
              <ShoppingBag className="text-purple-500 w-6 h-6" />
              <h3 className="text-sm font-medium text-gray-500">Listings</h3>
              <p className="text-2xl font-bold text-gray-900">{listings.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Your Designs</h2>
            <button
              onClick={() => navigate('/dashboard/store')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 mr-2"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Design
            </button>
            <button
              onClick={() => navigate('/dashboard/settings')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings mr-2"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
              <span>Settings</span>
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rating
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {listings.map((listing) => (
                <tr key={listing.id} className="border-b">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{listing.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{listing.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(listing.views || 0).toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(listing.average_rating || 0).toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${(listing.price || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${(listing.total_revenue || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => navigate(`/dashboard/edit/${listing.id}`)}
                      className="text-blue-600 hover:text-blue-900 mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteListing(listing.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
