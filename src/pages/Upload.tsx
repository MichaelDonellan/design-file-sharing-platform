import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload as UploadIcon, X } from 'lucide-react';
import type { Store } from '../types';

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<'Fonts' | 'Logos' | 'Templates' | 'Icons' | 'UI Kits'>('Templates');
  const [price, setPrice] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function checkStore() {
      if (!user) return;

      const { data: storeData } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!storeData) {
        navigate('/dashboard/settings');
      } else {
        setStore(storeData);
      }
    }

    checkStore();
  }, [user, navigate]);

  const { getRootProps: getDesignRootProps, getInputProps: getDesignInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setDesignFiles((prev) => [...prev, ...acceptedFiles]);
    },
  });

  const { getRootProps: getMockupRootProps, getInputProps: getMockupInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      setMockupFiles((prev) => [...prev, ...acceptedFiles]);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
  });

  const removeDesignFile = (index: number) => {
    setDesignFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeMockupFile = (index: number) => {
    setMockupFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const getFileType = (category: string): 'image' | 'font' | 'template' => {
    switch (category) {
      case 'Fonts':
        return 'font';
      case 'Templates':
      case 'UI Kits':
        return 'template';
      case 'Logos':
      case 'Icons':
      default:
        return 'image';
    }
  };

  const uploadFile = async (file: File, prefix: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).slice(2)}.${fileExt}`;
      const filePath = `${user!.id}/${prefix}_${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('designs')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        throw new Error(`Failed to upload ${prefix} file: ${uploadError.message}`);
      }

      if (!data?.path) {
        throw new Error(`No path returned for uploaded ${prefix} file`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(data.path);

      if (!publicUrl) {
        throw new Error(`Failed to get public URL for ${prefix} file`);
      }

      return publicUrl;
    } catch (error) {
      console.error(`Error in uploadFile (${prefix}):`, error);
      throw error;
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !store || designFiles.length === 0 || mockupFiles.length === 0) {
      setError('Please provide all required files');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Upload the first design file and mockup to get their paths
      const firstDesignFile = await uploadFile(designFiles[0], 'design');
      const firstMockupFile = await uploadFile(mockupFiles[0], 'mockup');

      // Insert design record first
      const { data: design, error: designError } = await supabase
        .from('designs')
        .insert({
          name,
          description,
          category,
          user_id: user.id,
          store_id: store.id,
          file_type: getFileType(category),
          file_path: firstDesignFile,
          mockup_path: firstMockupFile,
          price: price || 0,
          currency: 'USD',
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single();

      if (designError) {
        console.error('Error creating design record:', designError);
        throw new Error(`Failed to create design: ${designError.message}`);
      }

      if (!design) {
        throw new Error('No design data returned after creation');
      }

      // Upload remaining design files
      const designUploads = await Promise.all(
        designFiles.slice(1).map(async (file, index) => {
          const publicUrl = await uploadFile(file, 'design');
          return {
            design_id: design.id,
            file_path: publicUrl,
            file_type: getFileType(category),
            display_order: index + 1,
          };
        })
      );

      // Upload remaining mockup files
      const mockupUploads = await Promise.all(
        mockupFiles.slice(1).map(async (file, index) => {
          const publicUrl = await uploadFile(file, 'mockup');
          return {
            design_id: design.id,
            mockup_path: publicUrl,
            display_order: index + 1,
          };
        })
      );

      // Insert file records
      if (designUploads.length > 0) {
        const { error: filesError } = await supabase
          .from('design_files')
          .insert(designUploads);

        if (filesError) {
          console.error('Error inserting design files:', filesError);
          throw new Error(`Failed to save design files: ${filesError.message}`);
        }
      }

      if (mockupUploads.length > 0) {
        const { error: mockupsError } = await supabase
          .from('design_mockups')
          .insert(mockupUploads);

        if (mockupsError) {
          console.error('Error inserting mockups:', mockupsError);
          throw new Error(`Failed to save mockups: ${mockupsError.message}`);
        }
      }

      navigate(`/design/${design.id}`);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      setError(err instanceof Error ? err.message : 'Failed to upload design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Upload Design</h1>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 text-red-600 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Design Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Price (USD)
          </label>
          <input
            type="number"
            value={price || ''}
            onChange={(e) => setPrice(e.target.value ? Number(e.target.value) : null)}
            min="0"
            step="0.01"
            placeholder="0.00 (Free)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-1 text-sm text-gray-500">Leave empty or set to 0 for free download</p>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="Templates">Templates</option>
            <option value="Fonts">Fonts</option>
            <option value="Logos">Logos</option>
            <option value="Icons">Icons</option>
            <option value="UI Kits">UI Kits</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Tags
          </label>
          <div className="space-y-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              placeholder="Add tags (press Enter to add)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center px-2 py-1 rounded-md bg-blue-100 text-blue-800 text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
            <p className="text-sm text-gray-500">Add relevant tags to help users find your design</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Design Files
          </label>
          <div
            {...getDesignRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors"
          >
            <input {...getDesignInputProps()} />
            <p className="text-gray-600">
              Drag and drop design files here, or click to select files
            </p>
          </div>
          {designFiles.length > 0 && (
            <ul className="mt-4 space-y-2">
              {designFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDesignFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mb-6">
          <label className="block text-gray-700 font-medium mb-2">
            Mockup Images
          </label>
          <div
            {...getMockupRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors"
          >
            <input {...getMockupInputProps()} />
            <p className="text-gray-600">
              Drag and drop mockup images here, or click to select files
            </p>
          </div>
          {mockupFiles.length > 0 && (
            <ul className="mt-4 space-y-2">
              {mockupFiles.map((file, index) => (
                <li
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => removeMockupFile(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <button
          type="submit"
          disabled={loading || designFiles.length === 0 || mockupFiles.length === 0}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <UploadIcon size={20} />
          <span>{loading ? 'Uploading...' : 'Upload Design'}</span>
        </button>
      </form>
    </div>
  );
}