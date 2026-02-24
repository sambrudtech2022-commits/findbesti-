
-- Add referral_code column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by UUID;

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = UPPER(SUBSTRING(md5(random()::text || user_id::text) FROM 1 FOR 8)) WHERE referral_code IS NULL;

-- Create function to auto-generate referral code for new profiles
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := UPPER(SUBSTRING(md5(random()::text || NEW.user_id::text) FROM 1 FOR 8));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Create referrals tracking table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  coins_awarded INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own referrals" ON public.referrals
FOR SELECT USING (auth.uid() = referrer_id);

CREATE POLICY "Admins can view all referrals" ON public.referrals
FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- Function to apply referral code (called from edge function)
CREATE OR REPLACE FUNCTION public.apply_referral(
  _referred_user_id UUID,
  _referral_code TEXT,
  _bonus_coins INTEGER DEFAULT 50
)
RETURNS VOID AS $$
DECLARE
  _referrer_id UUID;
BEGIN
  -- Find referrer
  SELECT user_id INTO _referrer_id FROM public.profiles WHERE referral_code = _referral_code;
  IF _referrer_id IS NULL THEN
    RAISE EXCEPTION 'Invalid referral code';
  END IF;
  IF _referrer_id = _referred_user_id THEN
    RAISE EXCEPTION 'Cannot refer yourself';
  END IF;

  -- Record referral
  INSERT INTO public.referrals (referrer_id, referred_id, coins_awarded)
  VALUES (_referrer_id, _referred_user_id, _bonus_coins);

  -- Award coins to referrer
  UPDATE public.profiles SET coins = COALESCE(coins, 0) + _bonus_coins WHERE user_id = _referrer_id;

  -- Mark referred user
  UPDATE public.profiles SET referred_by = _referrer_id WHERE user_id = _referred_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
