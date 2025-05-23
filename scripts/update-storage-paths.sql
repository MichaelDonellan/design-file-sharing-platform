-- SQL script to update storage paths in the design_files table

-- Create a function to help generate consistent file paths
CREATE OR REPLACE FUNCTION generate_storage_path(design_id UUID, original_name TEXT) 
RETURNS TEXT AS $$
BEGIN
  RETURN 'designs/' || design_id || '/' || original_name;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with proper storage paths
UPDATE design_files
SET storage_path = generate_storage_path(design_id, original_name)
WHERE storage_path IS NULL OR storage_path = '';

-- Verify the updates
SELECT id, design_id, original_name, storage_path 
FROM design_files 
ORDER BY design_id;
