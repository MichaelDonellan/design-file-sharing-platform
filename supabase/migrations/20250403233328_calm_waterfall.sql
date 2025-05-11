/*
  # Add category column to designs table

  1. Changes
    - Add 'category' column to designs table with type text
    - Add check constraint to ensure valid categories
    - Set default category to 'Templates'

  2. Security
    - No changes to RLS policies needed as existing policies cover the new column
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'designs' AND column_name = 'category'
  ) THEN
    ALTER TABLE designs 
    ADD COLUMN category text NOT NULL DEFAULT 'Templates';

    ALTER TABLE designs
    ADD CONSTRAINT valid_category CHECK (
      category = ANY (ARRAY['Templates', 'Fonts', 'Logos', 'Icons', 'UI Kits']::text[])
    );
  END IF;
END $$;