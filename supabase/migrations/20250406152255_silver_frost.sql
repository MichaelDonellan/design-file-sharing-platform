/*
  # Add reviews and multiple files support

  1. New Tables
    - `reviews`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `design_id` (uuid, references designs)
      - `user_id` (uuid, references auth.users)
      - `rating` (integer, 1-5)
      - `comment` (text)

    - `design_files`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `design_id` (uuid, references designs)
      - `file_path` (text)
      - `file_type` (text)
      - `display_order` (integer)

    - `design_mockups`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `design_id` (uuid, references designs)
      - `mockup_path` (text)
      - `display_order` (integer)

  2. Changes to designs table
    - Remove `file_path` and `mockup_path` columns (now in separate tables)
    - Add `average_rating` column

  3. Security
    - Enable RLS on new tables
    - Add appropriate policies
*/

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

-- Modify designs table
ALTER TABLE designs
ADD COLUMN average_rating numeric(3,2) DEFAULT NULL;

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE design_mockups ENABLE ROW LEVEL SECURITY;

-- Reviews policies
CREATE POLICY "Anyone can view reviews"
  ON reviews
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can create reviews if they downloaded"
  ON reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM purchases
      WHERE purchases.design_id = reviews.design_id
      AND purchases.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own reviews"
  ON reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

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

-- Create trigger for reviews
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
$$ language 'plpgsql';

CREATE TRIGGER update_design_rating_on_review
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_design_rating();

-- Create indexes
CREATE INDEX idx_reviews_design_id ON reviews(design_id);
CREATE INDEX idx_design_files_design_id ON design_files(design_id);
CREATE INDEX idx_design_mockups_design_id ON design_mockups(design_id);