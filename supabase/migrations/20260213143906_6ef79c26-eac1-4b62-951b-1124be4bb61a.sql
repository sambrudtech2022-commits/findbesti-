
-- Task completions table
CREATE TABLE public.task_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  task_id TEXT NOT NULL,
  coins_earned INTEGER NOT NULL DEFAULT 0,
  completed_date DATE NOT NULL DEFAULT CURRENT_DATE,
  completed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, task_id, completed_date)
);

ALTER TABLE public.task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
ON public.task_completions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
ON public.task_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Withdrawal requests table
CREATE TABLE public.withdrawal_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  amount INTEGER NOT NULL,
  upi_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.withdrawal_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own withdrawals"
ON public.withdrawal_requests FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own withdrawals"
ON public.withdrawal_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_withdrawal_requests_updated_at
BEFORE UPDATE ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add coins on task completion
CREATE OR REPLACE FUNCTION public.add_coins_on_task_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET coins = COALESCE(coins, 0) + NEW.coins_earned
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_add_coins_on_task
AFTER INSERT ON public.task_completions
FOR EACH ROW
EXECUTE FUNCTION public.add_coins_on_task_completion();

-- Deduct coins on withdrawal
CREATE OR REPLACE FUNCTION public.deduct_coins_on_withdrawal()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF (SELECT COALESCE(coins, 0) FROM public.profiles WHERE user_id = NEW.user_id) < NEW.amount THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  UPDATE public.profiles
  SET coins = COALESCE(coins, 0) - NEW.amount
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_deduct_coins_on_withdrawal
BEFORE INSERT ON public.withdrawal_requests
FOR EACH ROW
EXECUTE FUNCTION public.deduct_coins_on_withdrawal();
