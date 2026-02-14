
-- App settings table (single row pattern)
CREATE TABLE public.app_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  maintenance_mode BOOLEAN NOT NULL DEFAULT false,
  maintenance_message TEXT DEFAULT 'App under maintenance. Please try again later.',
  min_app_version TEXT DEFAULT '1.0.0',
  announcement_text TEXT,
  announcement_active BOOLEAN NOT NULL DEFAULT false,
  announcement_type TEXT NOT NULL DEFAULT 'info',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings
CREATE POLICY "Anyone can read app settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

-- Only admins can update
CREATE POLICY "Admins can update app settings"
ON public.app_settings FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- Insert initial row
INSERT INTO public.app_settings (maintenance_mode, announcement_active) VALUES (false, false);
