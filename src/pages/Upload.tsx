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
    extensions: ['.svg'],
    mimeTypes: ['image/svg+xml']
  },
  'Images': { 
    extensions: ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
    mimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp']
  },
  'Fonts': { 
    extensions: ['.ttf', '.otf', '.woff', '.woff2'],
    mimeTypes: ['font/ttf', 'font/otf', 'font/woff', 'font/woff2']
  },
  'Templates': { 
    extensions: ['.zip', '.psd', '.ai', '.pdf'],
    mimeTypes: ['application/zip', 'application/psd', 'application/illustrator', 'application/pdf']
  },
  'Logos': { 
    extensions: ['.svg', '.png', '.ai', '.psd'],
    mimeTypes: ['image/svg+xml', 'image/png', 'application/illustrator', 'application/psd']
  },
  'Icons': { 
    extensions: ['.svg', '.png'],
    mimeTypes: ['image/svg+xml', 'image/png']
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
    extensions: ['.svg', '.dxf', '.ai', '.eps', '.pdf'],
    mimeTypes: ['image/svg+xml', 'application/dxf', 'application/illustrator', 'application/postscript', 'application/pdf']
  },
  'Sublimation': { 
    extensions: ['.png', '.psd', '.tif', '.tiff'],
    mimeTypes: ['image/png', 'application/psd', 'image/tiff']
  }
};



export default function Upload() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [store, setStore] = useState<Store | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<keyof typeof ALLOWED_DESIGN_TYPES>('SVGs');
  const [price, setPrice] = useState<number | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [designFiles, setDesignFiles] = useState<File[]>([]);
  const [mockupFiles, setMockupFiles] = useState<File[]>([]);
  const [freeDownload, setFreeDownload] = useState(false);
  const [loading, setLoading] = useState(false);

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

  // Category change handler
  // Subcategory functionality removed

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
        
        if (!allowedExtensions.includes(fileExtension)) {
          errors.push(`File "${file.name}" is not a valid ${category.toLowerCase()} file type. Allowed types: ${allowedExtensions.join(', ')}`);
        }
      }

      // Check mockup file types
      if (type === 'mockup' && !file.type.startsWith('image/')) {
        errors.push(`File "${file.name}" is not a valid image file`);
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
      errors.push({ field: 'description', message: 'Description is required' });
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
    onDrop: () => {},
    accept: Object.fromEntries(
      ALLOWED_DESIGN_TYPES[category].mimeTypes.map(mimeType => [mimeType, []])
    ),
    maxSize: MAX_FILE_SIZE,
  });

  const { getRootProps: getMockupRootProps, getInputProps: getMockupInputProps } = useDropzone({
    onDrop: () => {},
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
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
      toast.error(errors.join('\n'));
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
          const { filePath } = await uploadDesignFile(file, 'mockup', designId);
          return {
            mockup_path: filePath,
            display_order: index
          };
        })
      );

      const { data: design, error: designError } = await supabase
        .from('designs')
        .insert({
          id: designId, // Use our pre-generated ID
          name,
          description,
          category,
          user_id: user.id,
          store_id: store.id,
          file_type: getFileType(category),
          price: freeDownload ? 0 : price,
          currency: store.currency || 'USD',
          tags: tags.length > 0 ? tags : null,
          free_download: freeDownload,
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
              <span className="font-medium">Design files</span>: {ALLOWED_DESIGN_TYPES[category].extensions.join(', ')}
            </li>
            <li>
              <span className="font-medium">Mockup images</span>: .png, .jpg, .jpeg, .gif, .webp
            </li>
            <li>
              <span className="font-medium">Max file size</span>: 50MB per file
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}