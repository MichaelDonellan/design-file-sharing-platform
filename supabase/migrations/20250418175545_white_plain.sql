/*
  # Add subcategories and tags to designs table

  1. Changes
    - Add subcategory column to designs table
    - Add tags array column to designs table
    - Add check constraint for valid subcategories based on main category

  2. Security
    - No changes to RLS policies needed as the columns are covered by existing table-level policies
*/

-- Add new columns
ALTER TABLE designs
ADD COLUMN subcategory text,
ADD COLUMN tags text[];

-- Create function to validate subcategories
CREATE OR REPLACE FUNCTION validate_subcategory()
RETURNS TRIGGER AS $$
BEGIN
  -- Define valid subcategories for each category
  IF NEW.category = 'Fonts' AND NEW.subcategory NOT IN (
    'Serif', 'Sans Serif', 'Display', 'Script', 'Monospace'
  ) THEN
    RAISE EXCEPTION 'Invalid subcategory for Fonts';
  END IF;

  IF NEW.category = 'Logos' AND NEW.subcategory NOT IN (
    'Minimal', 'Vintage', 'Abstract', 'Mascot', 'Lettermark'
  ) THEN
    RAISE EXCEPTION 'Invalid subcategory for Logos';
  END IF;

  IF NEW.category = 'Templates' AND NEW.subcategory NOT IN (
    'Social Media', 'Print', 'Web', 'Mobile', 'Presentation'
  ) THEN
    RAISE EXCEPTION 'Invalid subcategory for Templates';
  END IF;

  IF NEW.category = 'Icons' AND NEW.subcategory NOT IN (
    'Line', 'Filled', 'Duotone', 'Outline', 'Animated'
  ) THEN
    RAISE EXCEPTION 'Invalid subcategory for Icons';
  END IF;

  IF NEW.category = 'UI Kits' AND NEW.subcategory NOT IN (
    'Mobile', 'Dashboard', 'Landing Page', 'E-commerce', 'Components'
  ) THEN
    RAISE EXCEPTION 'Invalid subcategory for UI Kits';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for subcategory validation
CREATE TRIGGER validate_design_subcategory
  BEFORE INSERT OR UPDATE ON designs
  FOR EACH ROW
  WHEN (NEW.subcategory IS NOT NULL)
  EXECUTE FUNCTION validate_subcategory();

-- Create index for performance
CREATE INDEX idx_designs_subcategory ON designs(subcategory);
CREATE INDEX idx_designs_tags ON designs USING gin(tags);