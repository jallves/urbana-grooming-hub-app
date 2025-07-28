
-- Corrigir políticas RLS para finance_transactions
DROP POLICY IF EXISTS "Admins can manage finance transactions" ON public.finance_transactions;

CREATE POLICY "Admins can manage finance transactions"
ON public.finance_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'::app_role
  )
);

-- Permitir que triggers automatizados criem transações financeiras
CREATE POLICY "Allow system to create finance transactions"
ON public.finance_transactions
FOR INSERT
WITH CHECK (true);

-- Permitir que barbeiros vejam suas próprias transações
CREATE POLICY "Barbers can view own transactions"
ON public.finance_transactions
FOR SELECT
USING (
  barbeiro_id IN (
    SELECT s.id FROM public.staff s
    INNER JOIN public.painel_barbeiros pb ON s.id = pb.staff_id
    WHERE s.email = auth.email()
  )
);

-- Corrigir trigger para funcionar com RLS
CREATE OR REPLACE FUNCTION public.calculate_financial_commission()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_commission_rate NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
  staff_user_id UUID;
BEGIN
  -- Só processa se o status mudou para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Buscar dados do barbeiro (staff)
    SELECT s.commission_rate, s.id
    INTO staff_commission_rate, staff_user_id
    FROM public.staff s
    INNER JOIN public.painel_barbeiros pb ON s.id = pb.staff_id
    WHERE pb.id = NEW.barbeiro_id;
    
    -- Buscar preço do serviço
    SELECT preco INTO service_price
    FROM public.painel_servicos 
    WHERE id = NEW.servico_id;
    
    -- Calcular comissão
    IF staff_commission_rate IS NOT NULL AND service_price IS NOT NULL THEN
      commission_amount := service_price * (staff_commission_rate / 100);
      
      -- Criar transação de receita (usando SECURITY DEFINER para bypass RLS)
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'receita', 'corte', 'Serviço realizado', service_price, NEW.data, NEW.id, 
        staff_user_id, 'pago'
      );
      
      -- Criar transação de despesa (comissão)
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'despesa', 'comissao', 'Comissão do barbeiro', commission_amount, NEW.data, NEW.id,
        staff_user_id, 'pago'
      );
      
      -- Criar registro de comissão
      INSERT INTO public.comissoes (
        agendamento_id, barbeiro_id, valor, percentual, data, status
      ) VALUES (
        NEW.id, 
        staff_user_id,
        commission_amount, staff_commission_rate, NEW.data, 'gerado'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Garantir que o trigger existe
DROP TRIGGER IF EXISTS calculate_financial_commission_trigger ON public.painel_agendamentos;
CREATE TRIGGER calculate_financial_commission_trigger
  AFTER UPDATE ON public.painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_financial_commission();
