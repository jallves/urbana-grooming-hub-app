
-- Corrigir política de ticket_responses usando client_id ao invés de user_id
CREATE POLICY "Users can view their ticket_responses"
ON public.ticket_responses
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.support_tickets st
    WHERE st.id = ticket_responses.ticket_id
    AND st.client_id = auth.uid()
  )
);
