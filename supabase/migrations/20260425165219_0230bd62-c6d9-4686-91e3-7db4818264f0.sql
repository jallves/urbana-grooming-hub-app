-- 1) Reverter os 6 registros de comissão em contas_pagar marcados indevidamente
UPDATE contas_pagar
   SET status = 'pendente',
       data_pagamento = NULL,
       updated_at = now()
 WHERE id IN (
   '5cd24b34-b117-4bfd-82c2-24b7baa13626', -- 40
   'f3c4c93d-aa07-4b86-97a3-387b4491a8cf', -- 22
   'b7bff27d-ff03-4916-a6d8-3955473d3702', -- 22
   '7984a12f-e572-4bc8-a687-371f844fe253', -- 22 (essa estava certa, vamos refazer abaixo)
   '94e59bed-ee79-4860-8f3e-68e1e9bb9864', -- 40 (errada — venda diferente)
   '4deac103-2d63-4dec-8202-fb09e334b56d'  -- 22 (errada — venda diferente)
 );

-- 2) Marcar como PAGO apenas as 3 comissões integrais abatidas pelo vale
--    (vendas: 4c9c653b R$40, 545edf6f R$22, a0375eeb R$22)
UPDATE contas_pagar
   SET status = 'pago',
       data_pagamento = CURRENT_DATE,
       updated_at = now()
 WHERE categoria ILIKE '%comiss%'
   AND fornecedor ILIKE '%Carlos Firme%'
   AND venda_id IN (
     '4c9c653b-6dbc-4bcd-b095-4cb58affc9d1'::uuid,
     '545edf6f-27d0-4e94-a46f-9bf18b4d1436'::uuid,
     'a0375eeb-0b3d-4614-bdc4-c55a009ffc4b'::uuid
   )
   AND status IN ('pendente','pending');

-- 3) Para a comissão R$22 da venda 281d0c69 (que foi parcialmente abatida em R$6),
--    vamos dividir o registro em contas_pagar do mesmo modo (R$6 paga + R$16 pendente).
--    Primeiro reduz o original para R$16 pendente:
UPDATE contas_pagar
   SET valor = 16,
       status = 'pendente',
       data_pagamento = NULL,
       updated_at = now(),
       observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Reduzido por abatimento parcial de vale (R$ 6 abatido em registro separado).')
 WHERE categoria ILIKE '%comiss%'
   AND fornecedor ILIKE '%Carlos Firme%'
   AND venda_id = '281d0c69-6621-4285-beb8-21783748e234'::uuid
   AND valor = 22;

-- E cria nova linha PAGA de R$ 6 referenciando a mesma venda
INSERT INTO contas_pagar (
  descricao, valor, data_vencimento, data_pagamento, categoria, fornecedor,
  status, forma_pagamento, observacoes, venda_id, created_at, updated_at
)
SELECT 
  descricao || ' (parcial via vale)',
  6,
  data_vencimento,
  CURRENT_DATE,
  categoria,
  fornecedor,
  'pago',
  forma_pagamento,
  '[Auto] Parcela paga por abatimento de vale.',
  venda_id,
  created_at,
  now()
FROM contas_pagar
WHERE id = '7984a12f-e572-4bc8-a687-371f844fe253';

-- 4) Ajustar a RPC para sincronizar contas_pagar PELO venda_id das comissões abatidas
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
  WHERE lower(nome) = lower(trim(v_vale.fornecedor))
  LIMIT 1;

  IF v_barber.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', format('Barbeiro "%s" não encontrado', v_vale.fornecedor));
  END IF;

  -- Suprime triggers para evitar cascata e match incorreto por valor+data
  PERFORM set_config('session_replication_role', 'replica', true);

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
      -- Paga integral em barber_commissions
      UPDATE barber_commissions
         SET status = 'paid', data_pagamento = v_today, payment_date = v_today
       WHERE id = v_commission.id;

      -- Espelha em contas_pagar pelo venda_id (sem matching por valor)
      IF v_commission.venda_id IS NOT NULL THEN
        UPDATE contas_pagar
           SET status = 'pago', data_pagamento = v_today, updated_at = now()
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
      -- Split em barber_commissions: reduz original e cria nova linha paga
      UPDATE barber_commissions
         SET valor = v_commission.valor - v_remaining,
             amount = v_commission.valor - v_remaining
       WHERE id = v_commission.id;

      INSERT INTO barber_commissions (
        barber_id, barber_name, venda_id, tipo, valor, amount,
        commission_rate, appointment_id, appointment_source,
        status, data_pagamento, payment_date, created_at
      ) VALUES (
        v_commission.barber_id, v_commission.barber_name, v_commission.venda_id,
        v_commission.tipo, v_remaining, v_remaining, v_commission.commission_rate,
        v_commission.appointment_id, v_commission.appointment_source,
        'paid', v_today, v_today, v_commission.created_at
      ) RETURNING id INTO v_new_id;

      -- Replica o split também em contas_pagar
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
            status, forma_pagamento, observacoes, venda_id, created_at, updated_at
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
            now()
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

  PERFORM set_config('session_replication_role', 'origin', true);

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