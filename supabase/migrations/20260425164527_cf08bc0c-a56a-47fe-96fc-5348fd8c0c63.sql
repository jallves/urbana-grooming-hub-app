-- Função: aplica um vale (contas_pagar.categoria='vale') sobre as comissões pendentes do barbeiro
-- Estratégia: FIFO (mais antigas primeiro). Quando a próxima comissão excede o saldo restante,
-- divide em duas linhas: uma "paid" com o valor abatido e outra "pending" com o saldo restante.
-- Atualiza tudo em uma única transação.

CREATE OR REPLACE FUNCTION public.apply_vale_to_commissions(p_vale_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
BEGIN
  -- 1) Carrega o vale
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

  -- 2) Localiza barbeiro pelo nome (fornecedor)
  SELECT id, nome INTO v_barber
  FROM painel_barbeiros
  WHERE lower(nome) = lower(trim(v_vale.fornecedor))
  LIMIT 1;

  IF v_barber.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', format('Barbeiro "%s" não encontrado', v_vale.fornecedor));
  END IF;

  -- 3) Itera sobre comissões pendentes do barbeiro (FIFO)
  FOR v_commission IN
    SELECT id, valor, venda_id, tipo, barber_id, barber_name, commission_rate,
           appointment_id, appointment_source, created_at
    FROM barber_commissions
    WHERE barber_id = v_barber.id
      AND status IN ('pending','pendente')
    ORDER BY created_at ASC, id ASC
  LOOP
    EXIT WHEN v_remaining <= 0;

    IF v_commission.valor <= v_remaining THEN
      -- Paga integral
      UPDATE barber_commissions
         SET status = 'paid',
             data_pagamento = v_today,
             payment_date   = v_today
       WHERE id = v_commission.id;

      v_remaining    := v_remaining - v_commission.valor;
      v_total_abated := v_total_abated + v_commission.valor;
      v_paid_count   := v_paid_count + 1;
    ELSE
      -- Pagamento parcial: divide em duas linhas
      -- a) Atualiza a original para o valor restante (pendente)
      UPDATE barber_commissions
         SET valor  = v_commission.valor - v_remaining,
             amount = v_commission.valor - v_remaining
       WHERE id = v_commission.id;

      -- b) Cria nova linha PAGA com o valor abatido
      INSERT INTO barber_commissions (
        barber_id, barber_name, venda_id, tipo, valor, amount,
        commission_rate, appointment_id, appointment_source,
        status, data_pagamento, payment_date, created_at
      ) VALUES (
        v_commission.barber_id,
        v_commission.barber_name,
        v_commission.venda_id,
        v_commission.tipo,
        v_remaining,
        v_remaining,
        v_commission.commission_rate,
        v_commission.appointment_id,
        v_commission.appointment_source,
        'paid',
        v_today,
        v_today,
        v_commission.created_at
      ) RETURNING id INTO v_new_id;

      v_total_abated := v_total_abated + v_remaining;
      v_remaining    := 0;
      v_split_count  := v_split_count + 1;
    END IF;
  END LOOP;

  -- 4) Marca o próprio vale como pago (já foi "consumido" via abatimento)
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
$$;

GRANT EXECUTE ON FUNCTION public.apply_vale_to_commissions(uuid) TO authenticated;
