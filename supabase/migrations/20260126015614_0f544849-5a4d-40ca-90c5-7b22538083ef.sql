-- Adicionar políticas RLS para permitir que barbeiros gerenciem seus próprios bloqueios
-- Atualmente só admins podem modificar, mas barbeiros precisam bloquear seus horários

-- Política para barbeiros criarem bloqueios (INSERT)
CREATE POLICY "Barbers can create own availability blocks"
ON barber_availability
FOR INSERT
WITH CHECK (
  barber_id IN (
    SELECT s.id 
    FROM staff s
    JOIN painel_barbeiros pb ON pb.staff_id = s.staff_id
    WHERE pb.staff_id = auth.uid()
  )
);

-- Política para barbeiros atualizarem seus bloqueios (UPDATE)
CREATE POLICY "Barbers can update own availability blocks"
ON barber_availability
FOR UPDATE
USING (
  barber_id IN (
    SELECT s.id 
    FROM staff s
    JOIN painel_barbeiros pb ON pb.staff_id = s.staff_id
    WHERE pb.staff_id = auth.uid()
  )
);

-- Política para barbeiros deletarem seus bloqueios (DELETE)
CREATE POLICY "Barbers can delete own availability blocks"
ON barber_availability
FOR DELETE
USING (
  barber_id IN (
    SELECT s.id 
    FROM staff s
    JOIN painel_barbeiros pb ON pb.staff_id = s.staff_id
    WHERE pb.staff_id = auth.uid()
  )
);