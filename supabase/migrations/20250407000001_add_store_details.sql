-- Add new columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS store_url text UNIQUE,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'USD',
ADD COLUMN IF NOT EXISTS payout_method text CHECK (payout_method IN ('bank', 'paypal')),
ADD COLUMN IF NOT EXISTS bank_details jsonb,
ADD COLUMN IF NOT EXISTS paypal_email text;

-- Create index for store_url
CREATE INDEX IF NOT EXISTS idx_stores_store_url ON stores(store_url);

-- Create storage bucket for store avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('store-avatars', 'store-avatars', true)
ON CONFLICT (id) DO UPDATE
SET public = true;

-- Set up storage policies for store avatars
CREATE POLICY "Public Access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'store-avatars');

CREATE POLICY "Authenticated users can upload store avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'store-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own store avatars"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'store-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own store avatars"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'store-avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  ); 