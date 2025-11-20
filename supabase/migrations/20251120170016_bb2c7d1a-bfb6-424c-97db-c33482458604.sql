-- Habilitar RLS na tabela barber_commissions
ALTER TABLE public.barber_commissions ENABLE ROW LEVEL SECURITY;

-- Política para barbeiros visualizarem suas próprias comissões
CREATE POLICY "Barbeiros podem ver suas próprias comissões"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM public.staff 
    WHERE user_id = auth.uid() 
    OR email = auth.jwt()->>'email'
  )
);

-- Política para admins visualizarem todas as comissões
CREATE POLICY "Admins podem ver todas as comissões"
ON public.barber_commissions
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
);

-- Política para staff inserir comissões (sistema)
CREATE POLICY "Sistema pode criar comissões"
ON public.barber_commissions
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Política para admins atualizarem comissões
CREATE POLICY "Admins podem atualizar comissões"
ON public.barber_commissions
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
)
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
);