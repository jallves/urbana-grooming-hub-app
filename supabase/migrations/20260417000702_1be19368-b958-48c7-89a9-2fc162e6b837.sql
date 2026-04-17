
-- 1) Trigger reversa: quando barber_commissions vira 'paid', marca contas_pagar como 'pago'
CREATE OR REPLACE FUNCTION public.sync_contas_pagar_from_commission()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_payment_date DATE;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status NOT IN ('paid','pago')) THEN
    v_payment_date := COALESCE(NEW.payment_date, NEW.data_pagamento, CURRENT_DATE);

    -- ESTRATÉGIA 1: match por venda_id + valor
    IF NEW.venda_id IS NOT NULL THEN
      UPDATE contas_pagar cp
      SET status = 'pago',
          data_pagamento = v_payment_date,
          updated_at = now()
      WHERE cp.status IN ('pendente', 'pending')
        AND cp.venda_id = NEW.venda_id
        AND cp.valor = NEW.valor;
    END IF;

    -- ESTRATÉGIA 2: fallback por nome + valor + data
    UPDATE contas_pagar cp
    SET status = 'pago',
        data_pagamento = v_payment_date,
        updated_at = now()
    WHERE cp.status IN ('pendente', 'pending')
      AND cp.valor = NEW.valor
      AND cp.fornecedor ILIKE '%' || COALESCE(NEW.barber_name, '') || '%'
      AND cp.created_at::date = NEW.created_at::date;

    -- Sincronizar financial_records também
    UPDATE financial_records fr
    SET status = 'completed',
        payment_date = v_payment_date,
        updated_at = now()
    WHERE fr.status = 'pending'
      AND fr.transaction_type IN ('commission', 'tip')
      AND fr.amount = NEW.valor
      AND (
        (NEW.venda_id IS NOT NULL AND fr.reference_id = NEW.venda_id)
        OR (fr.barber_name ILIKE '%' || COALESCE(NEW.barber_name, '') || '%'
            AND fr.created_at::date = NEW.created_at::date)
      );
  END IF;

  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS trg_sync_contas_pagar_from_commission ON public.barber_commissions;
CREATE TRIGGER trg_sync_contas_pagar_from_commission
AFTER UPDATE ON public.barber_commissions
FOR EACH ROW
EXECUTE FUNCTION public.sync_contas_pagar_from_commission();

-- 2) Reconciliação retroativa: comissões PAGAS sem conta_pagar paga correspondente
UPDATE contas_pagar cp
SET status = 'pago',
    data_pagamento = COALESCE(bc.payment_date, bc.data_pagamento, CURRENT_DATE),
    updated_at = now()
FROM barber_commissions bc
WHERE cp.status IN ('pendente', 'pending')
  AND bc.status = 'paid'
  AND bc.venda_id IS NOT NULL
  AND cp.venda_id = bc.venda_id
  AND cp.valor = bc.valor;

-- 3) Reconciliação retroativa: por nome+valor+data (cobre casos sem venda_id match)
UPDATE contas_pagar cp
SET status = 'pago',
    data_pagamento = COALESCE(bc.payment_date, bc.data_pagamento, CURRENT_DATE),
    updated_at = now()
FROM barber_commissions bc
WHERE cp.status IN ('pendente', 'pending')
  AND bc.status = 'paid'
  AND cp.valor = bc.valor
  AND cp.fornecedor ILIKE '%' || COALESCE(bc.barber_name, '') || '%'
  AND cp.created_at::date = bc.created_at::date;

-- 4) Sincronizar financial_records pendentes correspondentes
UPDATE financial_records fr
SET status = 'completed',
    payment_date = COALESCE(bc.payment_date, bc.data_pagamento, CURRENT_DATE),
    updated_at = now()
FROM barber_commissions bc
WHERE fr.status = 'pending'
  AND bc.status = 'paid'
  AND fr.transaction_type IN ('commission', 'tip')
  AND fr.amount = bc.valor
  AND (
    (bc.venda_id IS NOT NULL AND fr.reference_id = bc.venda_id)
    OR (fr.barber_name ILIKE '%' || COALESCE(bc.barber_name, '') || '%'
        AND fr.created_at::date = bc.created_at::date)
  );
