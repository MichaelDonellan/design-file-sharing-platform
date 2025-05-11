import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Design, Store as StoreType } from '../../types';

export default function Store() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

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
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">{store.name}</h1>
            {store.description && (
              <p className="text-gray-600 mt-2">{store.description}</p>
            )}
          </div>
          <Link
            to="/dashboard/settings"
            className="text-sm text-blue-600 hover:text-blue-800"
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
                  <h3 className="font-semibold text-gray-900">{design.name}</h3>
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
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}