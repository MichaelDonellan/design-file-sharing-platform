-- SQL Script to reset designs and configure consistent storage paths
-- Run this in the Supabase SQL Editor

-- 1. Delete existing records (in the correct order to avoid foreign key constraint issues)
DELETE FROM design_files WHERE id IS NOT NULL;
DELETE FROM design_mockups WHERE id IS NOT NULL;
DELETE FROM reviews WHERE id IS NOT NULL;
DELETE FROM designs WHERE id IS NOT NULL;

-- 2. Insert new design records with consistent storage paths
-- Note: You'll need to manually delete files from storage after running this SQL
-- and upload placeholder PDFs to the paths specified below

-- First, create a function to generate slugified names
CREATE OR REPLACE FUNCTION slugify(input text) RETURNS text AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric characters
  RETURN lower(regexp_replace(regexp_replace(input, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '.pdf';
END;
$$ LANGUAGE plpgsql;

-- Now insert designs and design files with consistent naming
DO $$
DECLARE
  design_id uuid;
  user_id uuid;
  storage_path text;
BEGIN
  -- Get a valid user_id from the system (use the first one we find)
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  -- If no user found, use a hardcoded UUID (you may need to replace this with a valid user ID)
  IF user_id IS NULL THEN
    user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- 1. Modern Logo Template (Free)
  design_id := gen_random_uuid();
  storage_path := 'designs/' || design_id || '/' || slugify('Modern Logo Template');
  
  INSERT INTO designs (id, name, description, file_type, user_id, downloads, category, price)
  VALUES (
    design_id,
    'Modern Logo Template',
    'A sleek and modern logo template for tech companies',
    'template',
    user_id,
    0,
    'Logos',
    0
  );
  
  INSERT INTO design_files (id, design_id, file_path, file_type, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    'template',
    1
  );
  
  -- 2. Vintage Font Pack (Paid)
  design_id := gen_random_uuid();
  storage_path := 'designs/' || design_id || '/' || slugify('Vintage Font Pack');
  
  INSERT INTO designs (id, name, description, file_type, user_id, downloads, category, price)
  VALUES (
    design_id,
    'Vintage Font Pack',
    'A collection of vintage-inspired fonts',
    'font',
    user_id,
    0,
    'Fonts',
    19.99
  );
  
  INSERT INTO design_files (id, design_id, file_path, file_type, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    'font',
    1
  );
  
  -- 3. UI Kit Pro (Paid)
  design_id := gen_random_uuid();
  storage_path := 'designs/' || design_id || '/' || slugify('UI Kit Pro');
  
  INSERT INTO designs (id, name, description, file_type, user_id, downloads, category, price)
  VALUES (
    design_id,
    'UI Kit Pro',
    'Professional UI components for modern web applications',
    'template',
    user_id,
    0,
    'UI Kits',
    49.99
  );
  
  INSERT INTO design_files (id, design_id, file_path, file_type, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    'template',
    1
  );
  
  -- 4. Icon Set - Essential (Free)
  design_id := gen_random_uuid();
  storage_path := 'designs/' || design_id || '/' || slugify('Icon Set - Essential');
  
  INSERT INTO designs (id, name, description, file_type, user_id, downloads, category, price)
  VALUES (
    design_id,
    'Icon Set - Essential',
    'Essential icons for everyday app design',
    'image',
    user_id,
    0,
    'Icons',
    0
  );
  
  INSERT INTO design_files (id, design_id, file_path, file_type, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    'image',
    1
  );
  
  -- 5. Website Template - Portfolio (Paid)
  design_id := gen_random_uuid();
  storage_path := 'designs/' || design_id || '/' || slugify('Website Template - Portfolio');
  
  INSERT INTO designs (id, name, description, file_type, user_id, downloads, category, price)
  VALUES (
    design_id,
    'Website Template - Portfolio',
    'Clean portfolio template for designers',
    'template',
    user_id,
    0,
    'Templates',
    29.99
  );
  
  INSERT INTO design_files (id, design_id, file_path, file_type, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    'template',
    1
  );
  
END $$;

-- Get all the new design records to see their IDs and storage paths
SELECT d.id, d.name, df.file_path 
FROM designs d
JOIN design_files df ON d.id = df.design_id
ORDER BY d.name;
