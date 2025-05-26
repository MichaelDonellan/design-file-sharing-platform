import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

interface Product {
  id: string;
  name: string;
  image: string;
  creator: string;
  category: string;
  is_free: boolean;
  price: number;
  favorite_id: string;
}

const FavouritesPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    const fetchFavourites = async () => {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      // Join design_favorites with designs and users
      // Fetch all favorites for this user, join with design and user profile
      const { data: favs, error } = await supabase
        .from('design_favorites')
        .select(`design_id, designs(*), designs:user_id(full_name), designs:mockups(mockup_path)`) // join to designs, user profile, and mockups
        .eq('user_id', user.id);
      if (error) {
        setLoading(false);
        return;
      }
      if (favs) {
        setProducts(
          favs.map((fav: any) => {
            const design = fav.designs;
            // Use mockup if available, else thumbnail, else placeholder
            let image = '/placeholder.png';
            if (design.mockups && design.mockups.length > 0 && design.mockups[0].mockup_path) {
              image = design.mockups[0].mockup_path;
            } else if (design.thumbnail_url) {
              image = design.thumbnail_url;
            }
            return {
              id: design.id,
              name: design.name,
              image,
              creator: design.user_id?.full_name || 'Unknown',
              category: design.category || '',
              is_free: design.price === 0,
              price: design.price,
              favorite_id: fav.id // store favorite row id for removal
            };
          })
        );
      }
      setLoading(false);
    };
    fetchFavourites();
  }, []);

  if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  if (!products.length) return <div className="text-center mt-10">No favourites yet.</div>;

  // Remove from favourites handler
  const handleRemove = async (favorite_id: string) => {
    setRemoving(favorite_id);
    const { error } = await supabase
      .from('design_favorites')
      .delete()
      .eq('id', favorite_id);
    if (!error) {
      setProducts(products => products.filter(p => p.favorite_id !== favorite_id));
    }
    setRemoving(null);
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition relative">
            <img src={product.image} alt={product.name} className="w-full h-48 object-cover rounded-t-lg" />
            {/* Red heart icon as a button */}
            <button
              className={`absolute top-3 right-3 text-red-500 text-2xl focus:outline-none ${removing === product.favorite_id ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => handleRemove(product.favorite_id)}
              disabled={removing === product.favorite_id}
              aria-label="Remove from favourites"
              title="Remove from favourites"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" width="28" height="28">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41 0.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
            </button>
            <div className="p-4">
              <h3 className="font-semibold text-base mb-1 truncate" title={product.name}>{product.name}</h3>
              <div className="text-xs text-gray-500 mb-1">by {product.creator}</div>
              <div className="text-xs text-gray-400 mb-2">{product.category}</div>
              <button className="w-full bg-yellow-300 text-yellow-900 rounded py-1 font-medium mt-2">Download</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FavouritesPage;
