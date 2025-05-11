/*
  # Add store and pricing features

  1. New Tables
    - `stores`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `name` (text, unique)
      - `description` (text)
      - `user_id` (uuid, references auth.users)
      - `avatar_url` (text)
    
    - `purchases`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `design_id` (uuid, references designs)
      - `user_id` (uuid, references auth.users)
      - `amount` (integer)
      - `currency` (text)
      - `status` (text)

  2. Changes to designs table
    - Add `store_id` (uuid, references stores)
    - Add `price` (integer, null means free)
    - Add `currency` (text)

  3. Security
    - Enable RLS on new tables
    - Add policies for CRUD operations
*/

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

-- Create purchases table
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  design_id uuid REFERENCES designs NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  status text NOT NULL DEFAULT 'completed',
  CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'failed'))
);

-- Add new columns to designs table
ALTER TABLE designs 
ADD COLUMN store_id uuid REFERENCES stores,
ADD COLUMN price integer,
ADD COLUMN currency text DEFAULT 'USD';

-- Enable RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

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

-- Add trigger for updated_at on stores
CREATE TRIGGER update_stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add indexes for better query performance
CREATE INDEX idx_designs_store_id ON designs(store_id);
CREATE INDEX idx_purchases_design_id ON purchases(design_id);
CREATE INDEX idx_purchases_user_id ON purchases(user_id);