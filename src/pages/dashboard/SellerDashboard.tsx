import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-toastify';
import { Heart, DollarSign, ShoppingBag, Eye, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  preview_image: string;
  files: string[];
  status: string;
  favorites: number;
  sales: number;
  views: number;
}

interface Store {
  id: string;
  name: string;
  description: string;
  status: string;
}

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
    if (!user) return;

    checkStoreStatus();
  }, [user]);

  const checkStoreStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
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

      // Fetch listings with view counts
      const { data: listingsData, error: listingsError } = await supabase
        .from('listings')
        .select('*')
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (listingsError) throw listingsError;

      // Calculate totals
      const totalFavorites = listingsData.reduce((sum, listing) => sum + listing.favorites, 0);
      const totalRevenue = listingsData.reduce((sum, listing) => sum + listing.price * listing.sales, 0);
      const totalViews = listingsData.reduce((sum, listing) => sum + listing.views, 0);

      setListings(listingsData);
      setFavorites(totalFavorites);
      setTotalRevenue(totalRevenue);
      setTotalViews(totalViews);
    } catch (error) {
      console.error('Error fetching seller data:', error);
      toast.error('Failed to load seller data');
    } finally {
      setLoading(false);
    }
  };

  const handleEditListing = (listingId: string) => {
    // TODO: Implement edit listing functionality
    toast.info('Edit listing feature coming soon');
  };

  const handleDeleteListing = async (listingId: string) => {
    try {
      const { error } = await supabase
        .from('listings')
        .delete()
        .eq('id', listingId);

      if (error) throw error;

      toast.success('Listing deleted successfully');
      await fetchSellerData();
    } catch (error) {
      console.error('Error deleting listing:', error);
      toast.error('Failed to delete listing');
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
            <h2 className="text-lg font-medium text-gray-900">Your Listings</h2>
            <button
              onClick={() => navigate('/dashboard/store')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add New Listing
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Favorites
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sales
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
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
                    <div className="text-sm font-medium text-gray-900">{listing.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">{listing.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.views.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.favorites}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{listing.sales}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${(listing.price * listing.sales).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      listing.status === 'active' ? 'bg-green-100 text-green-800' :
                      listing.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {listing.status}
                    </span>
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
