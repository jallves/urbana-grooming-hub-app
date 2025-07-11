-- Verificar se há trigger para calcular comissão na tabela painel_agendamentos
-- Se não houver, criar um novo trigger que funcione com painel_agendamentos

-- Função para calcular comissão automaticamente na tabela painel_agendamentos
CREATE OR REPLACE FUNCTION public.calculate_commission_painel()
RETURNS TRIGGER AS $$
DECLARE
  staff_commission_rate NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
BEGIN
  -- Só processa se o status mudou para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Buscar dados do barbeiro (staff)
    SELECT commission_rate 
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

-- Trigger para criar comissão automaticamente na tabela painel_agendamentos
DROP TRIGGER IF EXISTS trigger_calculate_commission_painel ON public.painel_agendamentos;
CREATE TRIGGER trigger_calculate_commission_painel
  AFTER UPDATE ON public.painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_commission_painel();