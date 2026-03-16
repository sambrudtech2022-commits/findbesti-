-- 1) Prevent client-side fabricated purchase records
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.purchases;

-- 2) Add explicit deny policy for otp_codes (defense in depth)
DROP POLICY IF EXISTS "Deny all direct access to otp_codes" ON public.otp_codes;
CREATE POLICY "Deny all direct access to otp_codes"
ON public.otp_codes
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 3) Add secure premium subscriptions table
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_name text NOT NULL,
  amount integer NOT NULL,
  status text NOT NULL DEFAULT 'active',
  started_at timestamp with time zone NOT NULL DEFAULT now(),
  ends_at timestamp with time zone NOT NULL,
  payment_id text NOT NULL,
  order_id text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS premium_subscriptions_payment_id_key
  ON public.premium_subscriptions (payment_id);

CREATE UNIQUE INDEX IF NOT EXISTS premium_subscriptions_order_id_key
  ON public.premium_subscriptions (order_id);

CREATE INDEX IF NOT EXISTS premium_subscriptions_user_id_idx
  ON public.premium_subscriptions (user_id);

ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own premium subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Users can view own premium subscriptions"
ON public.premium_subscriptions
FOR SELECT
TO authenticated
USING ((auth.uid() = user_id) OR public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Admins can update premium subscriptions" ON public.premium_subscriptions;
CREATE POLICY "Admins can update premium subscriptions"
ON public.premium_subscriptions
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP TRIGGER IF EXISTS update_premium_subscriptions_updated_at ON public.premium_subscriptions;
CREATE TRIGGER update_premium_subscriptions_updated_at
BEFORE UPDATE ON public.premium_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Restrict sensitive profile fields from direct user updates
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

  -- Regular users cannot modify sensitive fields
  IF NEW.coins IS DISTINCT FROM OLD.coins
     OR NEW.is_blocked IS DISTINCT FROM OLD.is_blocked
     OR NEW.referred_by IS DISTINCT FROM OLD.referred_by
     OR NEW.referral_code IS DISTINCT FROM OLD.referral_code
     OR NEW.followers IS DISTINCT FROM OLD.followers
     OR NEW.following IS DISTINCT FROM OLD.following
     OR NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Updating restricted profile fields is not allowed';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_sensitive_fields_trigger ON public.profiles;
CREATE TRIGGER protect_profile_sensitive_fields_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_sensitive_fields();

-- Keep admin tooling functional for moderation actions
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));