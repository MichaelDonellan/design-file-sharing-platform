import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Design } from '../../types';
import { supabase } from '../../lib/supabase';

// Category options constant
export const CATEGORIES = [
  'SVGs',
  'Images',
  'Fonts',
  'Bundles',
  'Templates',
  'Laser Cutting',
  'Sublimation',
  'POD',
] as const;

type CategoryType = typeof CATEGORIES[number];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Design | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewImage, setPreviewImage] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [existingFiles, setExistingFiles] = useState<any[]>([]);
  const [existingMockups, setExistingMockups] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;

    fetchListing();
  }, [id]);

  // Fetch existing files and mockups
  useEffect(() => {
    const fetchExistingFiles = async () => {
      try {
        if (!listing?.id) return;

        // Fetch existing files
        const { data: files, error: filesError } = await supabase
          .from('design_files')
          .select('*')
          .eq('design_id', listing.id);

        if (filesError) {
          console.error('Error fetching existing files:', filesError);
          return;
        }

        setExistingFiles(files || []);

        // Fetch existing mockups
        const { data: mockups, error: mockupsError } = await supabase
          .from('design_mockups')
          .select('*')
          .eq('design_id', listing.id);

        if (mockupsError) {
          console.error('Error fetching existing mockups:', mockupsError);
          return;
        }

        setExistingMockups(mockups || []);
      } catch (error) {
        console.error('Error fetching existing files and mockups:', error);
      }
    };

    if (listing?.id) {
      fetchExistingFiles();
    }
  }, [listing]);



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

  const handleDeleteFile = async (fileId: string) => {
    if (!listing) {
      toast.error('Design not found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this file? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('designs')
        .remove([`files/${listing.id}/${fileId}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('design_files')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      // Update local state
      setExistingFiles(existingFiles.filter(file => file.id !== fileId));
      toast.success('File deleted successfully');
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    }
  };

  const handleDeleteMockup = async (mockupId: string) => {
    if (!listing) {
      toast.error('Design not found');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this mockup? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('designs')
        .remove([`mockups/${mockupId}`]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('design_mockups')
        .delete()
        .eq('id', mockupId);

      if (dbError) throw dbError;

      // Update local state
      setExistingMockups(existingMockups.filter(mockup => mockup.id !== mockupId));
      toast.success('Mockup deleted successfully');
    } catch (error) {
      console.error('Error deleting mockup:', error);
      toast.error('Failed to delete mockup');
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
          free_download: listing.free_download,
          category: listing.category,
          tags: listing.tags,

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
          <label className="block text-sm font-medium text-gray-700">Free Download</label>
          <div className="mt-1">
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                checked={!!listing.free_download}
                onChange={e => setListing({ ...listing, free_download: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm">Is this a free download?</span>
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
              className={`flex-1 block w-full rounded-none rounded-r-md min-w-0 border-gray-300 focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${listing.free_download ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              required={!listing.free_download}
              disabled={listing.free_download}
            />
          </div>
        </div>

        <div className="mb-4">
          <label htmlFor="category" className="block text-sm font-medium text-gray-700">
            Category
          </label>
          <select
            id="category"
            name="category"
            value={listing?.category || ''}
            onChange={e => setListing(listing ? { ...listing, category: e.target.value as typeof CATEGORIES[number] } : null)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            required
          >
            <option value="" disabled>Select a category</option>
            {CATEGORIES.map((cat: CategoryType) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
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
              {/* Preview for selected image */}
              {previewImage && (
                <div className="mt-4 flex flex-col items-center">
                  <img
                    src={URL.createObjectURL(previewImage)}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded shadow border"
                  />
                  <button
                    type="button"
                    onClick={() => setPreviewImage(null)}
                    className="mt-2 text-red-500 hover:text-red-700 text-xs"
                  >
                    Remove
                  </button>
                </div>
              )}
              {/* Show existing preview image if available and no new image selected */}
              {!previewImage && listing?.thumbnail_url && (
                <div className="mt-4 flex flex-col items-center">
                  <img
                    src={listing.thumbnail_url}
                    alt="Current Preview"
                    className="w-32 h-32 object-cover rounded shadow border"
                  />
                  <span className="mt-2 text-gray-400 text-xs">Current Preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Existing Files</label>
          <div className="mt-1 space-y-2">
            {existingFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{file.path}</p>
                </div>
                <button
                  onClick={() => handleDeleteFile(file.id)}
                  className="text-red-600 hover:text-red-900"
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Existing Mockups</label>
          <div className="mt-1 grid grid-cols-2 md:grid-cols-3 gap-4">
            {existingMockups.map((mockup, index) => (
              <div key={index} className="relative">
                <img
                  src={`https://storage.supabase.co/v1/object/public/designs/${mockup.path}`}
                  alt={mockup.name}
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  onClick={() => handleDeleteMockup(mockup.id)}
                  className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-full hover:bg-red-600"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Add New Files</label>
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
                    onChange={(e) => {
                      const selectedFiles = Array.from(e.target.files || []);
                      setFiles(selectedFiles);
                    }}
                    className="sr-only"
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">ZIP, PSD, AI, PDF up to 100MB</p>
              {/* Preview for selected design files */}
              {files.length > 0 && (
                <div className="mt-4 flex flex-col items-center space-y-2">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span className="text-xs text-gray-700">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-700 text-xs"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
