-- Drop existing functions
DROP FUNCTION IF EXISTS public.fetch_job_matches(bigint);
DROP FUNCTION IF EXISTS public.fetch_job_recommendations(bigint);

-- Recreate fetch_job_matches with candidate preferences
CREATE OR REPLACE FUNCTION public.fetch_job_matches(p_job_id bigint)
RETURNS TABLE(
  maker_id uuid,
  job_id bigint,
  given_name text,
  profile_photo text,
  country text,
  location text,
  availability text,
  state_pref text[],
  industry_pref text[],
  work_experience json,
  match_score numeric,
  work_experience_score integer,
  license_score integer,
  location_score integer,
  industry_score integer,
  matching_rank bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  select
    v.maker_id,
    v.job_id,
    m.given_name,
    m.profile_photo,
    'Australia'::text as country,
    concat_ws(', ', m.suburb, m.state, m.postcode) as location,
    coalesce(to_char(ma.available_from, 'YYYY-MM-DD'), 'Not specified') as availability,
    v.state_pref,
    v.industry_pref,
    v.work_experience,
    v.match_score,
    v.work_experience_score,
    v.license_score,
    v.location_score,
    v.industry_score,
    v.matching_rank
  from vw_emp_match_scores v
  join whv_maker m on m.user_id = v.maker_id
  left join maker_pref_availability ma on ma.user_id = m.user_id
  join likes l1 on l1.liker_id = v.maker_id and l1.liker_type = 'whv' and l1.liked_job_post_id = v.job_id
  join likes l2 on l2.liker_type = 'employer' and l2.liker_id = v.emp_id and l2.liked_whv_id = v.maker_id
  where v.job_id = p_job_id
  order by v.match_score desc, v.matching_rank;
$function$;

-- Recreate fetch_job_recommendations with candidate preferences
CREATE OR REPLACE FUNCTION public.fetch_job_recommendations(p_job_id bigint)
RETURNS TABLE(
  maker_id uuid,
  job_id bigint,
  given_name text,
  profile_photo text,
  country text,
  location text,
  availability text,
  state_pref text[],
  industry_pref text[],
  work_experience json,
  match_score numeric,
  work_experience_score integer,
  license_score integer,
  location_score integer,
  industry_score integer,
  matching_rank bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $function$
  select
    v.maker_id,
    v.job_id,
    m.given_name,
    m.profile_photo,
    'Australia'::text as country,
    concat_ws(', ', m.suburb, m.state, m.postcode) as location,
    coalesce(to_char(ma.available_from, 'YYYY-MM-DD'), 'Not specified') as availability,
    v.state_pref,
    v.industry_pref,
    v.work_experience,
    v.match_score,
    v.work_experience_score,
    v.license_score,
    v.location_score,
    v.industry_score,
    v.matching_rank
  from vw_emp_match_scores v
  join whv_maker m on m.user_id = v.maker_id
  left join maker_pref_availability ma on ma.user_id = m.user_id
  where v.job_id = p_job_id
  order by v.match_score desc, v.matching_rank
  limit 20;
$function$;