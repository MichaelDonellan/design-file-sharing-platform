import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import type { Design, Store, Review, DesignMockup, DesignFile } from '../types';
import { Download, Calendar, Tag, Store as StoreIcon, Star } from 'lucide-react';
import { format } from 'date-fns';
import ImageCarousel from '../components/ImageCarousel';
import ReviewForm from '../components/ReviewForm';
import ReviewsList from '../components/ReviewsList';

export default function DesignDetail() {
  const { id } = useParams<{ id: string }>();
  const [design, setDesign] = useState<Design | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [mockups, setMockups] = useState<DesignMockup[]>([]);
  const [files, setFiles] = useState<DesignFile[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [relatedDesigns, setRelatedDesigns] = useState<Design[]>([]);

  useEffect(() => {
    async function fetchData() {
      if (!id) return;

      const { data: designData, error: designError } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (designError) {
        console.error('Error fetching design:', designError);
        setLoading(false);
        return;
      }

      setDesign(designData);

      // Fetch store data
      if (designData.store_id) {
        const { data: storeData } = await supabase
          .from('stores')
          .select('*')
          .eq('id', designData.store_id)
          .single();

        setStore(storeData);

        // Fetch related designs from the same store
        const { data: relatedData } = await supabase
          .from('designs')
          .select('*')
          .eq('store_id', designData.store_id)
          .neq('id', id)
          .limit(3);

        if (relatedData) {
          setRelatedDesigns(relatedData);
        }
      }

      // Fetch mockups
      const { data: mockupsData } = await supabase
        .from('design_mockups')
        .select('*')
        .eq('design_id', id)
        .order('display_order');

      if (mockupsData) {
        setMockups(mockupsData);
      }

      // Fetch files
      const { data: filesData } = await supabase
        .from('design_files')
        .select('*')
        .eq('design_id', id)
        .order('display_order');

      if (filesData) {
        setFiles(filesData);
      }

      // Fetch reviews - Modified query to not use foreign key relationship
      const { data: reviewsData } = await supabase
        .from('reviews')
        .select('*')
        .eq('design_id', id)
        .order('created_at', { ascending: false });

      if (reviewsData) {
        // Fetch user data separately for each review
        const reviewsWithUsers = await Promise.all(
          reviewsData.map(async (review) => {
            const { data: userData } = await supabase
              .from('auth.users')
              .select('id, email')
              .eq('id', review.user_id)
              .single();
            
            return {
              ...review,
              user: userData
            };
          })
        );
        
        setReviews(reviewsWithUsers);
      }

      setLoading(false);
    }

    fetchData();
  }, [id]);

  const handleDownload = async () => {
    if (!design || files.length === 0) return;

    try {
      const user = supabase.auth.getUser();
      if (!user) {
        console.error('User must be logged in to download');
        return;
      }

      // Create a purchase record with explicit user_id
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          design_id: design.id,
          user_id: (await user).data.user?.id,
          amount: design.price || 0,
          currency: design.currency || 'USD',
          status: 'completed'
        });

      if (purchaseError) {
        console.error('Error recording purchase:', purchaseError);
        return;
      }

      // Increment download count
      await supabase
        .from('designs')
        .update({ downloads: (design.downloads || 0) + 1 })
        .eq('id', design.id);

      // Download all files
      files.forEach((file) => {
        window.open(file.file_path, '_blank');
      });
    } catch (error) {
      console.error('Error downloading files:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">Loading design...</div>
      </div>
    );
  }

  if (!design || mockups.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-800">Design not found</h2>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold">{design.name}</h1>
              {design.average_rating && (
                <div className="flex items-center mt-2">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Star
                        key={value}
                        size={16}
                        className={value <= design.average_rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                      />
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-gray-600">
                    ({design.average_rating.toFixed(1)})
                  </span>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-md flex items-center space-x-1">
                <Tag size={16} />
                <span>{design.category}</span>
              </span>
              {design.tags && design.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 justify-end">
                  {design.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-gray-100 text-gray-600 text-sm rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          <div className="mb-8">
            <ImageCarousel mockups={mockups} />
          </div>

          {store && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 text-gray-600">
                <StoreIcon size={20} />
                <span>Sold by</span>
                <Link
                  to={`/store/${store.name}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {store.name}
                </Link>
              </div>

              {relatedDesigns.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-3">More from this seller</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {relatedDesigns.map((related) => (
                      <Link
                        key={related.id}
                        to={`/design/${related.id}`}
                        className="block hover:opacity-90 transition-opacity"
                      >
                        <img
                          src={related.mockup_path}
                          alt={related.name}
                          className="w-full h-32 object-cover rounded"
                        />
                        <p className="mt-2 text-sm font-medium truncate">
                          {related.name}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4 text-gray-600">
              <div className="flex items-center space-x-1">
                <Calendar size={20} />
                <span>{format(new Date(design.created_at), 'MMM d, yyyy')}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Download size={20} />
                <span>{design.downloads} downloads</span>
              </div>
            </div>
            
            <button
              onClick={handleDownload}
              className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-600 transition-colors"
            >
              <Download size={20} />
              <span>Download</span>
            </button>
          </div>

          <div className="prose max-w-none mb-8">
            <h2 className="text-xl font-semibold mb-2">Description</h2>
            <p className="text-gray-700">
              {design.description || 'No description provided'}
            </p>
          </div>

          <div className="border-t pt-8">
            <h2 className="text-xl font-semibold mb-6">Reviews</h2>
            <div className="space-y-8">
              <ReviewForm
                designId={design.id}
                onReviewSubmitted={() => {
                  // Refresh reviews after submission
                  window.location.reload();
                }}
              />
              
              {reviews.length > 0 ? (
                <ReviewsList reviews={reviews} />
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No reviews yet. Be the first to review this design!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}