import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../types';

interface CategorySidebarProps {
  selectedCategory: string;
  selectedSubcategory?: string;
  onCategorySelect: (category: string, subcategory?: string) => void;
}

export default function CategorySidebar({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="w-64 bg-white rounded-lg shadow-md p-4">
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div className="space-y-2">
        {Object.entries(CATEGORIES).map(([category, subcategories]) => (
          <div key={category} className="space-y-1">
            <button
              onClick={() => {
                toggleCategory(category);
                onCategorySelect(category);
              }}
              className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-50 text-blue-600'
                  : 'hover:bg-gray-50'
              }`}
            >
              <span>{category}</span>
              {expandedCategories.includes(category) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
            
            {expandedCategories.includes(category) && (
              <div className="ml-4 space-y-1">
                {subcategories.map(sub => (
                  <button
                    key={sub}
                    onClick={() => onCategorySelect(category, sub)}
                    className={`w-full text-left p-2 rounded-md transition-colors ${
                      selectedSubcategory === sub
                        ? 'bg-blue-50 text-blue-600'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}