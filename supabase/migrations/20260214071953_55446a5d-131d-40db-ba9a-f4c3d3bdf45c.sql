
-- Fix the security definer view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT id, user_id, display_name, avatar_url, bio, gender, followers, following, is_blocked, created_at, updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

-- We need a permissive policy so authenticated users can read public_profiles view
-- The view queries the profiles table, so RLS on profiles applies
-- Add a permissive policy allowing all authenticated users to SELECT (view already excludes phone/coins)
CREATE POLICY "Authenticated can view public profile fields"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);
