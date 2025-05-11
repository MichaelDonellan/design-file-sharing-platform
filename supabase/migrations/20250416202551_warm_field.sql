/*
  # Fix purchases RLS policy

  1. Changes
    - Add RLS policy for purchases table to allow authenticated users to create purchases
    - Use DO block to check if policy exists before creating

  2. Security
    - Enable RLS on purchases table (if not already enabled)
    - Add policy for authenticated users to create purchases (if not exists)
*/

-- Enable RLS if not already enabled
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Add policy for authenticated users to create purchases if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'purchases' 
    AND policyname = 'Users can create purchases'
  ) THEN
    CREATE POLICY "Users can create purchases"
      ON purchases
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;