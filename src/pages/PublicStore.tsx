import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import type { Design, Store } from '../types';

export default function PublicStore() {
  const { storeName } = useParams<{ storeName: string }>();
  const [store, setStore] = useState<Store | null>(null);
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStoreAndDesigns() {
      if (!storeName) return;

      // Fetch store data
      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('name', storeName)
        .single();

      if (storeData) {
        setStore(storeData);

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
  }, [storeName]);

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
          <h2 className="text-xl font-semibold">Store not found</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <div className="flex items-center space-x-4">
            {store.avatar_url && (
              <img
                src={store.avatar_url}
                alt={store.name}
                className="w-16 h-16 rounded-full object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{store.name}</h1>
              {store.description && (
                <p className="text-gray-600 mt-2">{store.description}</p>
              )}
            </div>
          </div>
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No designs available in this store</p>
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
                  <div className="mt-2">
                    {design.price && design.price > 0 ? (
                      <span className="inline-block bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded">{design.currency || 'USD'} {design.price.toFixed(2)}</span>
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