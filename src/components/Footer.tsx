import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full bg-white border-t border-gray-200 mt-12">
      <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between text-gray-600 text-sm">
        <div>
          &copy; {new Date().getFullYear()} Design File Sharing Platform. All rights reserved.
        </div>
        <div className="flex space-x-4 mt-2 md:mt-0">
          <a href="/" className="hover:underline">Home</a>
          <a href="/categories" className="hover:underline">Categories</a>
          <a href="/store" className="hover:underline">Create a Store</a>
          <a href="/dashboard/settings" className="hover:underline">Settings</a>
          <a href="/terms" className="hover:underline">Terms &amp; Conditions</a>
          <a href="/privacy" className="hover:underline">Privacy Policy</a>
        </div>
      </div>
    </footer>
  );
}
