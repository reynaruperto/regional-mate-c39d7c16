-- Fix the check_and_create_mutual_match trigger to use correct column name
DROP TRIGGER IF EXISTS on_like_check_match ON public.likes;

CREATE OR REPLACE FUNCTION public.check_and_create_mutual_match()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_emp_id UUID;
  v_maker_id UUID;
  v_job_id BIGINT;
  v_is_mutual_match BOOLEAN := FALSE;
BEGIN
  -- Determining the scenario of the trigger:
  -- Whether who liked and what was liked
  IF NEW.liker_type = 'whv' AND NEW.liked_job_post_id IS NOT NULL THEN
    -- Scenario: WHV liked a job post
    -- Check if the employer already liked this WHV for this job

    v_maker_id := NEW.liker_id;
    v_job_id := NEW.liked_job_post_id;

    -- Get employer ID from job
    SELECT user_id INTO v_emp_id
    FROM job
    WHERE job_id = v_job_id;

    -- Check if employer has already liked this WHV for this specific job
    IF EXISTS (
      SELECT 1 FROM likes
      WHERE liker_id = v_emp_id
        AND liker_type = 'employer'
        AND liked_whv_id = v_maker_id
        AND liked_job_post_id = v_job_id
    ) THEN
      v_is_mutual_match := TRUE;
    END IF;
  ELSIF NEW.liker_type = 'employer' AND NEW.liked_whv_id IS NOT NULL AND NEW.liked_job_post_id IS NOT NULL THEN

    -- Scenario: employer just liked a WHV for a specific job
    -- Check if the WHV already liked this job
    v_emp_id := NEW.liker_id;
    v_job_id := NEW.liked_job_post_id;
    v_maker_id := NEW.liked_whv_id;

    -- Check if WHV has already liked this job
    IF EXISTS (
      SELECT 1
      FROM likes
      WHERE liker_id = v_maker_id
        AND liked_job_post_id = v_job_id
        AND liker_type = 'whv'
    ) THEN
      v_is_mutual_match := TRUE;
    END IF;
  END IF;

  -- If there is a mutual match, create the match record
  IF v_is_mutual_match THEN
    -- Create the match record using job_id instead of job_post_id
    INSERT INTO matches (whv_id, employer_id, job_id)
    VALUES (v_maker_id, v_emp_id, v_job_id)
    ON CONFLICT (whv_id, employer_id, job_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
CREATE TRIGGER on_like_check_match
  AFTER INSERT ON public.likes
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_create_mutual_match();