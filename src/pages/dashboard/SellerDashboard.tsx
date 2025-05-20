import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Heart, DollarSign, ShoppingBag, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Design as Listing } from '../../types';



export default function SellerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState<Listing[]>([]);
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
      const listingIds = listingsData.map(listing => listing.id);
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
      const revenueByListing = purchaseData.reduce((acc, purchase) => {
        if (!acc[purchase.design_id]) {
          acc[purchase.design_id] = 0;
        }
        acc[purchase.design_id] += purchase.amount || 0;
        return acc;
      }, {} as Record<string, number>);

      // Update listings with their total revenue
      const listingsWithRevenue = listingsData.map(listing => ({
        ...listing,
        total_revenue: revenueByListing[listing.id] || 0
      }));

      // Calculate totals
      const totalFavorites = listingsWithRevenue.reduce((sum, listing) => sum + (listing.average_rating || 0), 0);
      const totalRevenue = listingsWithRevenue.reduce((sum, listing) => sum + (listing.total_revenue || 0), 0);
      const totalViews = listingsWithRevenue.reduce((sum, listing) => sum + (listing.downloads || 0), 0);

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

  const handleEditListing = (listingId: string) => {
    // TODO: Implement edit listing functionality
    toast.info('Edit listing feature coming soon');
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
        const storagePaths = files.map(file => file.path);
        const { error: storageError } = await supabase.storage
          .from('designs')
          .remove(storagePaths);

        if (storageError) {
          console.error('Error deleting storage files:', storageError);
          toast.error('Failed to delete design files');
          return;
        }
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
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Design
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
                  Downloads
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
                    <div className="text-sm text-gray-900">{listing.downloads.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{(listing.average_rating || 0).toFixed(1)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${(listing.price || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${((listing.price || 0) * (listing.downloads || 0)).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEditListing(listing.id)}
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
