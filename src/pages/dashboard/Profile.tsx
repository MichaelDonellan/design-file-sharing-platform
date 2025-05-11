import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { Store } from 'lucide-react';
import type { Store as StoreType } from '../../types';

export default function Profile() {
  const { user } = useAuth();
  const [store, setStore] = useState<StoreType | null>(null);

  useEffect(() => {
    async function fetchStore() {
      if (!user) return;

      const { data } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setStore(data);
    }

    fetchStore();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6">Profile</h1>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user?.email}</div>
          </div>

          {store && (
            <div className="mt-6">
              <h2 className="text-lg font-semibold mb-2">Your Store</h2>
              <Link
                to={`/store/${store.name}`}
                className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800"
              >
                <Store size={20} />
                <span>{store.name}</span>
              </Link>
            </div>
          )}

          {!store && (
            <div className="mt-6">
              <Link
                to="/dashboard/store"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
              >
                <Store size={20} className="mr-2" />
                Create Store
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}