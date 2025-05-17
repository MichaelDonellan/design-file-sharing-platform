-- Drop existing bucket if it exists
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Create the storage bucket with all settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'designs',
  'designs',
  true,
  52428800, -- 50MB file size limit
  ARRAY[
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
) ON CONFLICT (id) DO UPDATE
SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Set up security policies
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'designs');

CREATE POLICY "Authenticated users can upload files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'designs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'designs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'designs' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ); 