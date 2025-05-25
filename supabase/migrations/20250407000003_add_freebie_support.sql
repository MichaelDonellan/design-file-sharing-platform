-- Add is_free_download column to designs table
ALTER TABLE designs
ADD COLUMN is_free_download BOOLEAN DEFAULT false;

-- Create a function to automatically categorize free designs
CREATE OR REPLACE FUNCTION categorize_free_designs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price = 0 OR NEW.price IS NULL THEN
    NEW.is_free_download := true;
    NEW.category := 'Free Downloads';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically categorize free designs
CREATE TRIGGER set_freebie_category
  BEFORE INSERT OR UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION categorize_free_designs();

-- Update existing designs to be categorized as freebies if they have no price
UPDATE designs
SET is_free_download = true,
    category = 'Free Downloads'
WHERE price = 0 OR price IS NULL; 