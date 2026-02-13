
-- Allow admins to update withdrawal requests
CREATE POLICY "Admins can update withdrawals"
ON public.withdrawal_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
