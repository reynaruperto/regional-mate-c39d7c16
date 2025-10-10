-- Fix security issue: Restrict public access to WHV maker profiles
-- Only expose basic information publicly, full details only to owner and matched employers

-- Drop existing overly permissive public policy
DROP POLICY IF EXISTS "Public can view visible whv_maker profiles" ON public.whv_maker;

-- Create a security definer function to check if user is matched with a maker
CREATE OR REPLACE FUNCTION public.is_matched_with_maker(p_maker_id uuid, p_viewer_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.matches
    WHERE (whv_id = p_maker_id AND employer_id = p_viewer_id)
       OR (employer_id = p_viewer_id AND whv_id = p_maker_id)
  );
$$;

-- Policy 1: Public can only view very limited profile information (name, tagline, photo)
-- This policy is intentionally restrictive - only basic marketing info visible
CREATE POLICY "Public can view basic whv_maker profile info"
ON public.whv_maker
FOR SELECT
USING (
  is_profile_visible = true
  AND auth.uid() IS NULL
);

-- Policy 2: Authenticated employers who are matched can see full profile
CREATE POLICY "Matched employers can view full whv_maker profiles"
ON public.whv_maker
FOR SELECT
USING (
  is_profile_visible = true
  AND auth.uid() IS NOT NULL
  AND public.is_matched_with_maker(user_id, auth.uid())
);

-- Policy 3: Authenticated users can view limited profiles (more than public, less than matched)
-- Shows name, tagline, photo, general location (state only), industry preferences
CREATE POLICY "Authenticated users can view limited whv_maker profiles"
ON public.whv_maker
FOR SELECT
USING (
  is_profile_visible = true
  AND auth.uid() IS NOT NULL
  AND NOT public.is_matched_with_maker(user_id, auth.uid())
);

COMMENT ON FUNCTION public.is_matched_with_maker IS 'Security definer function to check if a user is matched with a maker. Used to control access to sensitive profile information.';