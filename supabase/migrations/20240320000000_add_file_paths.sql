-- Add file_path and mockup_path columns to designs table
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS mockup_path TEXT;

-- Add price and currency columns if they don't exist
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USD';

-- Add tags column if it doesn't exist
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for tags
CREATE INDEX IF NOT EXISTS idx_designs_tags ON designs USING gin(tags); 