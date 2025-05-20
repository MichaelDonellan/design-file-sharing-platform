import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Design } from '../../types';
import { supabase } from '../../lib/supabase';

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!id) return;

    fetchListing();
  }, [id]);



  const fetchListing = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('designs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (!data) {
        toast.error('Design not found');
        navigate('/dashboard/seller');
        return;
      }
      setListing(data);
    } catch (error) {
      console.error('Error fetching design:', error);
      toast.error('Failed to load design');
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

      // Update design data
      const { error: updateError } = await supabase
        .from('designs')
        .update({
          name: listing.name,
          description: listing.description,
          price: listing.price,
          category: listing.category,
          tags: listing.tags,
          is_freebie: listing.is_freebie,
          file_type: listing.file_type
        })
        .eq('id', listing.id);

      if (updateError) throw updateError;

      // Handle file uploads if new files were added
      if (previewImage) {
        const { error: imageError } = await supabase.storage
          .from('designs')
          .upload(`previews/${listing.id}`, previewImage);

        if (imageError) throw imageError;
      }

      // Handle additional files
      for (const file of files) {
        const { error: fileError } = await supabase.storage
          .from('designs')
          .upload(`files/${listing.id}/${file.name}`, file);

        if (fileError) throw fileError;
      }

      toast.success('Design updated successfully');
      navigate('/dashboard/seller');
    } catch (error) {
      console.error('Error updating design:', error);
      toast.error('Failed to update design');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!listing) {
      toast.error('Design not found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);

      // First, get all associated files
      const { data: files, error: filesError } = await supabase
        .from('design_files')
        .select('*')
        .eq('design_id', listing.id);

      if (filesError) {
        console.error('Error fetching files:', filesError);
        toast.error('Failed to fetch associated files');
        return;
      }

      // Delete files from storage
      if (files && files.length > 0) {
        const storagePaths = files.map(file => file.path);
        const { error: storageError } = await supabase.storage
          .from('designs')
          .remove(storagePaths);

        if (storageError) {
          console.error('Error deleting storage files:', storageError);
          toast.error('Failed to delete design files');
          return;
        }
      }

      // Delete files from design_files table
      const { error: designFilesError } = await supabase
        .from('design_files')
        .delete()
        .eq('design_id', listing.id);

      if (designFilesError) {
        console.error('Error deleting design files:', designFilesError);
        toast.error('Failed to delete design files from database');
        return;
      }

      // Delete mockups from storage
      const { data: mockups, error: mockupsError } = await supabase
        .from('design_mockups')
        .select('*')
        .eq('design_id', listing.id);

      if (mockupsError) {
        console.error('Error fetching mockups:', mockupsError);
        toast.error('Failed to fetch associated mockups');
        return;
      }

      if (mockups && mockups.length > 0) {
        const mockupPaths = mockups.map(mockup => mockup.path);
        const { error: mockupStorageError } = await supabase.storage
          .from('designs')
          .remove(mockupPaths);

        if (mockupStorageError) {
          console.error('Error deleting mockup files:', mockupStorageError);
          toast.error('Failed to delete mockup files');
          return;
        }

        // Delete mockups from database
        const { error: mockupDbError } = await supabase
          .from('design_mockups')
          .delete()
          .eq('design_id', listing.id);

        if (mockupDbError) {
          console.error('Error deleting mockups:', mockupDbError);
          toast.error('Failed to delete mockups from database');
          return;
        }
      }

      // Delete the design
      const { error: deleteError } = await supabase
        .from('designs')
        .delete()
        .eq('id', listing.id);

      if (deleteError) {
        console.error('Error deleting design:', deleteError);
        toast.error(deleteError.message || 'Failed to delete design');
        return;
      }

      toast.success('Design deleted successfully');
      navigate('/dashboard/seller');
    } catch (error) {
      console.error('Error deleting design:', error);
      toast.error('Failed to delete design. Please try again.');
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
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            value={listing.name}
            onChange={(e) => setListing({ ...listing, name: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">File Type</label>
          <select
            value={listing.file_type}
            onChange={(e) => setListing({ ...listing, file_type: e.target.value as 'image' | 'font' | 'template' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select file type</option>
            <option value="image">Image</option>
            <option value="font">Font</option>
            <option value="template">Template</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Freebie</label>
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={listing.is_freebie}
                onChange={(e) => setListing({ ...listing, is_freebie: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Is this a freebie?</span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            value={listing.description || ''}
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
              value={listing.price || ''}
              onChange={(e) => setListing({ ...listing, price: e.target.value ? parseFloat(e.target.value) : 0 })}
              className="flex-1 block w-full rounded-none rounded-r-md min-w-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={listing.category}
            onChange={(e) => setListing({ ...listing, category: e.target.value as 'Fonts' | 'Logos' | 'Templates' | 'Icons' | 'UI Kits' | 'Freebies' })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="">Select category</option>
            <option value="Fonts">Fonts</option>
            <option value="Logos">Logos</option>
            <option value="Templates">Templates</option>
            <option value="Icons">Icons</option>
            <option value="UI Kits">UI Kits</option>
            <option value="Freebies">Freebies</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tags</label>
          <input
            type="text"
            value={listing.tags?.join(', ') || ''}
            onChange={(e) => setListing({ ...listing, tags: e.target.value ? e.target.value.split(',').map(tag => tag.trim()) : undefined })}
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPreviewImage(file);
                      }
                    }}
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
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
