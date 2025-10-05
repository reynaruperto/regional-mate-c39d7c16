-- Fix the create_notification_from_like trigger function
-- The issue is using 'notification_enabled' instead of 'notifications_enabled'
DROP FUNCTION IF EXISTS public.create_notification_from_like() CASCADE;

CREATE OR REPLACE FUNCTION public.create_notification_from_like()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_job_title TEXT;
  v_company_name TEXT;
  v_maker_name TEXT;
  v_emp_id UUID;
  v_notification_enabled BOOLEAN;
  v_notification_title TEXT;
  v_notification_message TEXT;
BEGIN
  -- Scenario: WHV liked a job post
  IF NEW.liker_type = 'whv' AND NEW.liked_job_post_id IS NOT NULL THEN

    -- Get job and employer details
    SELECT ir.role, e.company_name, e.user_id
    INTO v_job_title, v_company_name, v_emp_id
    FROM job j
    INNER JOIN employer e ON j.user_id = e.user_id
    INNER JOIN industry_role ir ON j.industry_role_id = ir.industry_role_id
    WHERE j.job_id = NEW.liked_job_post_id;

    -- Get candidate name
    SELECT wm.given_name INTO v_maker_name
    FROM whv_maker wm
    WHERE wm.user_id = NEW.liker_id;

    -- Check if employer has notifications enabled (FIXED: notifications_enabled)
    SELECT notifications_enabled INTO v_notification_enabled
    FROM notification_setting ns
    WHERE user_id = v_emp_id AND user_type = 'employer';

    -- Default to enabled if no settings exists
    IF v_notification_enabled IS NULL THEN
      v_notification_enabled := TRUE;
    END IF;

    -- Create notification for employer
    IF v_notification_enabled THEN
      v_notification_title := 'New Candidate Interest';
      v_notification_message := v_maker_name || ' is interested in your job post: ' || v_job_title;

      INSERT INTO notifications (
        sender_id,
        sender_type,
        recipient_id,
        recipient_type,
        type,
        job_id,
        title,
        message
      )
      VALUES (
        NEW.liker_id,
        'whv',
        v_emp_id,
        'employer',
        'job_like',
        NEW.liked_job_post_id,
        v_notification_title,
        v_notification_message
      );
    END IF;

  -- Scenario: Employer liked a WHV
  ELSIF NEW.liker_type = 'employer' AND NEW.liked_whv_id IS NOT NULL THEN
    -- Get candidate name
    SELECT wm.given_name INTO v_maker_name
    FROM whv_maker wm
    WHERE wm.user_id = NEW.liked_whv_id;

    -- Get job and employer details
    SELECT ir.role, e.company_name, e.user_id
    INTO v_job_title, v_company_name, v_emp_id
    FROM job j
    INNER JOIN employer e ON j.user_id = e.user_id
    INNER JOIN industry_role ir ON j.industry_role_id = ir.industry_role_id
    WHERE j.job_id = NEW.liked_job_post_id;
        
    -- Check if WHV has notifications enabled (FIXED: notifications_enabled)
    SELECT notifications_enabled INTO v_notification_enabled
    FROM notification_setting
    WHERE user_id = NEW.liked_whv_id AND user_type = 'whv';

    -- Default to enabled if no settings exists
    IF v_notification_enabled IS NULL THEN
      v_notification_enabled := TRUE;
    END IF;
        
    -- Create notification for candidate
    IF v_notification_enabled THEN
      v_notification_title := 'Employer Interested!';
      v_notification_message := v_company_name || ' is interested in your profile for: ' || v_job_title;
            
      INSERT INTO notifications (
        sender_id,
        sender_type,
        recipient_id,
        recipient_type,
        type,
        job_id,
        title,
        message
      ) VALUES (
        NEW.liker_id,
        'employer',
        NEW.liked_whv_id,
        'whv',
        'maker_like',
        NEW.liked_job_post_id,
        v_notification_title,
        v_notification_message
      );
    END IF;

  END IF;
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_like_inserted
  AFTER INSERT ON likes
  FOR EACH ROW
  EXECUTE FUNCTION create_notification_from_like();