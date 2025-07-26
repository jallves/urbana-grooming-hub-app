
-- Adicionar campos necessários na tabela barber_commissions para controle de pagamento
ALTER TABLE public.barber_commissions 
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Criar uma função para calcular comissão automaticamente quando agendamento é concluído
CREATE OR REPLACE FUNCTION public.calculate_commission_painel()
RETURNS TRIGGER AS $$
DECLARE
  staff_commission_rate NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Só processa se o status mudou para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Buscar dados do barbeiro (staff) - especificar qual commission_rate usar
    SELECT s.commission_rate 
    INTO staff_commission_rate
    FROM public.staff s
    INNER JOIN public.painel_barbeiros pb ON s.id = pb.staff_id
    WHERE pb.id = NEW.barbeiro_id;
    
    -- Buscar preço do serviço
    SELECT preco INTO service_price
    FROM public.painel_servicos 
    WHERE id = NEW.servico_id;
    
    -- Calcular comissão (usar taxa do staff)
    IF staff_commission_rate IS NOT NULL AND service_price IS NOT NULL THEN
      commission_amount := service_price * (staff_commission_rate / 100);
      
      -- Criar registro de comissão na tabela barber_commissions
      INSERT INTO public.barber_commissions (
        appointment_id, 
        barber_id, 
        amount, 
        commission_rate,
        status
      ) VALUES (
        NEW.id, 
        (SELECT staff_id FROM public.painel_barbeiros WHERE id = NEW.barbeiro_id),
        commission_amount,
        staff_commission_rate,
        'pending'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para calcular comissão automaticamente no painel
DROP TRIGGER IF EXISTS calculate_commission_painel_trigger ON public.painel_agendamentos;
CREATE TRIGGER calculate_commission_painel_trigger
  AFTER UPDATE ON public.painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission_painel();

-- Criar uma tabela para registrar fluxo de caixa
CREATE TABLE IF NOT EXISTS public.cash_flow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('income', 'expense')),
  amount NUMERIC NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  payment_method TEXT,
  reference_id UUID,
  reference_type TEXT,
  notes TEXT,
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela cash_flow
ALTER TABLE public.cash_flow ENABLE ROW LEVEL SECURITY;

-- Criar política RLS para admins
CREATE POLICY "Admins can manage cash flow" ON public.cash_flow
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Criar trigger para updated_at na tabela cash_flow
CREATE TRIGGER update_cash_flow_updated_at
  BEFORE UPDATE ON public.cash_flow
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir algumas categorias padrão de fluxo de caixa
INSERT INTO public.cash_flow_categories (name, type, color, icon) VALUES
('Serviços', 'income', '#10B981', 'scissors'),
('Produtos', 'income', '#059669', 'package'),
('Comissões', 'expense', '#EF4444', 'percent'),
('Aluguel', 'expense', '#DC2626', 'home'),
('Energia', 'expense', '#F59E0B', 'zap'),
('Água', 'expense', '#3B82F6', 'droplets'),
('Internet', 'expense', '#8B5CF6', 'wifi'),
('Material', 'expense', '#6B7280', 'shopping-cart')
ON CONFLICT (name) DO NOTHING;
