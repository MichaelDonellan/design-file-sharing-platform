-- Complete SQL Script to reset designs, configure storage paths, and handle file uploads
-- Run this in the Supabase SQL Editor

-- Part 1: Delete existing records (in the correct order to avoid foreign key constraints)
DELETE FROM design_files WHERE id IS NOT NULL;
DELETE FROM design_mockups WHERE id IS NOT NULL;
DELETE FROM reviews WHERE id IS NOT NULL;
DELETE FROM designs WHERE id IS NOT NULL;

-- Part 2: Temporarily disable RLS on storage.objects to allow uploads
CREATE OR REPLACE FUNCTION disable_storage_rls() RETURNS void AS $$
BEGIN
  -- Temporarily disable RLS enforcement for storage.objects
  ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute as superuser
SELECT disable_storage_rls();

-- Part 3: Create a function to generate slugified names
CREATE OR REPLACE FUNCTION slugify(input text) RETURNS text AS $$
BEGIN
  -- Convert to lowercase, replace spaces with hyphens, remove non-alphanumeric characters
  RETURN lower(regexp_replace(regexp_replace(input, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '.pdf';
END;
$$ LANGUAGE plpgsql;

-- Part 4: Create a function to create placeholder PDFs and upload them
CREATE OR REPLACE FUNCTION create_placeholder_pdf() RETURNS bytea AS $$
BEGIN
  -- This is a minimal valid PDF structure
  RETURN decode('%PDF-1.4
1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj
2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj
3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj
xref
0 4
0000000000 65535 f
0000000010 00000 n
0000000053 00000 n
0000000102 00000 n
trailer<</Size 4/Root 1 0 R>>
startxref
183
%%EOF', 'escape');
END;
$$ LANGUAGE plpgsql;

-- Part 5: Insert new designs and upload files
DO $$
DECLARE
  design_id uuid;
  user_id uuid;
  storage_path text;
  pdf_content bytea;
BEGIN
  -- Get a valid user_id from the system (use the first one we find)
  SELECT id INTO user_id FROM auth.users LIMIT 1;
  
  -- If no user found, use a hardcoded UUID (you may need to replace this with a valid user ID)
  IF user_id IS NULL THEN
    user_id := '00000000-0000-0000-0000-000000000000'::uuid;
  END IF;

  -- Get the placeholder PDF content
  pdf_content := create_placeholder_pdf();

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
  
  -- Upload placeholder PDF for this design
  INSERT INTO storage.objects (bucket_id, name, owner, mime_type, content)
  VALUES ('designs', storage_path, user_id, 'application/pdf', pdf_content);

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
  
  -- Add a mockup for this design
  INSERT INTO design_mockups (id, design_id, mockup_path, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    1
  );
  
  -- Upload placeholder PDF for this design
  INSERT INTO storage.objects (bucket_id, name, owner, mime_type, content)
  VALUES ('designs', storage_path, user_id, 'application/pdf', pdf_content);

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
  
  -- Upload placeholder PDF for this design
  INSERT INTO storage.objects (bucket_id, name, owner, mime_type, content)
  VALUES ('designs', storage_path, user_id, 'application/pdf', pdf_content);

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
  
  -- Add a mockup for this design
  INSERT INTO design_mockups (id, design_id, mockup_path, display_order)
  VALUES (
    gen_random_uuid(),
    design_id,
    storage_path,
    1
  );
  
  -- Upload placeholder PDF for this design
  INSERT INTO storage.objects (bucket_id, name, owner, mime_type, content)
  VALUES ('designs', storage_path, user_id, 'application/pdf', pdf_content);

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
  
  -- Upload placeholder PDF for this design
  INSERT INTO storage.objects (bucket_id, name, owner, mime_type, content)
  VALUES ('designs', storage_path, user_id, 'application/pdf', pdf_content);
  
END $$;

-- Part 6: Re-enable RLS for storage.objects
CREATE OR REPLACE FUNCTION enable_storage_rls() RETURNS void AS $$
BEGIN
  -- Re-enable RLS enforcement for storage.objects
  ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute as superuser
SELECT enable_storage_rls();

-- Get all the new design records to see their IDs and file paths
SELECT d.id, d.name, df.file_path, d.price, 
       CASE WHEN d.price = 0 THEN 'Free' ELSE 'Paid' END as type
FROM designs d
JOIN design_files df ON d.id = df.design_id
ORDER BY d.name;
