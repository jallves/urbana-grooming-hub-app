
-- 1. Padronizar status em barber_commissions: 'pendente' → 'pending', 'pago' → 'paid'
UPDATE barber_commissions SET status = 'pending' WHERE status = 'pendente';
UPDATE barber_commissions SET status = 'paid' WHERE status = 'pago';

-- 2. Melhorar o trigger: casar primeiro por venda_id (confiável), com fallback para o método antigo
CREATE OR REPLACE FUNCTION public.sync_commission_payment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_matched_count INTEGER := 0;
BEGIN
  -- Quando uma conta_pagar é atualizada para 'pago'
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN

    -- ESTRATÉGIA 1: Match por venda_id (mais confiável)
    IF NEW.venda_id IS NOT NULL THEN
      UPDATE barber_commissions bc
      SET 
        status = 'paid',
        data_pagamento = NEW.data_pagamento,
        payment_date = NEW.data_pagamento
      WHERE 
        bc.status IN ('pending', 'pendente')
        AND bc.venda_id = NEW.venda_id
        AND bc.valor = NEW.valor;
      
      GET DIAGNOSTICS v_matched_count = ROW_COUNT;

      UPDATE financial_records fr
      SET 
        status = 'completed',
        payment_date = NEW.data_pagamento
      WHERE 
        fr.status = 'pending'
        AND fr.transaction_type = 'commission'
        AND fr.reference_id = NEW.venda_id
        AND fr.amount = NEW.valor;
    END IF;

    -- ESTRATÉGIA 2 (fallback): Match por nome+valor+data quando venda_id está nulo OU não houve match
    IF v_matched_count = 0 THEN
      UPDATE barber_commissions bc
      SET 
        status = 'paid',
        data_pagamento = NEW.data_pagamento,
        payment_date = NEW.data_pagamento
      WHERE 
        bc.status IN ('pending', 'pendente')
        AND bc.valor = NEW.valor
        AND bc.barber_name ILIKE '%' || NEW.fornecedor || '%'
        AND bc.created_at::date = NEW.created_at::date;
      
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- 3. Garantir que o trigger esteja ativo
DROP TRIGGER IF EXISTS trg_sync_commission_payment_status ON contas_pagar;
CREATE TRIGGER trg_sync_commission_payment_status
AFTER UPDATE ON contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.sync_commission_payment_status();

-- 4. Reconciliação retroativa: marcar como 'paid' todas as barber_commissions cuja venda_id já tem contas_pagar 'pago'
UPDATE barber_commissions bc
SET 
  status = 'paid',
  data_pagamento = COALESCE(bc.data_pagamento, cp.data_pagamento),
  payment_date = COALESCE(bc.payment_date, cp.data_pagamento)
FROM contas_pagar cp
WHERE bc.status IN ('pending', 'pendente')
  AND bc.venda_id IS NOT NULL
  AND bc.venda_id = cp.venda_id
  AND bc.valor = cp.valor
  AND cp.status = 'pago';

-- 5. Mesma reconciliação para financial_records
UPDATE financial_records fr
SET 
  status = 'completed',
  payment_date = COALESCE(fr.payment_date, cp.data_pagamento)
FROM contas_pagar cp
WHERE fr.status = 'pending'
  AND fr.transaction_type = 'commission'
  AND fr.reference_id IS NOT NULL
  AND fr.reference_id = cp.venda_id
  AND fr.amount = cp.valor
  AND cp.status = 'pago';
