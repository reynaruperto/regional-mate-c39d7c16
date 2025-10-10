-- Drop the overly permissive public read policy on maker_reference
DROP POLICY IF EXISTS "Enable read access for all users" ON public.maker_reference;

-- Allow users to view their own references
CREATE POLICY "Users can view their own references"
ON public.maker_reference
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow matched employers to view WHV maker references
CREATE POLICY "Matched employers can view maker references"
ON public.maker_reference
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.matches
    WHERE matches.whv_id = maker_reference.user_id
      AND matches.employer_id = auth.uid()
  )
);