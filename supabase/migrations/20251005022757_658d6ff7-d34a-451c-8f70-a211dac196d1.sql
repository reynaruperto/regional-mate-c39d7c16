-- Fix the mark_notification_read function (typo in parameter name)
DROP FUNCTION IF EXISTS public.mark_notification_read(bigint);

CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id bigint)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  UPDATE notifications
  SET read_at = current_timestamp
  WHERE id = p_notification_id
  AND recipient_id = auth.uid();
END;
$function$;