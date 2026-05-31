CREATE OR REPLACE FUNCTION public.revert_vale_from_commissions(p_vale_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_split      RECORD;
  v_cp_split   RECORD;
  v_reverted   integer := 0;
  v_split_merged integer := 0;
  v_total_back numeric := 0;
BEGIN
  -- 1) Mesclar splits de barber_commissions: soma valor de volta ao parent e remove split
  FOR v_split IN
    SELECT * FROM barber_commissions
    WHERE vale_origin_id = p_vale_id
      AND vale_split_parent_id IS NOT NULL
  LOOP
    UPDATE barber_commissions
       SET valor  = coalesce(valor, 0) + v_split.valor,
           amount = coalesce(amount, 0) + coalesce(v_split.amount, v_split.valor)
     WHERE id = v_split.vale_split_parent_id;

    v_total_back := v_total_back + coalesce(v_split.valor, 0);
    v_split_merged := v_split_merged + 1;

    DELETE FROM barber_commissions WHERE id = v_split.id;
  END LOOP;

  -- 2) Reverter comissões integrais (não-split) para pendente
  UPDATE barber_commissions
     SET status = 'pending',
         data_pagamento = NULL,
         payment_date = NULL,
         vale_origin_id = NULL
   WHERE vale_origin_id = p_vale_id
     AND vale_split_parent_id IS NULL;

  GET DIAGNOSTICS v_reverted = ROW_COUNT;

  -- 3) Mesclar splits de contas_pagar
  FOR v_cp_split IN
    SELECT * FROM contas_pagar
    WHERE vale_origin_id = p_vale_id
      AND vale_split_parent_id IS NOT NULL
  LOOP
    UPDATE contas_pagar
       SET valor = coalesce(valor, 0) + v_cp_split.valor,
           status = 'pendente',
           data_pagamento = NULL,
           updated_at = now(),
           observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Split de vale revertido.')
     WHERE id = v_cp_split.vale_split_parent_id;

    DELETE FROM contas_pagar WHERE id = v_cp_split.id;
  END LOOP;

  -- 4) Reverter contas_pagar integrais (comissões)
  UPDATE contas_pagar
     SET status = 'pendente',
         data_pagamento = NULL,
         updated_at = now(),
         vale_origin_id = NULL,
         observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Reaberto após cancelamento de vale.')
   WHERE vale_origin_id = p_vale_id
     AND vale_split_parent_id IS NULL
     AND categoria ILIKE '%comiss%';

  -- 5) Marcar vale como cancelado
  UPDATE contas_pagar
     SET status = 'cancelado',
         data_pagamento = NULL,
         updated_at = now(),
         observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Vale cancelado em ' || to_char(now(),'DD/MM/YYYY HH24:MI') || ' — comissões revertidas para pendente.')
   WHERE id = p_vale_id;

  RETURN jsonb_build_object(
    'success', true,
    'commissions_reverted', v_reverted,
    'splits_merged', v_split_merged
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.apply_vale_to_commissions(p_vale_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_vale         RECORD;
  v_barber       RECORD;
  v_remaining    numeric;
  v_total_vale   numeric;
  v_commission   RECORD;
  v_paid_count   integer := 0;
  v_split_count  integer := 0;
  v_total_abated numeric := 0;
  v_today        date := CURRENT_DATE;
  v_new_id       uuid;
  v_cp           RECORD;
BEGIN
  SELECT * INTO v_vale FROM contas_pagar WHERE id = p_vale_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vale não encontrado');
  END IF;

  IF lower(coalesce(v_vale.categoria,'')) NOT LIKE '%vale%' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lançamento não é um vale');
  END IF;

  IF v_vale.fornecedor IS NULL OR length(trim(v_vale.fornecedor)) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vale sem fornecedor (barbeiro)');
  END IF;

  v_total_vale := coalesce(v_vale.valor, 0);
  v_remaining  := v_total_vale;

  IF v_remaining <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vale com valor inválido');
  END IF;

  SELECT id, nome INTO v_barber
  FROM painel_barbeiros
  WHERE lower(trim(nome)) = lower(trim(v_vale.fornecedor))
  LIMIT 1;

  IF v_barber.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', format('Barbeiro "%s" não encontrado', v_vale.fornecedor));
  END IF;

  FOR v_commission IN
    SELECT id, valor, venda_id, tipo, barber_id, barber_name, commission_rate,
           appointment_id, appointment_source, created_at
    FROM barber_commissions
    WHERE barber_id = v_barber.id
      AND status IN ('pending','pendente')
      AND vale_origin_id IS NULL
    ORDER BY created_at ASC, id ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_commission.valor <= v_remaining THEN
      UPDATE barber_commissions
         SET status = 'paid', data_pagamento = v_today, payment_date = v_today,
             vale_origin_id = p_vale_id
       WHERE id = v_commission.id;

      IF v_commission.venda_id IS NOT NULL THEN
        UPDATE contas_pagar
           SET status = 'pago', data_pagamento = v_today, updated_at = now(),
               vale_origin_id = p_vale_id
         WHERE categoria ILIKE '%comiss%'
           AND venda_id = v_commission.venda_id
           AND fornecedor = v_commission.barber_name
           AND status IN ('pendente','pending')
           AND valor = v_commission.valor;
      END IF;

      v_remaining    := v_remaining - v_commission.valor;
      v_total_abated := v_total_abated + v_commission.valor;
      v_paid_count   := v_paid_count + 1;
    ELSE
      UPDATE barber_commissions
         SET valor = v_commission.valor - v_remaining,
             amount = v_commission.valor - v_remaining
       WHERE id = v_commission.id;

      INSERT INTO barber_commissions (
        barber_id, barber_name, venda_id, tipo, valor, amount,
        commission_rate, appointment_id, appointment_source,
        status, data_pagamento, payment_date, created_at,
        vale_origin_id, vale_split_parent_id
      ) VALUES (
        v_commission.barber_id, v_commission.barber_name, v_commission.venda_id,
        v_commission.tipo, v_remaining, v_remaining, v_commission.commission_rate,
        v_commission.appointment_id, v_commission.appointment_source,
        'paid', v_today, v_today, v_commission.created_at,
        p_vale_id, v_commission.id
      ) RETURNING id INTO v_new_id;

      IF v_commission.venda_id IS NOT NULL THEN
        SELECT * INTO v_cp FROM contas_pagar
          WHERE categoria ILIKE '%comiss%'
            AND venda_id = v_commission.venda_id
            AND fornecedor = v_commission.barber_name
            AND status IN ('pendente','pending')
            AND valor = v_commission.valor
          LIMIT 1;

        IF v_cp.id IS NOT NULL THEN
          UPDATE contas_pagar
             SET valor = v_commission.valor - v_remaining,
                 updated_at = now(),
                 observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Reduzido por abatimento parcial de vale.')
           WHERE id = v_cp.id;

          INSERT INTO contas_pagar (
            descricao, valor, data_vencimento, data_pagamento, categoria, fornecedor,
            status, forma_pagamento, observacoes, venda_id, created_at, updated_at,
            vale_origin_id, vale_split_parent_id
          ) VALUES (
            v_cp.descricao || ' (parcial via vale)',
            v_remaining,
            v_cp.data_vencimento,
            v_today,
            v_cp.categoria,
            v_cp.fornecedor,
            'pago',
            v_cp.forma_pagamento,
            '[Auto] Parcela paga por abatimento de vale.',
            v_cp.venda_id,
            v_cp.created_at,
            now(),
            p_vale_id,
            v_cp.id
          );
        END IF;
      END IF;

      v_total_abated := v_total_abated + v_remaining;
      v_remaining    := 0;
      v_split_count  := v_split_count + 1;
    END IF;
  END LOOP;

  UPDATE contas_pagar
     SET status = 'pago',
         data_pagamento = v_today,
         updated_at = now(),
         observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Abatido em ' ||
                            v_paid_count::text || ' comissão(ões) integrais e ' ||
                            v_split_count::text || ' parcial(is). Total abatido: R$ ' ||
                            to_char(v_total_abated, 'FM999990.00') ||
                            CASE WHEN v_remaining > 0
                                 THEN '. Saldo do vale sem comissão para abater: R$ ' || to_char(v_remaining, 'FM999990.00')
                                 ELSE '' END)
   WHERE id = p_vale_id;

  RETURN jsonb_build_object(
    'success', true,
    'barber_id', v_barber.id,
    'barber_name', v_barber.nome,
    'vale_total', v_total_vale,
    'total_abated', v_total_abated,
    'remaining_uncovered', v_remaining,
    'commissions_fully_paid', v_paid_count,
    'commissions_split', v_split_count
  );
END;
$function$;