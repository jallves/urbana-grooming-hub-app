-- Adicionar política RLS para permitir que barbeiros atualizem seu próprio available_for_booking
CREATE POLICY "Barbers can update own availability"
ON public.painel_barbeiros
FOR UPDATE
TO authenticated
USING (
  (email = auth.email() AND is_active = true)
  OR has_role(auth.uid(), 'barber'::app_role)
)
WITH CHECK (
  (email = auth.email() AND is_active = true)  
  OR has_role(auth.uid(), 'barber'::app_role)
);

-- Comentário explicativo
COMMENT ON POLICY "Barbers can update own availability" ON public.painel_barbeiros IS 
'Permite que barbeiros atualizem o campo available_for_booking em seus próprios registros para controlar se aparecem como disponíveis para novos agendamentos';