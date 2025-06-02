import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';
import { Info } from 'lucide-react';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_DESIGN_TYPES: Record<string, { extensions: string[], mimeTypes: string[] }> = {
  'SVGs': { 
    extensions: ['.svg', '.zip'],
    mimeTypes: ['image/svg+xml', 'application/zip']
  },
  'POD': {
    extensions: ['.png', '.jpg', '.jpeg', '.svg', '.zip'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/svg+xml', 'application/zip']
  },
  'Images': { 
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.zip'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'application/zip']
  },
  'Fonts': { 
    extensions: ['.ttf', '.otf', '.woff', '.woff2', '.zip'],
    mimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2', 'application/zip']
  },
  'Templates': { 
    extensions: ['.zip', '.psd', '.ai', '.pdf'],
    mimeTypes: ['application/zip', 'application/psd', 'application/illustrator', 'application/pdf']
  },
  'Logos': { 
    extensions: ['.svg', '.png', '.ai', '.psd', '.zip'],
    mimeTypes: ['image/svg+xml', 'image/png', 'application/illustrator', 'application/psd', 'application/zip']
  },
  'Icons': { 
    extensions: ['.svg', '.png', '.zip'],
    mimeTypes: ['image/svg+xml', 'image/png', 'application/zip']
  },
  'UI Kits': { 
    extensions: ['.zip', '.sketch', '.fig', '.xd'],
    mimeTypes: ['application/zip', 'application/sketch', 'application/fig', 'application/xd']
  },
  'Bundles': { 
    extensions: ['.zip', '.rar', '.7z'],
    mimeTypes: ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed']
  },
  'Laser Cutting': { 
    extensions: ['.svg', '.dxf', '.ai', '.eps', '.pdf', '.zip'],
    mimeTypes: ['image/svg+xml', 'application/dxf', 'application/illustrator', 'application/postscript', 'application/pdf', 'application/zip']
  },
  'Sublimation': { 
    extensions: ['.png', '.psd', '.tif', '.tiff'],
    mimeTypes: ['image/png', 'application/psd', 'image/tiff']
  }
};



export default function Upload() {

  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<any>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<keyof typeof ALLOWED_DESIGN_TYPES>('SVGs');
  const [price, setPrice] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [mockupPreviews, setMockupPreviews] = useState<string[]>([]);
  const [freeDownload, setFreeDownload] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'active' | 'inactive' | 'draft'>('active');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: Implement upload logic
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag));
  };

  const onDropMockups = (acceptedFiles: File[]) => {
    setMockupFiles([...mockupFiles, ...acceptedFiles]);
  };

  const {
    getRootProps: getMockupRootProps,
    getInputProps: getMockupInputProps,
    isDragActive: isMockupDragActive
  } = useDropzone({
    onDrop: onDropMockups,
    accept: {
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/gif': ['.gif'],
      'image/webp': ['.webp']
    },
    multiple: true
  });

  const dropzone = (
    <div>
      <div
        {...getMockupRootProps()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition bg-gray-50 hover:bg-blue-50 ${isMockupDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300'}`}
      >
        <input {...getMockupInputProps()} />
        <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-blue-400 mb-2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 6l-4-4m0 0L8 6m4-4v14" />
        </svg>
        <p className="text-gray-700 text-sm font-medium">
          {isMockupDragActive ? 'Drop the images here...' : 'Drag & drop mockup images here, or click to select'}
        </p>
        <p className="text-xs text-gray-400 mt-1">PNG, JPG, JPEG, GIF, WEBP • Multiple files supported</p>
      </div>
      {mockupFiles.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-4">
          {mockupFiles.map((file, idx) => (
            <div key={file.name} className="relative w-28 h-28 flex flex-col items-center justify-center group">
              <img
                src={mockupPreviews[idx]}
                alt={file.name}
                className="object-cover w-24 h-24 rounded-lg border border-gray-300 shadow-sm group-hover:opacity-80 transition"
              />
              <button
                type="button"
                className="absolute top-0 right-0 bg-white bg-opacity-90 text-red-600 rounded-full px-2 py-1 text-xs font-bold hover:bg-red-100 shadow"
                onClick={() => {
                  setMockupFiles(mockupFiles.filter((_, i) => i !== idx));
                }}
                title="Remove"
              >
                ×
              </button>
              <span className="text-xs mt-1 truncate w-full text-center">{file.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  useEffect(() => {
    if (mockupFiles.length > 0) {
      const urls = mockupFiles.map(file => URL.createObjectURL(file));
      setMockupPreviews(urls);
      return () => {
        urls.forEach(url => URL.revokeObjectURL(url));
      };
    } else {
      setMockupPreviews([]);
    }
  }, [mockupFiles]);

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
  }, [user]);

  const validateFiles = (files: File[], type: 'design' | 'mockup'): string[] => {
    const errors: string[] = [];

    if (files.length === 0) {
      errors.push(`Please upload at least one ${type} file`);
    }

    files.forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`File "${file.name}" exceeds the 50MB size limit`);
      }

      // Check file types for design files
      if (type === 'design') {
        const { extensions: allowedExtensions } = ALLOWED_DESIGN_TYPES[category];
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!allowedExtensions.map(ext => ext.toLowerCase()).includes(fileExtension)) {
          errors.push(`File "${file.name}" is not a valid ${category.toLowerCase()} file type. Allowed types: ${allowedExtensions.join(', ')}`);
        }
      }

      // Check mockup file types (only allow images)
      if (type === 'mockup') {
        const allowedMockupExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        if (!file.type.startsWith('image/') || !allowedMockupExtensions.includes(fileExtension)) {
          errors.push(`File "${file.name}" is not a valid image file. Allowed types: .png, .jpg, .jpeg, .gif, .webp`);
        }
      }
    });

    return errors;
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!name.trim()) {
      errors.push('Design name is required');
    }

    if (!description.trim()) {
      errors.push('Description is required');
    }

    // Validate files
    if (designFiles.length === 0) {
      errors.push('You must upload at least one design file.');
    }
    const designErrors = validateFiles(designFiles, 'design');
    const mockupErrors = validateFiles(mockupFiles, 'mockup');
    errors.push(...designErrors, ...mockupErrors);

    // Validate price if set
    if (price !== null && price < 0) {
      errors.push('Price cannot be negative');
    }

    return errors;
  };

  const { getRootProps: getDesignRootProps, getInputProps: getDesignInputProps } = useDropzone({
    onDrop: () => {},
    accept: Object.fromEntries(
      ALLOWED_DESIGN_TYPES[category].mimeTypes.map(mimeType => [mimeType, []])
    ),
    maxSize: MAX_FILE_SIZE,
  });

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

  const uploadDesignFile = async (file: File, prefix: string, designId: string): Promise<{ filePath: string }> => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to upload files');
      }

      const fileExt = file.name.split('.').pop() || '';
      const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      const safeFileName = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const filePath = `designs/${designId}/${prefix}_${safeFileName}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Failed to upload ${prefix} file: ${uploadError.message}`);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(filePath);

      return { filePath };
    } catch (error) {
      console.error('Error uploading design file:', error);
      throw error;
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="font-medium">Design Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
              className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Description:</label>
            <textarea
              value={description}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
              className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Category:</label>
            <select
              value={category}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value as keyof typeof ALLOWED_DESIGN_TYPES)}
              className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(ALLOWED_DESIGN_TYPES).map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Price:</label>
            <input
              type="number"
              value={price ?? ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPrice(e.target.value === '' ? null : Number(e.target.value))}
              className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Tags:</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value)}
              onKeyDown={handleAddTag}
              className="w-full p-4 rounded-lg border border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex flex-wrap gap-2">
              {tags.map(tag => (
                <span key={tag} className="bg-gray-200 p-2 rounded-lg">{tag} <button type="button" onClick={() => removeTag(tag)}>×</button></span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Design Files:</label>
            <div {...getDesignRootProps()} className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 cursor-pointer transition bg-gray-50 hover:bg-blue-50">
              <input {...getDesignInputProps()} />
              <svg width="36" height="36" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" className="text-blue-400 mb-2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M16 6l-4-4m0 0L8 6m4-4v14" />
              </svg>
              <p className="text-gray-700 text-sm font-medium">Drag & drop design files here, or click to select</p>
              <p className="text-xs text-gray-400 mt-1">Allowed types: {ALLOWED_DESIGN_TYPES[category].extensions.join(', ')}</p>
            </div>
            {designFiles.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-4">
                {designFiles.map((file, idx) => (
                  <div key={file.name} className="relative w-28 h-28 flex flex-col items-center justify-center group">
                    <span className="text-xs">{file.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Mockup Files:</label>
            {dropzone}
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-medium">Status:</label>
            <button
              type="button"
              className={`px-4 py-2 rounded-lg border font-semibold transition ${status === 'active' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-gray-100 text-gray-600 border-gray-300'}`}
              onClick={() => setStatus(status === 'active' ? 'inactive' : 'active')}
            >
              {status === 'active' ? 'Active' : 'Inactive'}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-400 transition"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition disabled:opacity-60"
              disabled={loading}
            >
              {loading ? 'Uploading...' : 'Upload Design'}
            </button>
          </div>
            type="button"
            className="bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold shadow hover:bg-gray-400 transition"
          >
            Save as Draft
          </button>
          {/* Main Upload Button */}
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-500 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold shadow hover:from-blue-600 hover:to-blue-800 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? 'Uploading...' : 'Upload Design'}
          </button>
        </div>
      </div>
    </form>
  </div>
);