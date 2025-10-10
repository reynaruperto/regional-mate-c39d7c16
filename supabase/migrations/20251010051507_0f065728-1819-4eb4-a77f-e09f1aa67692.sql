-- Drop the overly permissive public read policy on profile
DROP POLICY IF EXISTS "Public can view profiles for contact" ON public.profile;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile"
ON public.profile
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow matched users to view each other's contact information
-- This allows employers and WHV makers who have matched to contact each other
CREATE POLICY "Matched users can view each other's profiles"
ON public.profile
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.matches
    WHERE (matches.whv_id = profile.user_id AND matches.employer_id = auth.uid())
       OR (matches.employer_id = profile.user_id AND matches.whv_id = auth.uid())
  )
);