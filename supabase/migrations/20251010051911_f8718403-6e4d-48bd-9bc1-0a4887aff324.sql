-- Drop the overly permissive public read policy on employer
DROP POLICY IF EXISTS "Public can view employer profiles" ON public.employer;

-- Allow employers to view their own full profile (already exists but let's ensure it's correct)
-- The existing "Users can view their own employer profile" policy handles this

-- Allow authenticated users to view basic employer information for job browsing
-- This shows company info needed for job listings but hides personal contact details
CREATE POLICY "Authenticated users can view limited employer profiles"
ON public.employer
FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() != user_id
  AND NOT EXISTS (
    SELECT 1
    FROM public.matches
    WHERE matches.employer_id = employer.user_id
      AND matches.whv_id = auth.uid()
  )
);

-- Allow matched WHV makers to view full employer contact information
CREATE POLICY "Matched WHV makers can view full employer profiles"
ON public.employer
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.matches
    WHERE matches.employer_id = employer.user_id
      AND matches.whv_id = auth.uid()
  )
);

-- Note: Column-level security would be ideal here, but RLS doesn't support that directly.
-- The application layer should filter sensitive fields for non-matched users.
-- Sensitive fields: given_name, middle_name, family_name, mobile_num, abn, 
-- address_line1, address_line2, suburb_city (full), postcode (full)
-- Safe to show: company_name, tagline, profile_photo, industry_id, state (general region), 
-- business_tenure, employee_count