
-- Notifications table for admin-to-user notifications
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'general',
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User notification read tracking
CREATE TABLE public.user_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(notification_id, user_id)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Admins can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can view notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can delete notifications"
ON public.notifications FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'));

-- User notifications policies
CREATE POLICY "Users can view own notification status"
ON public.user_notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification status"
ON public.user_notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert user notifications"
ON public.user_notifications FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Function to broadcast notification to all users
CREATE OR REPLACE FUNCTION public.broadcast_notification(_notification_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_notifications (notification_id, user_id)
  SELECT _notification_id, p.user_id
  FROM public.profiles p
  WHERE p.is_blocked = false OR p.is_blocked IS NULL
  ON CONFLICT (notification_id, user_id) DO NOTHING;
END;
$$;
