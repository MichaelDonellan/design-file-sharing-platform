-- POLICY: Allow download for free products and for users who have purchased the product
-- This policy assumes you have a `designs` table with `id`, `price`, and a `purchases` table with `user_id` and `design_id`.

-- Allow download for free products (price is null or 0)
CREATE POLICY "Allow free downloads" ON storage.objects
FOR SELECT USING (
  bucket_id = 'designs'
  AND (
    (
      EXISTS (
        SELECT 1 FROM designs 
        WHERE designs.id = RIGHT(name, LENGTH(name) - POSITION('/' IN name))
        AND (designs.price IS NULL OR designs.price = 0)
      )
    )
    OR (
      auth.role() = 'authenticated' AND (
        EXISTS (
          SELECT 1 FROM purchases 
          WHERE purchases.user_id = auth.uid() 
          AND purchases.design_id = RIGHT(name, LENGTH(name) - POSITION('/' IN name))
        )
      )
    )
  )
);

-- Note: You may need to adjust the logic for extracting the design id from the object name/path depending on your storage structure.
-- Apply this SQL in your Supabase SQL Editor.
