import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload as UploadIcon, X, AlertCircle, Info } from 'lucide-react';
import type { Store } from '../types';
import { CATEGORIES } from '../types';
import { toast } from 'react-hot-toast';
import { v4 as uuidv4 } from 'uuid';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_DESIGN_TYPES: Record<string, string[]> = {
  'SVGs': ['.svg'],
  'Images': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
  'Fonts': ['.ttf', '.otf', '.woff', '.woff2'],
  'Templates': ['.zip', '.psd', '.ai', '.pdf'],
  'Logos': ['.svg', '.png', '.ai', '.psd'],
  'Icons': ['.svg', '.png'],
  'UI Kits': ['.zip', '.sketch', '.fig', '.xd'],
  'Bundles': ['.zip', '.rar', '.7z'],
  'Laser Cutting': ['.svg', '.dxf', '.ai', '.eps', '.pdf'],
  'Sublimation': ['.png', '.psd', '.tif', '.tiff']
};

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: ValidationError[];
}

function ValidationModal({ isOpen, onClose, errors }: ValidationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-red-600">
            <AlertCircle className="w-6 h-6 mr-2" />
            <h3 className="text-lg font-semibold">Validation Errors</h3>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start text-red-600">
              <Info className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" />
              <p>{error.message}</p>
            </div>
          ))}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<keyof typeof ALLOWED_DESIGN_TYPES>('SVGs');
  // No subcategories for new categories
  // const [subcategory, setSubcategory] = useState<string>('');
  const [price, setPrice] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [showValidationModal, setShowValidationModal] = useState(false);

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

  // Reset subcategory when category changes
  useEffect(() => {
    // setSubcategory('');
  }, [category]);

  const validateFiles = (files: File[], type: 'design' | 'mockup'): ValidationError[] => {
    const errors: ValidationError[] = [];

    if (files.length === 0) {
      errors.push({
        field: type,
        message: `Please upload at least one ${type} file`
      });
      return errors;
    }

    files.forEach((file) => {
      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push({
          field: type,
          message: `File "${file.name}" exceeds the 50MB size limit`
        });
      }

      // Check file types for design files
      if (type === 'design') {
        const allowedExtensions = ALLOWED_DESIGN_TYPES[category];
        const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
        
        if (!allowedExtensions.includes(fileExtension)) {
          errors.push({
            field: type,
            message: `File "${file.name}" is not a valid ${category.toLowerCase()} file type. Allowed types: ${allowedExtensions.join(', ')}`
          });
        }
      }

      // Check mockup file types
      if (type === 'mockup' && !file.type.startsWith('image/')) {
        errors.push({
          field: type,
          message: `File "${file.name}" is not a valid image file`
        });
      }
    });

    return errors;
  };

  const validateForm = (): ValidationError[] => {
    const errors: ValidationError[] = [];

    // Required fields
    if (!name.trim()) {
      errors.push({ field: 'name', message: 'Design name is required' });
    }

    if (!description.trim()) {
      errors.push({ field: 'description', message: 'Description is required' });
    }

    if (!subcategory) {
      errors.push({ field: 'subcategory', message: 'Please select a subcategory' });
    }

    // Validate files
    const designErrors = validateFiles(designFiles, 'design');
    const mockupErrors = validateFiles(mockupFiles, 'mockup');
    errors.push(...designErrors, ...mockupErrors);

    // Validate price if set
    if (price !== null && price < 0) {
      errors.push({ field: 'price', message: 'Price cannot be negative' });
    }

    return errors;
  };

  const { getRootProps: getDesignRootProps, getInputProps: getDesignInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const errors = validateFiles(acceptedFiles, 'design');
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }
      setDesignFiles((prev) => [...prev, ...acceptedFiles]);
    },
    accept: {
      [ALLOWED_DESIGN_TYPES[category].join(',').replace(/\./g, '')]: ALLOWED_DESIGN_TYPES[category]
    },
    maxSize: MAX_FILE_SIZE,
  });

  const { getRootProps: getMockupRootProps, getInputProps: getMockupInputProps } = useDropzone({
    onDrop: (acceptedFiles) => {
      const errors = validateFiles(acceptedFiles, 'mockup');
      if (errors.length > 0) {
        setValidationErrors(errors);
        setShowValidationModal(true);
        return;
      }
      setMockupFiles((prev) => [...prev, ...acceptedFiles]);
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxSize: MAX_FILE_SIZE,
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

  const uploadDesignFile = async (file: File, prefix: string, designId: string): Promise<{ filePath: string }> => {
    try {
      if (!user) {
        throw new Error('User must be authenticated to upload files');
      }

      // Create a standardized path for the file
      const fileExt = file.name.split('.').pop() || '';
      const baseName = file.name.includes('.') ? file.name.substring(0, file.name.lastIndexOf('.')) : file.name;
      const safeFileName = baseName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const filePath = `designs/${designId}/${prefix}_${safeFileName}.${fileExt}`;
      
      console.log(`Uploading file to standardized path: ${filePath}`);

      const { error: uploadError } = await supabase.storage
        .from('designs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true // Allow overwriting if file exists
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw new Error(`Failed to upload ${prefix} file: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', filePath);

      // Get the public URL if needed
      const { data: { publicUrl } } = supabase.storage
        .from('designs')
        .getPublicUrl(filePath);

      console.log('Generated public URL:', publicUrl);
      return { filePath };
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
    
    const errors = validateForm();
    if (errors.length > 0) {
      setValidationErrors(errors);
      setShowValidationModal(true);
      return;
    }

    if (!user || !store) {
      toast.error('Please sign in and create a store first');
      return;
    }

    setLoading(true);

    try {
      // Pre-generate the design ID so we can use it in file paths
      const designId = uuidv4();
      console.log('Created new design ID for uploads:', designId);
      
      // Upload all design files first
      const designFileUploads = await Promise.all(
        designFiles.map(async (file, index) => {
          // Upload using our standardized naming convention
          const { filePath } = await uploadDesignFile(file, 'design', designId);
          
          return {
            file_path: filePath,
            file_type: getFileType(category),
            display_order: index
          };
        })
      );

      // Upload all mockup files
      const mockupFileUploads = await Promise.all(
        mockupFiles.map(async (file, index) => {
          // Upload mockup files with mockup prefix
          const { filePath } = await uploadDesignFile(file, 'mockup', designId);
          
          return {
            mockup_path: filePath,
            display_order: index
          };
        })
      );

      // Insert design record with our pre-generated ID
      const { data: design, error: designError } = await supabase
        .from('designs')
        .insert({
          id: designId, // Use our pre-generated ID
          name,
          description,
          category,
          subcategory,
          user_id: user.id,
          store_id: store.id,
          file_type: getFileType(category),
          price: price || 0,
          currency: store.currency || 'USD',
          tags: tags.length > 0 ? tags : null,
          is_free_download: !price || price === 0,
        })
        .select()
        .single();

      if (designError) throw designError;

      // Insert design files
      const { error: filesError } = await supabase
        .from('design_files')
        .insert(
          designFileUploads.map(file => ({
            design_id: design.id,
            ...file
          }))
        );

      if (filesError) throw filesError;

      // Insert mockup files
      const { error: mockupsError } = await supabase
        .from('design_mockups')
        .insert(
          mockupFileUploads.map(file => ({
            design_id: design.id,
            ...file
          }))
        );

      if (mockupsError) throw mockupsError;

      // Notify admin about new pending listing
      const { error: notifyError } = await supabase
        .from('notifications')
        .insert({
          type: 'new_listing',
          message: `New listing pending approval: ${name}`,
          design_id: design.id,
          created_at: new Date().toISOString()
        });

      if (notifyError) {
        console.error('Failed to create notification:', notifyError);
      }

      toast.success('Design uploaded successfully! It will be reviewed by an admin.');
      navigate(`/design/${design.id}`);
    } catch (err) {
      console.error('Error in handleSubmit:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to upload design');
    } finally {
      setLoading(false);
    }
  };

  if (!store) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Upload Design</h1>
      
      {/* Info Alert for file types and size */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded flex items-start space-x-3">
        <Info className="w-6 h-6 text-blue-500 mt-1" />
        <div className="text-blue-800 text-sm">
          <div className="mb-1 font-semibold">Upload Requirements:</div>
          <ul className="list-disc ml-5">
            <li>
              <span className="font-medium">Design files</span>: {ALLOWED_DESIGN_TYPES[category].join(', ')}
            </li>
            <li>
              <span className="font-medium">Mockup images</span>: .png, .jpg, .jpeg, .gif
            </li>
            <li>
              <span className="font-medium">Max file size</span>: 50MB per file
            </li>
          </ul>
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Design Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a descriptive name for your design"
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Description *
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your design and its features"
          />
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Category *
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as typeof category)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.keys(CATEGORIES).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Subcategory *
            </label>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a subcategory</option>
              {CATEGORIES[category].map((subcat) => (
                <option key={subcat} value={subcat}>{subcat}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 font-medium mb-2">
            Price ({store.currency || 'USD'})
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
            Design Files *
          </label>
          <div
            {...getDesignRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors"
          >
            <input {...getDesignInputProps()} />
            <p className="text-gray-600">
              Drag and drop design files here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Allowed file types: {ALLOWED_DESIGN_TYPES[category].join(', ')}<br />
              <span className="text-xs">Max file size: 50MB per file</span>
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
            Mockup Images *
          </label>
          <div
            {...getMockupRootProps()}
            className="border-2 border-dashed border-gray-300 rounded-md p-6 text-center hover:border-blue-500 transition-colors"
          >
            <input {...getMockupInputProps()} />
            <p className="text-gray-600">
              Drag and drop mockup images here, or click to select files
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Allowed file types: PNG, JPG, JPEG, GIF<br />
              <span className="text-xs">Max file size: 50MB per file</span>
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
          disabled={loading}
          className="w-full bg-blue-500 text-white px-6 py-3 rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
        >
          <UploadIcon size={20} />
          <span>{loading ? 'Uploading...' : 'Upload Design'}</span>
        </button>
      </form>

      <ValidationModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={validationErrors}
      />
    </div>
  );
}