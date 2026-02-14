
-- Remove the overly broad policy we just added
DROP POLICY IF EXISTS "Authenticated can view public profile fields" ON public.profiles;

-- Drop the view - we'll use an RPC instead
DROP VIEW IF EXISTS public.public_profiles;

-- Create a secure RPC to get public profile data (excludes phone, coins)
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  gender text,
  followers integer,
  following integer,
  is_blocked boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, user_id, display_name, avatar_url, bio, gender, followers, following, is_blocked, created_at, updated_at
  FROM public.profiles;
$$;

-- Create RPC to get a single public profile by user_id
CREATE OR REPLACE FUNCTION public.get_public_profile(_user_id uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  bio text,
  gender text,
  followers integer,
  following integer,
  is_blocked boolean,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT id, user_id, display_name, avatar_url, bio, gender, followers, following, is_blocked, created_at, updated_at
  FROM public.profiles
  WHERE profiles.user_id = _user_id;
$$;
