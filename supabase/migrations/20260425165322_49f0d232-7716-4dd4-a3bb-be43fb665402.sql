-- Reverter as 2 comissões marcadas indevidamente em barber_commissions
UPDATE barber_commissions
   SET status = 'pending',
       data_pagamento = NULL,
       payment_date   = NULL
 WHERE id IN (
   '63f6fa61-c7a3-46af-ac12-a422845a9a4d',
   '85676ed5-76dc-40a4-b3eb-7fb882dbd361'
 );

-- Reverter os 2 correspondentes em contas_pagar
UPDATE contas_pagar
   SET status = 'pendente',
       data_pagamento = NULL,
       updated_at = now()
 WHERE categoria ILIKE '%comiss%'
   AND fornecedor ILIKE '%Carlos Firme%'
   AND venda_id IN (
     '824d6451-79e1-4a83-b6f8-53d80a65371f'::uuid,
     'c82949dd-cde4-4395-94dc-979719cbf28a'::uuid
   )
   AND data_pagamento = CURRENT_DATE;