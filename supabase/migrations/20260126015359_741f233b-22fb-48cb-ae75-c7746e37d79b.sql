
-- Criar trigger para sincronizar status entre contas_pagar e barber_commissions
-- Quando uma conta a pagar é marcada como "pago", atualiza a comissão correspondente

CREATE OR REPLACE FUNCTION public.sync_commission_payment_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Quando uma conta_pagar é atualizada para 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN
    -- Atualiza barber_commissions correspondente
    -- Match por fornecedor (nome do barbeiro) + valor + data similar
    UPDATE barber_commissions bc
    SET 
      status = 'pago',
      data_pagamento = NEW.data_pagamento,
      payment_date = NEW.data_pagamento
    WHERE 
      bc.status = 'pending'
      AND bc.valor = NEW.valor
      AND bc.barber_name ILIKE '%' || NEW.fornecedor || '%'
      AND bc.created_at::date = NEW.created_at::date;
    
    -- Também atualiza financial_records correspondente
    UPDATE financial_records fr
    SET 
      status = 'completed',
      payment_date = NEW.data_pagamento
    WHERE 
      fr.status = 'pending'
      AND fr.transaction_type = 'commission'
      AND fr.amount = NEW.valor
      AND fr.barber_name ILIKE '%' || NEW.fornecedor || '%'
      AND fr.created_at::date = NEW.created_at::date;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar o trigger
DROP TRIGGER IF EXISTS trigger_sync_commission_payment ON contas_pagar;
CREATE TRIGGER trigger_sync_commission_payment
  AFTER UPDATE ON contas_pagar
  FOR EACH ROW
  EXECUTE FUNCTION sync_commission_payment_status();

-- Agora, corrigir os dados históricos do Thomas Jefferson
-- Atualizar todas as comissões que já foram pagas em contas_pagar

UPDATE barber_commissions bc
SET 
  status = 'pago',
  data_pagamento = cp.data_pagamento,
  payment_date = cp.data_pagamento
FROM contas_pagar cp
WHERE 
  bc.status = 'pending'
  AND bc.barber_name ILIKE '%' || cp.fornecedor || '%'
  AND bc.valor = cp.valor
  AND cp.status = 'pago'
  AND bc.created_at::date = cp.created_at::date;

-- Atualizar financial_records também
UPDATE financial_records fr
SET 
  status = 'completed',
  payment_date = cp.data_pagamento
FROM contas_pagar cp
WHERE 
  fr.status = 'pending'
  AND fr.transaction_type = 'commission'
  AND fr.barber_name ILIKE '%' || cp.fornecedor || '%'
  AND fr.amount = cp.valor
  AND cp.status = 'pago'
  AND fr.created_at::date = cp.created_at::date;
