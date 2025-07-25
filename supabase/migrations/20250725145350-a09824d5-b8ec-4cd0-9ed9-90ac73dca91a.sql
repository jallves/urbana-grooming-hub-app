
-- Criar tabela para transações financeiras
CREATE TABLE public.finance_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL CHECK (tipo IN ('receita', 'despesa')),
  categoria TEXT NOT NULL DEFAULT 'geral',
  descricao TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  agendamento_id UUID REFERENCES public.painel_agendamentos(id),
  barbeiro_id UUID REFERENCES public.staff(id),
  status TEXT NOT NULL DEFAULT 'pago' CHECK (status IN ('pago', 'pendente')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para comissões
CREATE TABLE public.comissoes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agendamento_id UUID NOT NULL REFERENCES public.painel_agendamentos(id),
  barbeiro_id UUID NOT NULL REFERENCES public.staff(id),
  valor NUMERIC NOT NULL,
  percentual NUMERIC NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'gerado' CHECK (status IN ('gerado', 'pago')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para despesas fixas
CREATE TABLE public.fixed_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  vencimento DATE NOT NULL,
  pago_em DATE,
  recorrente BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS nas tabelas
ALTER TABLE public.finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comissoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fixed_expenses ENABLE ROW LEVEL SECURITY;

-- Criar políticas RLS para admins
CREATE POLICY "Admins can manage finance transactions" ON public.finance_transactions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage comissoes" ON public.comissoes
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage fixed expenses" ON public.fixed_expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Criar função para calcular comissão automaticamente
CREATE OR REPLACE FUNCTION public.calculate_financial_commission()
RETURNS TRIGGER AS $$
DECLARE
  staff_commission_rate NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Só processa se o status mudou para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Buscar dados do barbeiro (staff)
    SELECT s.commission_rate 
    INTO staff_commission_rate
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
      
      -- Criar transação de receita
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'receita', 'corte', 'Serviço realizado', service_price, NEW.data, NEW.id, 
        (SELECT staff_id FROM public.painel_barbeiros WHERE id = NEW.barbeiro_id), 'pago'
      );
      
      -- Criar transação de despesa (comissão)
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'despesa', 'comissao', 'Comissão do barbeiro', commission_amount, NEW.data, NEW.id,
        (SELECT staff_id FROM public.painel_barbeiros WHERE id = NEW.barbeiro_id), 'pago'
      );
      
      -- Criar registro de comissão
      INSERT INTO public.comissoes (
        agendamento_id, barbeiro_id, valor, percentual, data, status
      ) VALUES (
        NEW.id, 
        (SELECT staff_id FROM public.painel_barbeiros WHERE id = NEW.barbeiro_id),
        commission_amount, staff_commission_rate, NEW.data, 'gerado'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular comissão automaticamente
CREATE TRIGGER calculate_financial_commission_trigger
  AFTER UPDATE ON public.painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_financial_commission();

-- Criar função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar triggers para updated_at
CREATE TRIGGER update_finance_transactions_updated_at
  BEFORE UPDATE ON public.finance_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comissoes_updated_at
  BEFORE UPDATE ON public.comissoes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_fixed_expenses_updated_at
  BEFORE UPDATE ON public.fixed_expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
