-- Create or replace the increment_download_count function
CREATE OR REPLACE FUNCTION public.increment_download_count(design_id_param uuid)
RETURNS void AS $$
BEGIN
  -- This function is now a no-op since we're using the trigger-based approach
  -- The trigger on design_files_downloads will update the downloads count
  -- This function is kept for backward compatibility
  NULL;
END;
$$ LANGUAGE plpgsql;
