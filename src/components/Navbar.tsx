import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, LogIn, PlusSquare, Menu, X, User, Store, Settings, LogOut, Tag, ShoppingBag } from 'lucide-react';
import UserMenu from './UserMenu';
import { CATEGORIES } from '../types';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import LoginPanel from './LoginPanel';
import RegisterPanel from './RegisterPanel';

export default function Navbar() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  // Example language state, can be expanded
  const [language] = useState("EN");

  const mainLinks = [
    // Main links remain unchanged for now; category links will be added below
    { name: "Fonts", to: "/categories?main=Fonts" },
    { name: "Images", to: "/categories?main=Images" },
    { name: "3D Crafts", to: "/categories?main=3D%20Crafts" },
    { name: "Crafts", to: "/categories?main=Crafts" },
    { name: "Needlework", to: "/categories?main=Needlework" },
    { name: "Photos", to: "/categories?main=Photos" },
    { name: "Tools", to: "/tools" },
    { name: "POD", to: "/pod" },
    { name: "Bundles", to: "/bundles" },
    { name: "Learn", to: "/learn" },
    { name: "Studio", to: "/studio" },
    { name: "Subscription", to: "/subscription" },
  ];

  // New horizontal category links
  const navbarCategories = [
    'SVGs',
    'Images',
    'Fonts',
    'Bundles',
    'Templates',
    'Laser Cutting',
    'Sublimation',
  ];

  const rightLinks = [
    { name: "Enterprise", to: "/enterprise" },
    { name: "Freebies", to: "/freebies" },
    { name: "Gifts", to: "/gifts" },
  ];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search)}`);
    }
  }

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* Top Row */}
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
        {/* Logo */}
        <Link to="/" className="font-extrabold text-2xl text-gray-900 tracking-tight mr-6 whitespace-nowrap">
          Creative Fabrica
        </Link>
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search fonts, graphics, embroidery, crafts, and more"
              className="w-full border border-gray-300 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-blue-600">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </div>
        </form>
        {/* Actions */}
        <div className="flex items-center gap-2 ml-6">
          {/* Language Dropdown */}
          <div className="relative">
            <button className="flex items-center px-2 py-1 text-gray-700 border rounded hover:bg-gray-50 text-sm">
              <span className="mr-1">{language}</span>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {/* Language dropdown could be implemented here */}
          </div>
          {/* Auth Buttons */}
          {user ? (
            <>
              <Link to="/dashboard/profile" className="px-3 py-1 text-gray-700 hover:text-blue-600 text-sm">Account</Link>
              <button onClick={signOut} className="px-3 py-1 text-gray-700 hover:text-blue-600 text-sm">Logout</button>
            </>
          ) : (
            <>
              <button onClick={() => setIsLoginOpen(true)} className="px-3 py-1 text-gray-700 hover:text-blue-600 text-sm">Login</button>
              <button onClick={() => setIsRegisterOpen(true)} className="px-3 py-1 border rounded text-gray-700 hover:bg-gray-100 text-sm">Sign Up</button>
              <Link to="/plus-library" className="ml-2 px-4 py-1 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm hover:opacity-90 transition">Free Trial</Link>
            </>
          )}
        </div>
      </div>
      {/* Bottom Row - Main Links */}
      <nav className="w-full bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center px-4 overflow-x-auto scrollbar-hide justify-between">
          <div className="flex items-center">
            {mainLinks.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className="py-3 px-3 text-gray-700 hover:text-blue-600 font-medium text-sm whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-6">
            {rightLinks.map(link => (
              <Link
                key={link.name}
                to={link.to}
                className="py-3 px-3 text-gray-700 hover:text-blue-600 font-medium text-sm whitespace-nowrap"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
        {/* Category Links Row */}
        <div className="max-w-7xl mx-auto flex items-center px-4 overflow-x-auto scrollbar-hide border-t border-gray-100 bg-white">
          {navbarCategories.map(cat => (
            <Link
              key={cat}
              to={`/category/${cat.toLowerCase().replace(/ /g, '-')}`}
              className="py-2 px-3 text-gray-600 hover:text-blue-600 font-medium text-sm whitespace-nowrap"
            >
              {cat}
            </Link>
          ))}
        </div>
      </nav>
      {/* Login/Register Panels */}
      <LoginPanel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </header>
  );
}
        {/* Login/Register Panels */}
        <LoginPanel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
        <RegisterPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />

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
                  {hasStore && (
                    <Link
                      to="/dashboard/seller"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingBag size={20} />
                      <span>Seller Dashboard</span>
                    </Link>
                  )}
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
                  {isAdmin && (
                    <Link
                      to="/admin"
                      className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <ShoppingBag size={20} />
                      <span>Admin</span>
                    </Link>
                  )}
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
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsLoginOpen(true);
                  }}
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                >
                  Login
                </button>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsRegisterOpen(true);
                  }}
                  className="block px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Register
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
