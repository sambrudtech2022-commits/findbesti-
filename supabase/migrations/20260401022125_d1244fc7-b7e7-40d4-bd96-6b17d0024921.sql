
CREATE TABLE public.legal_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_type text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.legal_pages ENABLE ROW LEVEL SECURITY;

-- Anyone can read legal pages
CREATE POLICY "Anyone can read legal pages"
ON public.legal_pages FOR SELECT
TO authenticated
USING (true);

-- Allow anonymous read too (for auth page)
CREATE POLICY "Public can read legal pages"
ON public.legal_pages FOR SELECT
TO anon
USING (true);

-- Admins can update legal pages
CREATE POLICY "Admins can update legal pages"
ON public.legal_pages FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admins can insert legal pages
CREATE POLICY "Admins can insert legal pages"
ON public.legal_pages FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seed default rows
INSERT INTO public.legal_pages (page_type, title, content) VALUES
('privacy_policy', 'Privacy Policy', ''),
('terms_conditions', 'Terms & Conditions', '');
