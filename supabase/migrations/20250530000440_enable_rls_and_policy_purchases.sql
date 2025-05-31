-- Enable Row Level Security on purchases table
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Allow users to select their own purchases
CREATE POLICY "Users can select their own purchases"
  ON purchases
  FOR SELECT
  USING (user_id = auth.uid());
