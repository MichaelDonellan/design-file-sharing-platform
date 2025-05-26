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
  console.log('FavouritesPage MOUNTED');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    console.log('useEffect RUN');
    const fetchFavourites = async () => {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Fetched user:', user, 'Error:', userError);
      if (!user) { 
        console.log('No user found, aborting fetch.');
        setLoading(false); 
        return; 
      }
      console.log('User found, proceeding with fetch...');
      // Join design_favorites with designs and users
      // Fetch all favorites for this user, join with design and user profile
      console.log('Fetching favorites...');
      const { data: favs, error } = await supabase
        .from('design_favorites')
        .select(`design_id, designs(*, design_mockups(mockup_path))`) // join to designs and fetch mockup_path from design_mockups
        .eq('user_id', user.id);
      console.log('Favorites fetched.');
      if (error) {
        console.log('Supabase error:', error);
        setLoading(false);
        return;
      }
      console.log('RAW FAVS:', favs, error);
      if (favs) {
        console.log('Mapping favorites...');
        setProducts(
          favs.map((fav: any) => {
            const design = fav.designs;
            // Use mockup if available, else thumbnail, else placeholder
            let image = '/placeholder.png';
            if (design.design_mockups && design.design_mockups.length > 0 && design.design_mockups[0].mockup_path) {
              const { data } = supabase.storage.from('designs').getPublicUrl(design.design_mockups[0].mockup_path);
              image = data.publicUrl || '/placeholder.png';
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
    try {
      setRemoving(favorite_id);
      
      // Get product before removing from state
      const product = products.find(p => p.favorite_id === favorite_id);
      if (!product) {
        throw new Error('Favorite not found');
      }
      
      console.log('Deleting favorite with ID:', favorite_id);
      const { error } = await supabase
        .from('design_favorites')
        .delete()
        .eq('id', favorite_id);
      
      if (error) {
        console.error('Supabase delete error:', error);
        throw error;
      }
      
      // Remove from UI immediately for better UX
      setProducts(products => products.filter(p => p.favorite_id !== favorite_id));
      
      // Show success feedback
      alert(`${product.name} removed from favorites`);
    } catch (error) {
      console.error('Error removing favorite:', error);
      alert('Failed to remove from favorites. Please try again.');
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-6">
        {products.map(product => (
          <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition relative overflow-hidden">
            <div className="relative pt-[100%] bg-gray-100">
              <img 
                src={product.image} 
                alt={product.name} 
                className="absolute top-0 left-0 w-full h-full object-cover" 
              />
            </div>
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
