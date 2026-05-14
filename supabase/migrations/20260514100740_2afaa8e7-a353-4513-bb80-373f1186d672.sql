CREATE OR REPLACE FUNCTION public.sync_contas_pagar_from_commission()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_payment_date DATE;
  v_matched INTEGER := 0;
BEGIN
  IF NEW.status = 'paid' AND (OLD.status IS NULL OR OLD.status NOT IN ('paid','pago')) THEN
    v_payment_date := COALESCE(NEW.payment_date, NEW.data_pagamento, CURRENT_DATE);

    -- ESTRATÉGIA 1: match preciso por venda_id + valor
    IF NEW.venda_id IS NOT NULL THEN
      UPDATE contas_pagar cp
      SET status = 'pago',
          data_pagamento = v_payment_date,
          updated_at = now()
      WHERE cp.status IN ('pendente', 'pending')
        AND cp.venda_id = NEW.venda_id
        AND cp.valor = NEW.valor;
      GET DIAGNOSTICS v_matched = ROW_COUNT;

      UPDATE financial_records fr
      SET status = 'completed',
          payment_date = v_payment_date,
          updated_at = now()
      WHERE fr.status = 'pending'
        AND fr.transaction_type IN ('commission', 'tip')
        AND fr.amount = NEW.valor
        AND fr.reference_id = NEW.venda_id;
    END IF;

    -- ESTRATÉGIA 2 (fallback): só roda quando não houve venda_id ou o match falhou
    IF v_matched = 0 AND (NEW.venda_id IS NULL) THEN
      UPDATE contas_pagar cp
      SET status = 'pago',
          data_pagamento = v_payment_date,
          updated_at = now()
      WHERE cp.status IN ('pendente', 'pending')
        AND cp.valor = NEW.valor
        AND cp.fornecedor ILIKE '%' || COALESCE(NEW.barber_name, '') || '%'
        AND cp.created_at::date = NEW.created_at::date;

      UPDATE financial_records fr
      SET status = 'completed',
          payment_date = v_payment_date,
          updated_at = now()
      WHERE fr.status = 'pending'
        AND fr.transaction_type IN ('commission', 'tip')
        AND fr.amount = NEW.valor
        AND fr.barber_name ILIKE '%' || COALESCE(NEW.barber_name, '') || '%'
        AND fr.created_at::date = NEW.created_at::date;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- Mesma blindagem na direção inversa (contas_pagar -> barber_commissions)
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

    -- ESTRATÉGIA 1: match preciso por venda_id
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

    -- ESTRATÉGIA 2 (fallback): só quando não há venda_id no NEW
    IF v_matched_count = 0 AND NEW.venda_id IS NULL THEN
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
