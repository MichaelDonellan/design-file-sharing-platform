-- Create a function to safely increment design views
CREATE OR REPLACE FUNCTION increment_design_views(design_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE designs
  SET views = COALESCE(views, 0) + 1
  WHERE id = design_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 