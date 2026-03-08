-- Allow barbers to update their own appointments
CREATE POLICY "Barbers can update own appointments"
ON public.painel_agendamentos
FOR UPDATE
TO authenticated
USING (
  barbeiro_id IN (
    SELECT pb.id FROM painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
  )
)
WITH CHECK (
  barbeiro_id IN (
    SELECT pb.id FROM painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
  )
);