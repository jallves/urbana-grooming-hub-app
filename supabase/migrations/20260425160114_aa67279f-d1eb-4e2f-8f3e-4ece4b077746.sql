-- Remove duplicated financial entries linked to venda 60bff2c5-1752-4f4b-96bf-5e3ead02e850
-- Bryan Vinicius - 07/04/2026 - "Corte e Barba" R$100 was a duplicate of "Corte + Barba + Sobrancelha" R$125

DELETE FROM public.financial_records 
WHERE id IN (
  '61288ad6-3199-4e59-8baf-39e669e22578', -- receita R$100 Corte e Barba
  '7b6cf777-aea9-40a9-beb8-bb57b5086147'  -- comissão R$40 Corte e Barba
);

DELETE FROM public.barber_commissions 
WHERE id = '52ecd6e1-75b6-4a90-ab96-f6c50a0eaf89'; -- comissão R$40

DELETE FROM public.contas_pagar 
WHERE id = '717e5a62-9861-4140-a3af-0b1c7362e5bf'; -- conta a pagar comissão R$40

DELETE FROM public.contas_receber 
WHERE id = '10a53959-735f-4e52-9f24-e5b6ade554c1'; -- conta a receber R$100