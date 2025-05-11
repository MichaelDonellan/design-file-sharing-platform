/*
  # Complete Database Schema Rebuild

  1. Tables
    - designs
    - stores
    - purchases
    - reviews
    - design_files
    - design_mockups

  2. Security
    - Enable RLS on all tables
    - Set up appropriate policies
    - Create necessary indexes
    - Add validation triggers
*/

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist
DROP TABLE IF EXISTS design_mockups CASCADE;
DROP TABLE IF EXISTS design_files CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS purchases CASCADE;
DROP TABLE IF EXISTS designs CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- Create stores table
CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text UNIQUE NOT NULL,
  description text,
  user_id uuid REFERENCES auth.users NOT NULL,
  avatar_url text
);

-- Create designs table
CREATE TABLE designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  file_type text NOT NULL CHECK (file_type IN ('image', 'font', 'template')),
  user_id uuid REFERENCES auth.users NOT NULL,
  downloads integer DEFAULT 0,
  category text NOT NULL CHECK (category IN ('Templates', 'Fonts', 'Logos', 'Icons', 'UI Kits')),
  subcategory text,
  tags text[],
  store_id uuid REFERENCES stores,
  price integer,
  currency text DEFAULT 'USD',
  average_rating numeric(3,2)
);

-- Create purchases table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  design_id uuid REFERENCES designs NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Create reviews table
CREATE TABLE reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  design_id uuid REFERENCES designs NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  UNIQUE(design_id, user_id)
);

-- Create design_files table
CREATE TABLE design_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  design_id uuid REFERENCES designs NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('image', 'font', 'template')),
  display_order integer NOT NULL DEFAULT 0
);

-- Create design_mockups table
CREATE TABLE design_mockups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  design_id uuid REFERENCES designs NOT NULL,
  mockup_path text NOT NULL,
  display_order integer NOT NULL DEFAULT 0
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to validate subcategories
CREATE OR REPLACE FUNCTION validate_subcategory()
RETURNS TRIGGER AS $$
BEGIN
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

-- Create function to update design rating
CREATE OR REPLACE FUNCTION update_design_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE designs
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 2)
    FROM reviews
    WHERE design_id = NEW.design_id
  )
  WHERE id = NEW.design_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updating design rating
CREATE TRIGGER update_design_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_design_rating();

-- Enable Row Level Security
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_mockups ENABLE ROW LEVEL SECURITY;

-- Stores policies
CREATE POLICY "Anyone can view stores"
  ON stores
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create their own store"
  ON stores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own store"
  ON stores
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Designs policies
CREATE POLICY "Anyone can view designs"
  ON designs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create designs"
  ON designs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own designs"
  ON designs
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own designs"
  ON designs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Purchases policies
CREATE POLICY "Users can view their own purchases"
  ON purchases
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create purchases"
  ON purchases
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews if they purchased"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.design_id = reviews.design_id
      AND purchases.user_id = auth.uid()
      AND purchases.status = 'completed'
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews"
  ON reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Design files policies
CREATE POLICY "Anyone can view design files"
  ON design_files
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their design files"
  ON design_files
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = design_files.design_id
      AND designs.user_id = auth.uid()
    )
  );

-- Design mockups policies
CREATE POLICY "Anyone can view design mockups"
  ON design_mockups
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their design mockups"
  ON design_mockups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM designs
      WHERE designs.id = design_mockups.design_id
      AND designs.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_designs_store_id ON designs(store_id);
CREATE INDEX idx_designs_user_id ON designs(user_id);
CREATE INDEX idx_designs_category ON designs(category);
CREATE INDEX idx_designs_subcategory ON designs(subcategory);
CREATE INDEX idx_designs_tags ON designs USING gin(tags);
CREATE INDEX idx_purchases_design_id ON purchases(design_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);
CREATE INDEX idx_reviews_design_id ON reviews(design_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_design_files_design_id ON design_files(design_id);
CREATE INDEX idx_design_mockups_design_id ON design_mockups(design_id);

-- Update storage bucket configuration
UPDATE storage.buckets
SET 
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY[
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
    'application/x-font-ttf',
    'application/x-font-otf',
    'application/vnd.ms-fontobject',
    'application/font-woff',
    'application/font-woff2',
    'application/zip',
    'application/x-zip-compressed',
    'application/postscript',
    'application/pdf',
    'image/vnd.adobe.photoshop',
    'application/illustrator'
  ]
WHERE id = 'designs';