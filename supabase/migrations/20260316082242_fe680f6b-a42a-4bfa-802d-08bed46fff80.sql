CREATE OR REPLACE FUNCTION public.protect_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Allow trusted server-side flows and migrations
  IF current_user IN ('postgres', 'service_role', 'supabase_admin') THEN
    RETURN NEW;
  END IF;

  -- Allow admins
  IF public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RETURN NEW;
  END IF;

  -- Regular users cannot modify block/referral/follower identity fields
  IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.followers IS DISTINCT FROM OLD.followers
     OR NEW.following IS DISTINCT FROM OLD.following
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Updating restricted profile fields is not allowed';
  END IF;

  -- Regular users cannot increase coins or set invalid balances
  IF NEW.coins IS DISTINCT FROM OLD.coins THEN
    IF NEW.coins IS NULL OR NEW.coins < 0 OR NEW.coins > COALESCE(OLD.coins, 0) THEN
      RAISE EXCEPTION 'Invalid coin balance update';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;