import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Upload, LogIn, PlusSquare, Menu, X } from 'lucide-react';
import UserMenu from './UserMenu';

export default function Navbar() {
  const { user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
            <Link to="/" className="text-xl font-bold text-gray-800 ml-2">
              DesignShare
            </Link>
          </div>
          
          <div className="hidden lg:flex items-center space-x-4">
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
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900"
                >
                  <LogIn size={20} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="flex items-center space-x-1 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                >
                  <PlusSquare size={20} />
                  <span>Register</span>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`lg:hidden ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {user ? (
              <>
                <Link
                  to="/upload"
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Upload size={20} />
                  <span>Upload</span>
                </Link>
                <Link
                  to="/dashboard/profile"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  to="/dashboard/store"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Store
                </Link>
                <Link
                  to="/dashboard/settings"
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Settings
                </Link>
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    // Add your sign out logic here
                  }}
                  className="block w-full text-left px-3 py-2 text-gray-600 hover:text-gray-900 rounded-md"
                >
                  Logout
                </button>
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