-- Migration: Add certifications column to resumes table
-- Run this in your Supabase SQL Editor or via CLI

-- Add certifications column as JSONB (array of certification objects)
ALTER TABLE public.resumes 
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb;

-- Optional: Add a comment for documentation
COMMENT ON COLUMN public.resumes.certifications IS 'Array of certification objects with name, issuer, and date fields';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resumes' 
AND table_schema = 'public';
