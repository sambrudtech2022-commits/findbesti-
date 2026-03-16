
-- Remove the overly permissive SELECT policy that lets any authenticated user read all notifications
DROP POLICY IF EXISTS "Authenticated users can view notifications" ON public.notifications;
