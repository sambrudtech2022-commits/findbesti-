
-- Create purchases table to track user purchases
CREATE TABLE public.purchases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_name TEXT NOT NULL,
  amount INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'completed',
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view own purchases
CREATE POLICY "Users can view own purchases"
ON public.purchases
FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Users can insert own purchases
CREATE POLICY "Users can insert own purchases"
ON public.purchases
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can update purchases
CREATE POLICY "Admins can update purchases"
ON public.purchases
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
