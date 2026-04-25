DO $$
DECLARE
  v_vale_id uuid := '4bbbfccd-75bb-42a0-a6ab-2c8346c69f67';
  v_result  jsonb;
BEGIN
  -- 1) Reabre o vale como pendente para que a RPC possa processá-lo
  UPDATE contas_pagar
     SET status = 'pendente',
         data_pagamento = NULL,
         updated_at = now()
   WHERE id = v_vale_id;

  -- 2) Aplica o abatimento automático nas comissões pendentes
  v_result := public.apply_vale_to_commissions(v_vale_id);

  RAISE NOTICE 'Resultado: %', v_result;
END $$;