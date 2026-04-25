DO $$
DECLARE
  v_venda_id uuid := gen_random_uuid();
  v_appointment_id uuid := 'abd086a7-bd40-4eee-a907-20e78317e92d';
  v_cliente_id uuid := '2c5fe747-a022-4cc0-80bd-f13a83283f9f';
  v_barbeiro_id uuid := 'd99d42ba-4987-45f5-a817-2cecbccadad9';
  v_servico_id uuid := '9470c60a-97c7-4275-91d2-b2d58dd0a63a';
  v_servico_nome text := 'Barba';
  v_barbeiro_nome text := 'Carlos Firme ';
  v_preco numeric := 55.00;
  v_commission_rate numeric := 40.00;
  v_commission_value numeric := 22.00;
BEGIN
  INSERT INTO public.vendas (id, cliente_id, barbeiro_id, valor_total, desconto, gorjeta, status, forma_pagamento, created_at, updated_at)
  VALUES (v_venda_id, v_cliente_id, v_barbeiro_id, v_preco, 0, 0, 'pago', 'DINHEIRO', now(), now());

  INSERT INTO public.vendas_itens (id, venda_id, item_id, tipo, nome, quantidade, preco_unitario, subtotal, created_at)
  VALUES (gen_random_uuid(), v_venda_id, v_servico_id, 'SERVICO', v_servico_nome, 1, v_preco, v_preco, now());

  UPDATE public.painel_agendamentos
  SET status = 'concluido',
      status_totem = 'FINALIZADO',
      venda_id = v_venda_id,
      updated_at = now()
  WHERE id = v_appointment_id;

  INSERT INTO public.financial_records (
    transaction_type, category, subcategory, description, amount, net_amount,
    status, transaction_date, payment_date, payment_method,
    reference_id, reference_type, client_id, barber_id, barber_name,
    service_id, service_name
  ) VALUES (
    'service_revenue', 'receita_servico', 'servico', 'Serviço: ' || v_servico_nome, v_preco, v_preco,
    'completed', CURRENT_DATE, CURRENT_DATE, 'DINHEIRO',
    v_venda_id, 'totem_venda', v_cliente_id, v_barbeiro_id, v_barbeiro_nome,
    v_servico_id, v_servico_nome
  );

  INSERT INTO public.financial_records (
    transaction_type, category, subcategory, description, amount, net_amount,
    status, transaction_date, payment_method,
    reference_id, reference_type, barber_id, barber_name
  ) VALUES (
    'commission', 'despesa_comissao', 'comissao_servico',
    'Comissão de ' || v_barbeiro_nome || ' - ' || v_servico_nome, v_commission_value, v_commission_value,
    'pending', CURRENT_DATE, 'DINHEIRO',
    v_venda_id, 'totem_venda', v_barbeiro_id, v_barbeiro_nome
  );

  INSERT INTO public.barber_commissions (
    barber_id, barber_name, venda_id, appointment_id, appointment_source,
    valor, amount, commission_rate, tipo, status
  ) VALUES (
    v_barbeiro_id, v_barbeiro_nome, v_venda_id, v_appointment_id, 'painel',
    v_commission_value, v_commission_value, v_commission_rate, 'servico', 'pending'
  );

  INSERT INTO public.contas_pagar (
    descricao, valor, data_vencimento, status, categoria, fornecedor, venda_id
  ) VALUES (
    'Comissão ' || v_barbeiro_nome || ' - ' || v_servico_nome, v_commission_value,
    CURRENT_DATE, 'pendente', 'comissao', v_barbeiro_nome, v_venda_id
  );
END $$;