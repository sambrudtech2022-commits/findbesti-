
-- 1. Create SECURITY DEFINER function for gift sending with balance check
CREATE OR REPLACE FUNCTION public.send_gift(
  _receiver_id uuid,
  _gift_id text,
  _gift_name text,
  _gift_emoji text,
  _coins_spent integer,
  _channel_name text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _sender_id uuid := auth.uid();
  _current_coins integer;
BEGIN
  IF _sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF _coins_spent <= 0 THEN
    RAISE EXCEPTION 'Invalid coin amount';
  END IF;

  -- Get and lock sender's balance
  SELECT coins INTO _current_coins
  FROM public.profiles
  WHERE user_id = _sender_id
  FOR UPDATE;

  IF _current_coins IS NULL OR _current_coins < _coins_spent THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;

  -- Deduct coins
  UPDATE public.profiles
  SET coins = coins - _coins_spent
  WHERE user_id = _sender_id;

  -- Record transaction
  INSERT INTO public.gift_transactions (sender_id, receiver_id, gift_id, gift_name, gift_emoji, coins_spent, channel_name)
  VALUES (_sender_id, _receiver_id, _gift_id, _gift_name, _gift_emoji, _coins_spent, _channel_name);
END;
$$;

-- Remove direct INSERT policy on gift_transactions (now handled by function)
DROP POLICY IF EXISTS "Users can send gifts" ON public.gift_transactions;

-- 2. Fix referral code restriction on profiles INSERT
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

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
  AND referral_code IS NULL
);
