import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, LogIn, PlusSquare, Menu, X, User, Store, Settings, LogOut, Tag, ShoppingBag, Heart, Bell, ShoppingCart } from 'lucide-react';
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
    { name: "Fonts", to: "/categories?main=Fonts" },
    { name: "Images", to: "/categories?main=Images" },
    { name: "Crafts", to: "/categories?main=Crafts" },
    { name: "Photos", to: "/categories?main=Photos" },
    { name: "POD", to: "/pod" },
    { name: "Bundles", to: "/bundles" },
    { name: "Free Downloads", to: "/free-downloads" },
  ];


  // Define rightLinks to prevent ReferenceError
  const rightLinks: { name: string; to: string }[] = [
  { name: "Help", to: "/help" },
  { name: "Contact Us", to: "/contact" },
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
          The Craft Syde
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
              <div className="flex items-center gap-6">
                <Link to="/user/favourites" className="flex flex-col items-center text-gray-700 hover:text-blue-600">
                  <Heart className="h-6 w-6 mb-1" />
                  <span className="text-xs">Favorites</span>
                </Link>
                <Link to="/notifications" className="flex flex-col items-center text-gray-700 hover:text-blue-600">
                  <Bell className="h-6 w-6 mb-1" />
                  <span className="text-xs">Notifications</span>
                </Link>
                <Link to="/cart" className="flex flex-col items-center text-gray-700 hover:text-blue-600">
                  <ShoppingCart className="h-6 w-6 mb-1" />
                  <span className="text-xs">Cart</span>
                </Link>
                <UserMenu />
              </div>
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
          <div className="flex items-center ml-12">
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

      </nav>
      {/* Login/Register Panels */}
      <LoginPanel isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <RegisterPanel isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
    </header>
  );
}
