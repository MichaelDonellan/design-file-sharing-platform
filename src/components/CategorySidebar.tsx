import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../types';

interface CategorySidebarProps {
  selectedCategory: string;
  selectedSubcategory?: string;
  onCategorySelect: (category: string, subcategory?: string) => void;
  isMobile?: boolean;
  onClose?: () => void;
}

export default function CategorySidebar({
  selectedCategory,
  selectedSubcategory,
  onCategorySelect,
  isMobile = false,
  onClose,
}: CategorySidebarProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleCategorySelect = (category: string, subcategory?: string) => {
    onCategorySelect(category, subcategory);
    if (isMobile && onClose) {
      onClose();
    }
  };

  return (
    <div className={`${isMobile ? 'fixed inset-0 z-50 bg-white' : 'w-64 bg-white rounded-lg shadow-md p-4'}`}>
      {isMobile && (
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Categories</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-gray-100"
          >
            <ChevronRight size={24} />
          </button>
        </div>
      )}
      <div className={`${isMobile ? 'p-4' : ''} space-y-2`}>
        {Object.entries(CATEGORIES).map(([category, subcategories]) => (
          <div key={category} className="space-y-1">
            <button
              onClick={() => {
                toggleCategory(category);
                handleCategorySelect(category);
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
                    onClick={() => handleCategorySelect(category, sub)}
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