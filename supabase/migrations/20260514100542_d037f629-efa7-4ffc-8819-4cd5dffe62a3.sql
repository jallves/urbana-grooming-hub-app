-- Abatimento do vale R$ 90 (id ef35df0c) sobre comissões pendentes do Carlos Firme

-- 1) Pagar 3 comissões integrais
UPDATE public.barber_commissions
SET status = 'paid', data_pagamento = '2026-05-13', payment_date = '2026-05-13'
WHERE id IN (
  'a06229a3-0aa2-43ba-a7a2-02f2e96bf72d',
  'db113f4c-d6a5-4238-b41c-7c1e673716c6',
  '33e10659-a4e8-473b-9273-fa582a51f05d'
);

-- 2) Split 4ª comissão (R$ 40 → R$ 13 pendente + R$ 27 paga)
UPDATE public.barber_commissions
SET valor = 13.00, amount = 13.00
WHERE id = '1a5486b0-8719-44e8-8bfd-70e9248223d0';

INSERT INTO public.barber_commissions
  (barber_id, barber_name, venda_id, tipo, valor, amount,
   commission_rate, appointment_id, appointment_source,
   status, data_pagamento, payment_date, created_at)
SELECT barber_id, barber_name, venda_id, tipo, 27.00, 27.00,
       commission_rate, appointment_id, appointment_source,
       'paid', '2026-05-13', '2026-05-13', created_at
FROM public.barber_commissions
WHERE id = '1a5486b0-8719-44e8-8bfd-70e9248223d0';

-- 3) Espelhar em contas_pagar (3 integrais)
UPDATE public.contas_pagar
SET status = 'pago', data_pagamento = '2026-05-13', updated_at = now()
WHERE fornecedor = 'Carlos Firme'
  AND status IN ('pendente','pending')
  AND categoria ILIKE '%comiss%'
  AND venda_id IN (
    '2dbd9f14-9cfc-494f-8e12-ae669485a462',
    '9196c6b0-ffac-4866-ad5a-ca649e3decf7',
    'b26bc47b-8ed1-4b3a-a347-5a820d2354db'
  )
  AND valor IN (19.00, 22.00);

-- 3b) Split em contas_pagar para venda_id 7cab6f9b
UPDATE public.contas_pagar
SET valor = 13.00,
    updated_at = now(),
    observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Reduzido por abatimento parcial de vale (R$ 27).')
WHERE fornecedor = 'Carlos Firme'
  AND status IN ('pendente','pending')
  AND categoria ILIKE '%comiss%'
  AND venda_id = '7cab6f9b-d01d-448d-8d54-4757cee4be8a'
  AND valor = 40.00;

INSERT INTO public.contas_pagar
  (descricao, valor, data_vencimento, data_pagamento, categoria, fornecedor,
   status, forma_pagamento, observacoes, venda_id, created_at, updated_at)
SELECT descricao || ' (parcial via vale)', 27.00, data_vencimento, '2026-05-13',
       categoria, fornecedor, 'pago', forma_pagamento,
       '[Auto] Parcela paga por abatimento de vale R$ 90 (13/05/2026).',
       venda_id, created_at, now()
FROM public.contas_pagar
WHERE fornecedor = 'Carlos Firme'
  AND categoria ILIKE '%comiss%'
  AND venda_id = '7cab6f9b-d01d-448d-8d54-4757cee4be8a'
  AND valor = 13.00
LIMIT 1;

-- 4) Atualizar observações do vale
UPDATE public.contas_pagar
SET observacoes = trim(coalesce(observacoes,'') || E'\n[Auto] Abatido em 3 comissão(ões) integrais e 1 parcial(is). Total abatido: R$ 90.00. Saldo do vale sem comissão para abater: R$ 0.00'),
    updated_at = now()
WHERE id = 'ef35df0c-c72a-43ad-a7f7-caa30f2c0388';

-- 5) Sincronizar financial_records das 3 integrais
UPDATE public.financial_records
SET status = 'completed', payment_date = '2026-05-13', updated_at = now()
WHERE transaction_type IN ('commission','tip')
  AND status = 'pending'
  AND barber_name = 'Carlos Firme'
  AND reference_id IN (
    '2dbd9f14-9cfc-494f-8e12-ae669485a462',
    '9196c6b0-ffac-4866-ad5a-ca649e3decf7',
    'b26bc47b-8ed1-4b3a-a347-5a820d2354db'
  )
  AND amount IN (19.00, 22.00);
