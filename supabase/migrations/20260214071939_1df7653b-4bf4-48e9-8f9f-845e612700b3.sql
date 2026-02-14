
-- Fix #2: Server-side task completion with coin validation
CREATE OR REPLACE FUNCTION public.complete_task(_task_id TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _coins INTEGER;
BEGIN
  _coins := CASE _task_id
    WHEN 'watch_video' THEN 10
    WHEN 'share_app' THEN 50
    WHEN 'invite_friends' THEN 100
    WHEN 'daily_login' THEN 5
    WHEN 'watch_ad' THEN 10
    ELSE 0
  END;

  IF _coins = 0 THEN
    RAISE EXCEPTION 'Invalid task_id';
  END IF;

  INSERT INTO public.task_completions (user_id, task_id, coins_earned, completed_date)
  VALUES (auth.uid(), _task_id, _coins, CURRENT_DATE);
END;
$$;

-- Remove direct INSERT policy on task_completions (force use of RPC)
DROP POLICY IF EXISTS "Users can insert own completions" ON public.task_completions;

-- Fix #3: Replace broad SELECT on profiles with owner + admin full access, 
-- and a restricted view for public profile browsing
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Owner can see their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can see all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Create a public view without sensitive fields for discovery/listing
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT id, user_id, display_name, avatar_url, bio, gender, followers, following, is_blocked, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- Enable RLS on the view (views inherit base table RLS, but we want the view accessible)
-- The view excludes phone/coins, so broad access is safe
