
CREATE TABLE public.coin_packs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coins integer NOT NULL,
  price integer NOT NULL,
  save_percent text,
  popular boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.coin_packs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active coin packs" ON public.coin_packs
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admins can insert coin packs" ON public.coin_packs
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update coin packs" ON public.coin_packs
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete coin packs" ON public.coin_packs
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
