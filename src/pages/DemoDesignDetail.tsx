import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Download, Heart, ShoppingCart, Tag, Store as StoreIcon, Calendar, Share2 } from 'lucide-react';

// Demo component to show the design detail page layout
export default function DemoDesignDetail() {
  // Demo states
  const [isPaid, setIsPaid] = React.useState(false);
  const [hasPurchased, setHasPurchased] = React.useState(false);
  const [isFavorited, setIsFavorited] = React.useState(false);

  // Toggle favorite status
  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  // Toggle between free and paid product
  const togglePaidStatus = () => {
    setIsPaid(!isPaid);
  };

  // Toggle purchase status (only for paid products)
  const togglePurchaseStatus = () => {
    setHasPurchased(!hasPurchased);
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-7xl">
      <div className="bg-yellow-100 rounded-lg p-4 mb-8">
        <h2 className="font-bold text-lg mb-2">Demo Control Panel</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={togglePaidStatus}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Product Type: {isPaid ? 'Paid Product ($10)' : 'Free Product'}
          </button>
          
          {isPaid && (
            <button 
              onClick={togglePurchaseStatus}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Purchase Status: {hasPurchased ? 'Purchased' : 'Not Purchased'}
            </button>
          )}
          
          <Link to="/" className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Back to Home
          </Link>
        </div>
      </div>
      
      {/* Hero section with image and gradient overlay */}
      <div className="relative">
        <img 
          src="/placeholder.png" 
          alt="Testing downloads" 
          className="w-full h-96 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
          <h1 className="text-3xl font-bold text-white mb-2">Testing downloads</h1>
          <div className="flex items-center space-x-4 text-white">
            <div className="flex items-center">
              <Eye className="w-5 h-5 mr-1" aria-hidden="true" />
              <span>42 views</span>
            </div>
            <div className="flex items-center">
              <Heart className="w-5 h-5 mr-1" aria-hidden="true" />
              <span>12 favorites</span>
            </div>
            <div className="flex items-center">
              <Download className="w-5 h-5 mr-1" aria-hidden="true" />
              <span>5 downloads</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Mockups</h2>
            <div className="bg-white p-4 rounded-lg shadow">
              <img src="/placeholder.png" alt="Design mockup" className="w-full h-auto rounded" />
            </div>
          </div>
        </div>
        <div>
          <div className="flex items-center mb-4">
            <StoreIcon className="w-5 h-5 mr-2 text-blue-600" />
            <a href="#" className="text-blue-600 hover:underline">Demo Store</a>
          </div>
          
          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">
              This is a sample design to demonstrate the download functionality. The download button is available for free products and for accounts that have purchased paid products. It is not shown for users who have not purchased a paid product.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">modern</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">minimal</span>
            <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm">download</span>
          </div>
          
          <div className="flex space-x-4 mb-8">
            {/* Favorite button */}
            <button
              onClick={toggleFavorite}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                isFavorited
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
              <span>{isFavorited ? 'Favorited' : 'Favorite'}</span>
            </button>
            
            {/* Download button logic: show if free, or if user has purchased */}
            {(!isPaid || hasPurchased) && (
              <button
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
              >
                <Download className="w-5 h-5" />
                <span>Download</span>
              </button>
            )}
            
            {/* Show Buy button if not purchased and paid product */}
            {isPaid && !hasPurchased && (
              <button
                onClick={togglePurchaseStatus}
                className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Buy for $10</span>
              </button>
            )}
            
            <button
              className="flex items-center space-x-2 bg-gray-100 text-gray-600 px-4 py-2 rounded-md hover:bg-gray-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
          
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold mb-4">Reviews</h2>
            <p className="text-gray-600 text-center py-8">
              No reviews yet. Be the first to review this design!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
