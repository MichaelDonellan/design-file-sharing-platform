-- Add is_freebie column to designs table
ALTER TABLE designs
ADD COLUMN is_freebie BOOLEAN DEFAULT false;

-- Create a function to automatically categorize free designs
CREATE OR REPLACE FUNCTION categorize_free_designs()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.price = 0 OR NEW.price IS NULL THEN
    NEW.is_freebie := true;
    NEW.category := 'Freebies';
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
SET is_freebie = true,
    category = 'Freebies'
WHERE price = 0 OR price IS NULL; 