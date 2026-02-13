
-- Allow admins to view all withdrawal requests
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawal_requests
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
