import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design } from '../types';
import { CATEGORIES } from '../types';
import { Download, Calendar, Tag, Search } from 'lucide-react';
import { format } from 'date-fns';

interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  type: 'design' | 'category';
}

export default function Categories() {
  const location = useLocation();
  // Parse ?main=Category from the query string
  const queryParams = new URLSearchParams(location.search);
  const mainCategory = queryParams.get('main');
  const [designs, setDesigns] = useState<Record<string, Design[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [designMockups, setDesignMockups] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    async function fetchDesigns() {
      try {
        setLoading(true);
        setError(null);

        if (!isMounted) return;

        const { data: designsData, error: supabaseError } = await supabase
          .from('designs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (supabaseError) {
          throw supabaseError;
        }

        if (designsData) {
          const designsByCategory = designsData.reduce((acc, design) => {
            const category = design.free_download ? 'Free Downloads' : design.category;
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(design);
            return acc;
          }, {} as Record<string, Design[]>);

          Object.keys(CATEGORIES).forEach(category => {
            if (!designsByCategory[category]) {
              designsByCategory[category] = [];
            }
          });

          setDesigns(designsByCategory);

          const { data: mockupsData, error: mockupsError } = await supabase
            .from('design_mockups')
            .select('design_id, mockup_path')
            .in('design_id', designsData.map(d => d.id))
            .order('display_order');

          if (!isMounted) return;

          if (mockupsError) {
            console.error('Error fetching mockups:', mockupsError);
          } else if (mockupsData) {
            // Create a map of design_id to first mockup path with proper Supabase Storage URL
const mockupMap = mockupsData.reduce((acc, mockup) => {
  if (!acc[mockup.design_id]) {
    // Generate a proper Supabase Storage URL
    const { data } = supabase.storage
      .from('designs')
      .getPublicUrl(mockup.mockup_path);
    
    // Store the public URL instead of just the path
    acc[mockup.design_id] = data.publicUrl;
  }
  return acc;
}, {} as Record<string, string>);
            
            setDesignMockups(mockupMap);
          }
        }
      } catch (err) {
        console.error('Error fetching designs:', err);
        if (isMounted) {
          setError('Failed to load designs. Please try again later.');
          setDesigns({});
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
      abortController.abort();
    };
  }, []);

  useEffect(() => {
    // Close suggestions when clicking outside
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSuggestions = (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const searchLower = query.toLowerCase();
    const newSuggestions: SearchSuggestion[] = [];

    // Add matching categories
    Object.keys(CATEGORIES).forEach(category => {
      if (category.toLowerCase().includes(searchLower)) {
        newSuggestions.push({
          id: category,
          name: category,
          category: category,
          type: 'category'
        });
      }
    });

    // Add matching designs
    Object.entries(designs).forEach(([category, categoryDesigns]) => {
      categoryDesigns.forEach(design => {
        if (
          design.name.toLowerCase().includes(searchLower) ||
          design.description?.toLowerCase().includes(searchLower) ||
          design.tags?.some(tag => tag.toLowerCase().includes(searchLower))
        ) {
          newSuggestions.push({
            id: design.id,
            name: design.name,
            category: category,
            type: 'design'
          });
        }
      });
    });

    // Sort suggestions by relevance
    newSuggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchLower;
      const bExact = b.name.toLowerCase() === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    setSuggestions(newSuggestions.slice(0, 5));
  };

  const handleSearch = () => {
    if (inputRef.current) {
      const query = inputRef.current.value;
      setSearchQuery(query);
      setShowSuggestions(false);
    }
  };

  const handleInput = () => {
    if (inputRef.current) {
      // Clear any existing timeout
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      // Set a new timeout to update suggestions after typing stops
      searchTimeoutRef.current = setTimeout(() => {
        const query = inputRef.current?.value || '';
        updateSuggestions(query);
        setShowSuggestions(true);
      }, 100); // Small delay to prevent too many updates
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (inputRef.current) {
      inputRef.current.value = suggestion.name;
      setSearchQuery(suggestion.name);
      setShowSuggestions(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const filterDesigns = (designs: Design[]) => {
    if (!searchQuery) return designs;
    const query = searchQuery.toLowerCase();
    return designs.filter(design => 
      design.name.toLowerCase().includes(query) ||
      design.description?.toLowerCase().includes(query) ||
      design.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading categories...</div>
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

  // Determine which categories to show
  let categoriesToShow: [string, Design[]][];
  if (mainCategory) {
    categoriesToShow = Object.entries(designs).filter(
      ([category]) => category.toLowerCase() === mainCategory.toLowerCase()
    );
  } else {
    categoriesToShow = Object.entries(designs);
  }
  const hasResults = categoriesToShow.some(([, categoryDesigns]) => filterDesigns(categoryDesigns).length > 0);

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {hasResults ? (
        categoriesToShow.map(([category, categoryDesigns]) => {
          const filteredDesigns = filterDesigns(categoryDesigns);
          if (filteredDesigns.length === 0) return null;
          return (
            <div key={category} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Tag className="mr-2" size={24} />
                  {category}
                </h2>
                {!mainCategory && (
                  <Link
                    to={`/category/${category.toLowerCase()}`}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    View all
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredDesigns.slice(0, 8).map((design) => (
                  <Link
                    key={design.id}
                    to={`/design/${design.id}`}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="aspect-w-16 aspect-h-9">
                      <img
                        src={designMockups[design.id] || '/placeholder.png'}
                        alt={design.name}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/placeholder.png';
                        }}
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 truncate">{design.name}</h3>
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
                      {design.price && design.price > 0 ? (
                        <div className="mt-2 text-sm font-medium text-green-600">
                          ${design.price.toFixed(2)}
                        </div>
                      ) : (
                        <div className="mt-2 text-sm font-medium text-blue-600">
                          Free
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="text-center text-gray-500 py-12 text-lg">No results</div>
      )}
    </div>
  </>);
}