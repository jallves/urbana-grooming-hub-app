
-- 1) Reforçar a trigger para garantir match de gorjetas (e demais tipos) também pelo tipo
CREATE OR REPLACE FUNCTION public.sync_commission_payment_status()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_matched_count INTEGER := 0;
  v_is_gorjeta BOOLEAN := false;
BEGIN
  IF NEW.status = 'pago' AND (OLD.status IS NULL OR OLD.status != 'pago') THEN

    v_is_gorjeta := (
      COALESCE(NEW.categoria, '') ILIKE '%gorjeta%'
      OR COALESCE(NEW.descricao, '') ILIKE '%gorjeta%'
      OR COALESCE(NEW.observacoes, '') ILIKE '%gorjeta%'
    );

    -- ESTRATÉGIA 1: Match por venda_id (mais confiável)
    IF NEW.venda_id IS NOT NULL THEN
      UPDATE barber_commissions bc
      SET status = 'paid',
          data_pagamento = NEW.data_pagamento,
          payment_date = NEW.data_pagamento
      WHERE bc.status IN ('pending', 'pendente')
        AND bc.venda_id = NEW.venda_id
        AND bc.valor = NEW.valor;
      GET DIAGNOSTICS v_matched_count = ROW_COUNT;

      UPDATE financial_records fr
      SET status = 'completed', payment_date = NEW.data_pagamento
      WHERE fr.status = 'pending'
        AND fr.transaction_type IN ('commission', 'tip')
        AND fr.reference_id = NEW.venda_id
        AND fr.amount = NEW.valor;
    END IF;

    -- ESTRATÉGIA 2 (fallback): nome + valor + data, considerando tipo gorjeta
    IF v_matched_count = 0 THEN
      UPDATE barber_commissions bc
      SET status = 'paid',
          data_pagamento = NEW.data_pagamento,
          payment_date = NEW.data_pagamento
      WHERE bc.status IN ('pending', 'pendente')
        AND bc.valor = NEW.valor
        AND bc.barber_name ILIKE '%' || COALESCE(NEW.fornecedor, '') || '%'
        AND bc.created_at::date = NEW.created_at::date
        AND (
          NOT v_is_gorjeta
          OR bc.tipo IN ('gorjeta', 'tip')
        );
      GET DIAGNOSTICS v_matched_count = ROW_COUNT;

      UPDATE financial_records fr
      SET status = 'completed', payment_date = NEW.data_pagamento
      WHERE fr.status = 'pending'
        AND fr.transaction_type IN ('commission', 'tip')
        AND fr.amount = NEW.valor
        AND fr.barber_name ILIKE '%' || COALESCE(NEW.fornecedor, '') || '%'
        AND fr.created_at::date = NEW.created_at::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 2) Garantir trigger ativa
DROP TRIGGER IF EXISTS trg_sync_commission_payment_status ON public.contas_pagar;
CREATE TRIGGER trg_sync_commission_payment_status
AFTER UPDATE ON public.contas_pagar
FOR EACH ROW
EXECUTE FUNCTION public.sync_commission_payment_status();

-- 3) Reconciliação retroativa: para toda conta_pagar PAGA com fornecedor de gorjeta
-- marcar a comissão correspondente como paga
UPDATE barber_commissions bc
SET status = 'paid',
    data_pagamento = cp.data_pagamento,
    payment_date = cp.data_pagamento
FROM contas_pagar cp
WHERE bc.status IN ('pending', 'pendente')
  AND bc.tipo IN ('gorjeta', 'tip')
  AND cp.status = 'pago'
  AND (cp.categoria ILIKE '%gorjeta%' OR cp.descricao ILIKE '%gorjeta%')
  AND bc.valor = cp.valor
  AND bc.barber_name ILIKE '%' || COALESCE(cp.fornecedor, '') || '%'
  AND bc.created_at::date = cp.created_at::date;

UPDATE financial_records fr
SET status = 'completed', payment_date = cp.data_pagamento
FROM contas_pagar cp
WHERE fr.status = 'pending'
  AND fr.transaction_type IN ('commission', 'tip')
  AND cp.status = 'pago'
  AND (cp.categoria ILIKE '%gorjeta%' OR cp.descricao ILIKE '%gorjeta%')
  AND fr.amount = cp.valor
  AND fr.barber_name ILIKE '%' || COALESCE(cp.fornecedor, '') || '%'
  AND fr.created_at::date = cp.created_at::date;
