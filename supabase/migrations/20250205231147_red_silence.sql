/*
  # Create designs table and storage

  1. New Tables
    - `designs`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `name` (text)
      - `description` (text)
      - `file_path` (text)
      - `file_type` (text)
      - `user_id` (uuid, references auth.users)
      - `downloads` (integer)
      
  2. Security
    - Enable RLS on `designs` table
    - Add policies for CRUD operations
*/

-- Create the designs table
CREATE TABLE designs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  description text,
  file_path text NOT NULL,
  file_type text NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  downloads integer DEFAULT 0,
  CONSTRAINT valid_file_type CHECK (file_type IN ('image', 'font', 'template'))
);

-- Enable RLS
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;

-- Create policies
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

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_designs_updated_at
  BEFORE UPDATE ON designs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();