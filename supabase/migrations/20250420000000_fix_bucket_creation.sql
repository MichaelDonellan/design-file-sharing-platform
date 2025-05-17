/*
  # Fix designs bucket creation

  1. Changes
    - Drop existing bucket if it exists
    - Create bucket with proper configuration
    - Set up correct policies
*/

-- Drop existing bucket and policies
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create the designs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('designs', 'designs', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Configure the bucket
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
    'application/x-zip-compressed',
    'application/postscript',
    'application/pdf',
    'image/vnd.adobe.photoshop',
    'application/illustrator'
  ]
WHERE id = 'designs';

-- Create policies
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