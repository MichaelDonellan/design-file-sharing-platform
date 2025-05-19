-- Add views and favorites columns to designs table
ALTER TABLE designs
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS favorites INTEGER DEFAULT 0;

-- Create a new table for tracking user favorites
CREATE TABLE IF NOT EXISTS design_favorites (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    design_id UUID REFERENCES designs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(design_id, user_id)
);

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS design_favorites_design_id_idx ON design_favorites(design_id);
CREATE INDEX IF NOT EXISTS design_favorites_user_id_idx ON design_favorites(user_id);

-- Create a function to update favorites count
CREATE OR REPLACE FUNCTION update_design_favorites_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE designs
        SET favorites = favorites + 1
        WHERE id = NEW.design_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE designs
        SET favorites = favorites - 1
        WHERE id = OLD.design_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to maintain favorites count
DROP TRIGGER IF EXISTS design_favorites_count_insert ON design_favorites;
CREATE TRIGGER design_favorites_count_insert
    AFTER INSERT ON design_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_design_favorites_count();

DROP TRIGGER IF EXISTS design_favorites_count_delete ON design_favorites;
CREATE TRIGGER design_favorites_count_delete
    AFTER DELETE ON design_favorites
    FOR EACH ROW
    EXECUTE FUNCTION update_design_favorites_count(); 