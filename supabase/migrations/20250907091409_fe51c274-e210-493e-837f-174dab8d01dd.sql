-- Add area column to maker_preference table
ALTER TABLE public.maker_preference ADD COLUMN IF NOT EXISTS area text;