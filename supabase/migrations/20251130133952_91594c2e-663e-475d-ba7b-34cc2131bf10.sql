-- Corrigir políticas RLS da tabela barber_availability para barbeiros

-- Remover políticas antigas incorretas
DROP POLICY IF EXISTS "Only staff can manage their availability" ON public.barber_availability;
DROP POLICY IF EXISTS "Only staff can update their availability" ON public.barber_availability;
DROP POLICY IF EXISTS "Only staff can delete their availability" ON public.barber_availability;

-- Criar política correta para INSERT - barbeiro pode criar seus próprios bloqueios
CREATE POLICY "Barbers can insert their own availability blocks"
ON public.barber_availability
FOR INSERT
TO authenticated
WITH CHECK (
  barber_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- Criar política correta para UPDATE - barbeiro pode atualizar seus próprios bloqueios
CREATE POLICY "Barbers can update their own availability blocks"
ON public.barber_availability
FOR UPDATE
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- Criar política correta para DELETE - barbeiro pode deletar seus próprios bloqueios
CREATE POLICY "Barbers can delete their own availability blocks"
ON public.barber_availability
FOR DELETE
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM public.staff WHERE user_id = auth.uid()
  )
);

-- Habilitar realtime para a tabela
ALTER TABLE public.barber_availability REPLICA IDENTITY FULL;

-- Adicionar à publicação de realtime se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'barber_availability'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.barber_availability;
  END IF;
END $$;