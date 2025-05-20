import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  tags: string[];
  preview_image: string;
  files: string[];
  status: string;
}

export default function EditListing() {
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!user || !id) return;

    fetchListing();
  }, [user, id]);

  const fetchListing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setListing(data);
    } catch (error) {
      console.error('Error fetching listing:', error);
      toast.error('Failed to load listing');
      navigate('/dashboard/seller');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!listing) return;

    try {
      setLoading(true);

      // Update listing data
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          title: listing.title,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          tags: listing.tags,
          status: listing.status,
        })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      // Handle file uploads if new files were added
      if (previewImage) {
        const { error: imageError } = await supabase.storage
          .from('listings')
          .upload(`previews/${listing.id}`, previewImage);

        if (imageError) throw imageError;
      }

      // Handle additional files
      for (const file of files) {
        const { error: fileError } = await supabase.storage
          .from('listings')
          .upload(`files/${listing.id}/${file.name}`, file);

        if (fileError) throw fileError;
      }

      toast.success('Listing updated successfully');
      navigate('/dashboard/seller');
    } catch (error) {
      console.error('Error updating listing:', error);
      toast.error('Failed to update listing');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !listing) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-8">Edit Listing</h1>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={listing.title}
            onChange={(e) => setListing({ ...listing, title: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={listing.description}
            onChange={(e) => setListing({ ...listing, description: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            rows={4}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Price</label>
          <div className="mt-1 flex rounded-md shadow-sm">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
              $
            </span>
            <input
              type="number"
              step="0.01"
              value={listing.price}
              onChange={(e) => setListing({ ...listing, price: parseFloat(e.target.value) })}
              className="flex-1 block w-full rounded-none rounded-r-md min-w-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={listing.category}
            onChange={(e) => setListing({ ...listing, category: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select category</option>
            <option value="templates">Templates</option>
            <option value="icons">Icons</option>
            <option value="illustrations">Illustrations</option>
            <option value="ui-kits">UI Kits</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            value={listing.tags.join(', ')}
            onChange={(e) => setListing({ ...listing, tags: e.target.value.split(',').map(tag => tag.trim()) })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            placeholder="Enter tags separated by commas"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Preview Image</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="preview-image" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload a file</span>
                  <input
                    id="preview-image"
                    name="preview-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => setPreviewImage(e.target.files?.[0] || null)}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Files</label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
                aria-hidden="true"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label htmlFor="files" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                  <span>Upload files</span>
                  <input
                    id="files"
                    name="files"
                    type="file"
                    multiple
                    onChange={(e) => setFiles(Array.from(e.target.files || []))}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">ZIP, PSD, AI, PDF up to 100MB</p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={listing.status}
            onChange={(e) => setListing({ ...listing, status: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="draft">Draft</option>
            <option value="pending">Pending Review</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
