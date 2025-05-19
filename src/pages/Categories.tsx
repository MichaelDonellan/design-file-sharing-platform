import React, { useEffect, useState, useRef } from 'react';
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
  const [designs, setDesigns] = useState<Record<string, Design[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSearchQuery, setActiveSearchQuery] = useState('');
  const [designMockups, setDesignMockups] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    let abortController = new AbortController();

    async function fetchDesigns() {
      try {
        setLoading(true);
        setError(null);

        if (!isMounted) return;

        // Fetch all designs
        const { data: designsData, error: supabaseError } = await supabase
          .from('designs')
          .select('*')
          .order('created_at', { ascending: false });

        if (!isMounted) return;

        if (supabaseError) {
          throw supabaseError;
        }

        if (designsData) {
          // Group designs by category
          const designsByCategory = designsData.reduce((acc, design) => {
            // If the design is free, add it to Freebies category
            const category = design.is_freebie ? 'Freebies' : design.category;
            if (!acc[category]) {
              acc[category] = [];
            }
            acc[category].push(design);
            return acc;
          }, {} as Record<string, Design[]>);

          // Ensure all categories exist in the object
          Object.keys(CATEGORIES).forEach(category => {
            if (!designsByCategory[category]) {
              designsByCategory[category] = [];
            }
          });

          setDesigns(designsByCategory);

          // Fetch mockups for all designs
          const { data: mockupsData, error: mockupsError } = await supabase
            .from('design_mockups')
            .select('design_id, mockup_path')
            .in('design_id', designsData.map(d => d.id))
            .order('display_order');

          if (!isMounted) return;

          if (mockupsError) {
            console.error('Error fetching mockups:', mockupsError);
          } else if (mockupsData) {
            const mockupMap = mockupsData.reduce((acc, mockup) => {
              if (!acc[mockup.design_id]) {
                acc[mockup.design_id] = mockup.mockup_path;
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

    // Sort suggestions by relevance (exact matches first, then partial matches)
    newSuggestions.sort((a, b) => {
      const aExact = a.name.toLowerCase() === searchLower;
      const bExact = b.name.toLowerCase() === searchLower;
      if (aExact && !bExact) return -1;
      if (!aExact && bExact) return 1;
      return a.name.localeCompare(b.name);
    });

    // Limit to 5 suggestions
    setSuggestions(newSuggestions.slice(0, 5));
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    updateSuggestions(value);
    setShowSuggestions(true);
  };

  const handleSearch = () => {
    setActiveSearchQuery(searchQuery);
    setShowSuggestions(false);
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
    setSearchQuery(suggestion.name);
    setActiveSearchQuery(suggestion.name);
    setShowSuggestions(false);
  };

  const filterDesigns = (designs: Design[]) => {
    if (!activeSearchQuery) return designs;
    return designs.filter(design => 
      design.name.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      design.description?.toLowerCase().includes(activeSearchQuery.toLowerCase()) ||
      design.tags?.some(tag => tag.toLowerCase().includes(activeSearchQuery.toLowerCase()))
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">Browse Categories</h1>
        <div ref={searchRef} className="relative">
          <div className="flex">
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearchChange}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(true)}
              placeholder="Search designs or categories..."
              className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoCapitalize="off"
              autoCorrect="off"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              onClick={handleSearch}
              className="bg-blue-500 text-white px-4 py-2 rounded-r-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 flex items-center"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-gray-200 max-h-60 overflow-auto">
              {suggestions.map((suggestion) => (
                <button
                  key={`${suggestion.type}-${suggestion.id}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 focus:outline-none focus:bg-gray-100 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <Tag size={16} className="mr-2 text-gray-500" />
                    <span className="font-medium">{suggestion.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {suggestion.type === 'category' ? 'Category' : suggestion.category}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-12">
        {Object.entries(designs).map(([category, categoryDesigns]) => {
          const filteredDesigns = filterDesigns(categoryDesigns);
          if (filteredDesigns.length === 0) return null;

          return (
            <div key={category} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Tag className="mr-2" size={24} />
                  {category}
                </h2>
                <Link
                  to={`/category/${category.toLowerCase()}`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View all
                </Link>
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
        })}
      </div>
    </div>
  );
} 