-- Reverter as 2 comissões de R$ 22 marcadas pagas indevidamente pelo trigger em cascata
UPDATE public.barber_commissions
SET status = 'pending', data_pagamento = NULL, payment_date = NULL
WHERE id IN (
  '98ae3888-212d-449d-81d8-537d1d4dc604',
  'e6eae35b-71dc-439a-a9e6-a396b5cc135d'
);

UPDATE public.contas_pagar
SET status = 'pendente', data_pagamento = NULL, updated_at = now()
WHERE id IN (
  '9b4db9d3-0bc0-4ab3-9088-6e2cc9876310',
  '82fcb77b-4a69-4661-a390-5207291e8e33'
);

UPDATE public.financial_records
SET status = 'pending', payment_date = NULL, updated_at = now()
WHERE transaction_type IN ('commission','tip')
  AND barber_name = 'Carlos Firme'
  AND reference_id IN (
    'dd5bd5f6-d283-4f19-b3a2-a5b70659d192',
    '02ba85a9-1019-4dff-9bb2-d70503f66b35'
  )
  AND amount = 22.00;
