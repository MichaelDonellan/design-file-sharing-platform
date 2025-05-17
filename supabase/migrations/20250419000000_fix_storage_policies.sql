/*
  # Fix storage policies for designs bucket

  1. Changes
    - Remove folder name restriction from storage policies
    - Make policies more permissive for authenticated users
    - Ensure public access for reading files
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create new policies
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'designs');

CREATE POLICY "Users can update their own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'designs');

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'designs');

-- Update bucket configuration
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/vnd.ms-fontobject',
    'application/font-woff',
    'application/font-woff2',
    'application/zip',
    'application/x-zip-compressed'
  ]
WHERE id = 'designs'; 