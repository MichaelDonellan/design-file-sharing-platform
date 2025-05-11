/*
  # Add mockup path column to designs table

  1. Changes
    - Add `mockup_path` column to `designs` table to store preview image URLs
    - Column is required (NOT NULL) as every design needs a preview image
    - Column type is text to store the full URL path

  2. Security
    - No additional RLS policies needed as the column is covered by existing table-level policies
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'designs' AND column_name = 'mockup_path'
  ) THEN
    ALTER TABLE designs 
    ADD COLUMN mockup_path text NOT NULL;
  END IF;
END $$;