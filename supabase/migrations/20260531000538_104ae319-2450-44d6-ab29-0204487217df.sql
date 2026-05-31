-- Corrigir RLS de contas_pagar para barbeiros: comparar fornecedor x painel_barbeiros.nome
-- ignorando espaços e diferenças de caixa (case-insensitive + trim)

DROP POLICY IF EXISTS "Barbers can view own contas_pagar entries" ON public.contas_pagar;

CREATE POLICY "Barbers can view own contas_pagar entries"
ON public.contas_pagar
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.painel_barbeiros pb
    WHERE pb.staff_id = auth.uid()
      AND lower(trim(pb.nome)) = lower(trim(contas_pagar.fornecedor))
  )
);

-- Normaliza nomes existentes para evitar o mesmo problema em outras consultas
UPDATE public.painel_barbeiros
SET nome = trim(nome)
WHERE nome <> trim(nome);