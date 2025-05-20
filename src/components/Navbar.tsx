import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, LogIn, PlusSquare, Menu, X, User, Store, Settings, LogOut, Tag } from 'lucide-react';
import UserMenu from './UserMenu';
import { CATEGORIES } from '../types';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <nav className="bg-white shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

          </div>
          
          {/* Mobile Profile Icon */}
          {user && (
            <div className="lg:hidden">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full bg-blue-500 text-white"
              >
                <User size={20} />
              </button>
            </div>
          )}
          
          <div className="hidden lg:flex items-center space-x-4">
            <div className="relative">
              <select
                className="bg-white border border-gray-300 rounded-md px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
            </div>
            {user ? (
              <>
                <Link
                  to="/upload"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <Upload size={20} />
                  <span>Upload</span>
                </Link>
                <UserMenu />
              </>
            ) : (
              <>
                <button
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  <LogIn size={20} />
                  <span>Login</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                {/* Profile Section */}
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">
                    My Account
                  </div>
                  <Link
                    to="/dashboard/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <User size={20} />
                    <span>Profile</span>
                  </Link>
                  <Link
                    to="/dashboard/store"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Store size={20} />
                    <span>Store</span>
                  </Link>
                  <Link
                    to="/dashboard/settings"
                    className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Settings size={20} />
                    <span>Settings</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      signOut();
                    }}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                  >
                    <LogOut size={20} />
                    <span>Logout</span>
                  </button>
                </div>

                {/* Main Navigation */}
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <Link
                    to="/upload"
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Upload size={20} />
                    <span>Upload</span>
                  </Link>
                  <Link
                    to="/categories"
                    className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Tag size={20} />
                    <span>Categories</span>
                  </Link>
                </div>

                {/* Categories Section */}
                <div>
                  <div className="px-3 py-2 text-sm font-medium text-gray-500">
                    Browse Categories
                  </div>
                  {Object.entries(CATEGORIES).map(([category, subcategories]) => (
                    <div key={category} className="space-y-1">
                      <button
                        onClick={() => toggleCategory(category)}
                        className="w-full flex items-center justify-between px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                      >
                        <div className="flex items-center space-x-2">
                          <Tag size={20} />
                          <span>{category}</span>
                        </div>
                        {expandedCategories.includes(category) ? (
                          <X size={16} />
                        ) : (
                          <Menu size={16} />
                        )}
                      </button>
                      
                      {expandedCategories.includes(category) && (
                        <div className="ml-4 space-y-1">
                          {subcategories.map(sub => (
                            <Link
                              key={sub}
                              to={`/?category=${category}&subcategory=${sub}`}
                              className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                              onClick={() => setIsMobileMenuOpen(false)}
                            >
                              {sub}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}