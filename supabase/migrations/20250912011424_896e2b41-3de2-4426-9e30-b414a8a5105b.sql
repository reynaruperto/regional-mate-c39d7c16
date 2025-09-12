-- Create employer_role linking table
CREATE TABLE IF NOT EXISTS public.employer_role (
  user_id uuid NOT NULL,
  industry_role_id integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, industry_role_id)
);

-- Enable RLS
ALTER TABLE public.employer_role ENABLE ROW LEVEL SECURITY;

-- RLS policy: users can manage their own roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'employer_role' AND policyname = 'Users can manage their own roles'
  ) THEN
    CREATE POLICY "Users can manage their own roles"
    ON public.employer_role
    FOR ALL
    TO public
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_employer_role_user_id ON public.employer_role (user_id);
CREATE INDEX IF NOT EXISTS idx_employer_role_role_id ON public.employer_role (industry_role_id);
