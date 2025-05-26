-- Backfill purchases table with existing downloads
-- This migration ensures all existing downloads are tracked in the purchases table

-- Create a function to backfill downloads as purchases
CREATE OR REPLACE FUNCTION backfill_downloads_to_purchases()
RETURNS void AS $$
DECLARE
  download_record RECORD;
  existing_purchase RECORD;
  user_id_var UUID;
  design_id_var UUID;
  download_count_var INT;
BEGIN
  -- Loop through all designs with downloads
  FOR download_record IN 
    SELECT d.id as design_id, d.user_id, d.downloads, d.price, d.created_at
    FROM designs d 
    WHERE d.downloads > 0
  LOOP
    -- Get the user who downloaded the design
    -- Note: This assumes the design owner is the one who downloaded it
    -- You might need to adjust this logic based on your actual download tracking
    user_id_var := download_record.user_id;
    design_id_var := download_record.design_id;
    
    -- Check if a purchase record already exists for this user and design
    SELECT * INTO existing_purchase 
    FROM purchases 
    WHERE user_id = user_id_var 
    AND design_id = design_id_var
    LIMIT 1;
    
    -- If no purchase record exists and the design is free, create one
    IF existing_purchase IS NULL AND (download_record.price = 0 OR download_record.price IS NULL) THEN
      INSERT INTO purchases (
        design_id, 
        user_id, 
        amount, 
        currency, 
        status,
        created_at
      ) VALUES (
        design_id_var,
        user_id_var,
        0, -- Free download
        'USD',
        'completed',
        download_record.created_at
      );
      
      RAISE NOTICE 'Added purchase record for design % (user: %)', design_id_var, user_id_var;
    END IF;
  END LOOP;
  
  -- Also handle downloads from the design_files_downloads table if it exists
  -- This assumes you have a table tracking individual downloads
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'design_files_downloads') THEN
    FOR download_record IN 
      SELECT DISTINCT d.id as design_id, dfd.user_id, dfd.created_at
      FROM design_files_downloads dfd
      JOIN design_files df ON dfd.file_id = df.id
      JOIN designs d ON df.design_id = d.id
      WHERE (d.price = 0 OR d.price IS NULL)
      AND NOT EXISTS (
        SELECT 1 FROM purchases p 
        WHERE p.design_id = d.id 
        AND p.user_id = dfd.user_id
      )
    LOOP
      INSERT INTO purchases (
        design_id, 
        user_id, 
        amount, 
        currency, 
        status,
        created_at
      ) VALUES (
        download_record.design_id,
        download_record.user_id,
        0, -- Free download
        'USD',
        'completed',
        download_record.created_at
      );
      
      RAISE NOTICE 'Added purchase record for design % (user: %) from download history', 
        download_record.design_id, download_record.user_id;
    END LOOP;
  END IF;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Execute the function to backfill the data
SELECT backfill_downloads_to_purchases();

-- Clean up the function if needed
-- DROP FUNCTION IF EXISTS backfill_downloads_to_purchases();
