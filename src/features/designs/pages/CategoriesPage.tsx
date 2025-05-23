import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Tag, Search } from 'lucide-react';
import { format } from 'date-fns';
import { useDesigns } from '../hooks/useDesigns';
import { Design, CATEGORIES } from '../../../shared/types/design';
import DownloadButton from '../components/DownloadButton';

interface SearchSuggestion {
  id: string;
  name: string;
  category: string;
  type: 'design' | 'category';
}

export default function CategoriesPage() {
  const { designs, designMockups, loading, error } = useDesigns();
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  // Close suggestions when clicking outside
  const handleClickOutside = (event: MouseEvent) => {
    if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
      setShowSuggestions(false);
    }
  };

  React.useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const updateSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    // Start with category suggestions
    const categoryMatches: SearchSuggestion[] = Object.keys(CATEGORIES)
      .filter(cat => cat.toLowerCase().includes(query.toLowerCase()))
      .map(cat => ({
        id: cat,
        name: cat,
        category: 'Category',
        type: 'category' as const
      }));

    // Add design suggestions from all categories
    const designMatches: SearchSuggestion[] = [];
    Object.values(designs).forEach(categoryDesigns => {
      categoryDesigns.forEach(design => {
        if (
          design.name.toLowerCase().includes(query.toLowerCase()) ||
          (design.tags && design.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
        ) {
          designMatches.push({
            id: design.id,
            name: design.name,
            category: design.category,
            type: 'design' as const
          });
        }
      });
    });

    // Combine and limit results
    setSuggestions([...categoryMatches, ...designMatches].slice(0, 8));
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      // In a real app, redirect to search results page or filter locally
      console.log('Searching for:', searchQuery);
    }
  };

  const handleInput = () => {
    const query = inputRef.current?.value || '';
    setSearchQuery(query);
    setShowSuggestions(!!query.trim());

    // Debounce search suggestions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      updateSuggestions(query);
    }, 300);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'category') {
      // Navigate to category
      setSearchQuery('');
    } else {
      // Navigate to design
      setSearchQuery('');
    }
    setShowSuggestions(false);
  };

  const filterDesigns = (categoryDesigns: Design[]) => {
    if (!searchQuery.trim()) {
      return categoryDesigns;
    }
    return categoryDesigns.filter(
      design =>
        design.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (design.tags && design.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mx-auto mb-6"></div>
            <div className="h-48 bg-gray-200 rounded mb-4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-48 bg-gray-200"></div>
                  <div className="p-4">
                    <div className="h-5 bg-gray-200 rounded mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Browse Designs</h1>
        
        {/* Search Bar */}
        <div ref={searchRef} className="relative w-full max-w-md">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search designs or categories..."
              value={searchQuery}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              onFocus={() => setShowSuggestions(!!searchQuery.trim())}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className="text-gray-400" />
            </div>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md overflow-hidden max-h-60 overflow-y-auto">
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
                  <div
                    key={design.id}
                    className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow flex flex-col"
                  >
                    <Link
                      to={`/design/${design.id}`}
                      className="block"
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
                            <span className="mr-1">{design.downloads}</span> downloads
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
                    <div className="p-4 pt-0 mt-auto">
                      <DownloadButton
                        designId={design.id}
                        price={design.price}
                        isFreebie={design.is_freebie}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
