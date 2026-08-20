DO $$
DECLARE
  v_appts uuid[] := ARRAY['1f05609b-95d8-483e-826f-8c3e97b13b5b','d8efdf1e-8cd4-4648-a9db-20dfe1c3904e']::uuid[];
  v_vendas uuid[] := ARRAY['2621e1e2-dfda-472d-9d07-3867e84b1fb0','a78fb479-801d-4092-b1b5-dac7aeb61f1f']::uuid[];
BEGIN
  DELETE FROM public.financial_records WHERE reference_id = ANY(v_vendas) OR reference_id = ANY(v_appts);
  DELETE FROM public.financial_transactions WHERE reference_id = ANY(v_vendas) OR reference_id = ANY(v_appts);
  DELETE FROM public.cash_flow WHERE reference_id = ANY(v_vendas);
  DELETE FROM public.contas_receber WHERE venda_id = ANY(v_vendas);
  DELETE FROM public.contas_pagar WHERE venda_id = ANY(v_vendas);
  DELETE FROM public.barber_commissions WHERE venda_id = ANY(v_vendas) OR appointment_id = ANY(v_appts);
  DELETE FROM public.comissoes WHERE venda_id = ANY(v_vendas);
  DELETE FROM public.totem_payments WHERE venda_id = ANY(v_vendas);
  DELETE FROM public.vendas_itens WHERE venda_id = ANY(v_vendas);
  DELETE FROM public.appointment_ratings WHERE appointment_id = ANY(v_appts);
  DELETE FROM public.coffee_records WHERE appointment_id = ANY(v_appts);
  DELETE FROM public.subscription_usage WHERE appointment_id = ANY(v_appts);
  DELETE FROM public.appointment_totem_sessions WHERE appointment_id = ANY(v_appts);
  UPDATE public.painel_agendamentos SET venda_id = NULL WHERE id = ANY(v_appts);
  DELETE FROM public.painel_agendamentos WHERE id = ANY(v_appts);
  DELETE FROM public.vendas WHERE id = ANY(v_vendas);
END $$;