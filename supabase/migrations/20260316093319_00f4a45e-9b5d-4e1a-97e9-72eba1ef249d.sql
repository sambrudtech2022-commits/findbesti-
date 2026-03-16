
-- Drop existing permissive user UPDATE policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create restricted UPDATE policy - only allow safe columns
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND coins IS NOT DISTINCT FROM (SELECT p.coins FROM public.profiles p WHERE p.user_id = auth.uid())
  AND is_blocked IS NOT DISTINCT FROM (SELECT p.is_blocked FROM public.profiles p WHERE p.user_id = auth.uid())
  AND followers IS NOT DISTINCT FROM (SELECT p.followers FROM public.profiles p WHERE p.user_id = auth.uid())
  AND following IS NOT DISTINCT FROM (SELECT p.following FROM public.profiles p WHERE p.user_id = auth.uid())
  AND referred_by IS NOT DISTINCT FROM (SELECT p.referred_by FROM public.profiles p WHERE p.user_id = auth.uid())
  AND referral_code IS NOT DISTINCT FROM (SELECT p.referral_code FROM public.profiles p WHERE p.user_id = auth.uid())
);

-- Drop existing permissive user INSERT policy
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create restricted INSERT policy - system fields must be defaults
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND (coins IS NULL OR coins = 0)
  AND (is_blocked IS NULL OR is_blocked = false)
  AND (followers IS NULL OR followers = 0)
  AND (following IS NULL OR following = 0)
  AND referred_by IS NULL
);
