-- Create design_files_downloads table to track individual file downloads
CREATE TABLE IF NOT EXISTS public.design_files_downloads (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    design_file_id uuid NOT NULL REFERENCES public.design_files(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.design_files_downloads ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own downloads
CREATE POLICY "Users can view their own downloads"
    ON public.design_files_downloads
    FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to create download records
CREATE POLICY "Users can create download records"
    ON public.design_files_downloads
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_design_files_downloads_user_id
    ON public.design_files_downloads(user_id);

CREATE INDEX IF NOT EXISTS idx_design_files_downloads_design_file_id
    ON public.design_files_downloads(design_file_id);

-- Create a function to get the number of downloads for a design
CREATE OR REPLACE FUNCTION public.get_design_downloads(design_id_param uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) 
  FROM public.design_files_downloads dfd
  JOIN public.design_files df ON dfd.design_file_id = df.id
  WHERE df.design_id = design_id_param;
$$ LANGUAGE SQL STABLE;

-- Create a trigger to update the downloads count on the designs table
CREATE OR REPLACE FUNCTION public.update_design_downloads_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.designs
  SET downloads = (
    SELECT COUNT(*) 
    FROM public.design_files_downloads dfd
    JOIN public.design_files df ON dfd.design_file_id = df.id
    WHERE df.design_id = (SELECT design_id FROM public.design_files WHERE id = NEW.design_file_id)
  )
  WHERE id = (SELECT design_id FROM public.design_files WHERE id = NEW.design_file_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop the trigger if it exists to avoid duplicates
DROP TRIGGER IF EXISTS trigger_update_design_downloads_count 
ON public.design_files_downloads;

-- Create the trigger
CREATE TRIGGER trigger_update_design_downloads_count
AFTER INSERT ON public.design_files_downloads
FOR EACH ROW
EXECUTE FUNCTION public.update_design_downloads_count();

-- Create a function to check if a user has downloaded a design
CREATE OR REPLACE FUNCTION public.has_user_downloaded_design(user_id_param uuid, design_id_param uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.design_files_downloads dfd
    JOIN public.design_files df ON dfd.design_file_id = df.id
    WHERE dfd.user_id = user_id_param AND df.design_id = design_id_param
    LIMIT 1
  );
$$ LANGUAGE SQL STABLE;
