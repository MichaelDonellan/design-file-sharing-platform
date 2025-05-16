-- Create storage bucket for store profile images
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-profiles', 'store-profiles', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Set up storage policies for store profile images
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'store-profiles');

CREATE POLICY "Authenticated users can upload store profile images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own store profile images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own store profile images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-profiles' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ); 