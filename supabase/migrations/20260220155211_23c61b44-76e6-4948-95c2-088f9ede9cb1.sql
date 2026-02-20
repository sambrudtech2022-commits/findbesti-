
-- Create gift_transactions table
CREATE TABLE public.gift_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL,
  receiver_id UUID NOT NULL,
  gift_id TEXT NOT NULL,
  gift_name TEXT NOT NULL,
  gift_emoji TEXT NOT NULL,
  coins_spent INTEGER NOT NULL,
  channel_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_transactions ENABLE ROW LEVEL SECURITY;

-- Users can send gifts (insert)
CREATE POLICY "Users can send gifts"
ON public.gift_transactions
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Users can view gifts in their calls
CREATE POLICY "Users can view gifts sent or received"
ON public.gift_transactions
FOR SELECT
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Admins can view all
CREATE POLICY "Admins can view all gifts"
ON public.gift_transactions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for gift_transactions
ALTER PUBLICATION supabase_realtime ADD TABLE public.gift_transactions;
