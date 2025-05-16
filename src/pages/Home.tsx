import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design, CategoryFilter } from '../types';
import { Download, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import CategorySidebar from '../components/CategorySidebar';
import SearchBar from '../components/SearchBar';

export default function Home() {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>({ main: 'all' });
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchDesigns() {
      try {
        setLoading(true);
        setError(null);

        let query = supabase
          .from('designs')
          .select('*')
          .order('created_at', { ascending: false });

        if (selectedCategory.main !== 'all') {
          query = query.eq('category', selectedCategory.main);
          if (selectedCategory.sub) {
            query = query.eq('subcategory', selectedCategory.sub);
          }
        }

        if (searchQuery) {
          query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);
        }

        const { data, error: supabaseError } = await query;

        if (supabaseError) {
          throw supabaseError;
        }

        if (isMounted) {
          if (data) {
            setDesigns(data);
            setError(null);
          }
        }
      } catch (err) {
        console.error('Error fetching designs:', err);
        if (isMounted) {
          setError('Failed to load designs. Please try again later.');
          setDesigns([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchDesigns();

    return () => {
      isMounted = false;
    };
  }, [selectedCategory, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading designs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-8">
      {/* Category sidebar - desktop only */}
      <div className="hidden lg:block">
        <CategorySidebar
          selectedCategory={selectedCategory.main}
          selectedSubcategory={selectedCategory.sub}
          onCategorySelect={(category, subcategory) => {
            setSelectedCategory({ main: category, sub: subcategory });
          }}
        />
      </div>

      <div className="flex-1">
        <div className="mb-8 space-y-4">
          <h1 className="text-3xl font-bold">Browse Designs</h1>
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {designs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-600 mb-4">No designs found</p>
            <Link
              to="/upload"
              className="inline-flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600"
            >
              <span>Upload a Design</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {designs.map((design) => (
              <Link
                key={design.id}
                to={`/design/${design.id}`}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={design.mockup_path}
                    alt={design.name}
                    className="w-full h-48 object-cover"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-semibold">{design.name}</h2>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                      {design.category}
                    </span>
                  </div>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {design.description || 'No description provided'}
                  </p>
                  {design.tags && design.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {design.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar size={16} />
                      <span>{format(new Date(design.created_at), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Download size={16} />
                      <span>{design.downloads}</span>
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