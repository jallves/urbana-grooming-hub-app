-- Corrigir configuração do plano: Corte e Barba deve consumir 2 créditos
INSERT INTO public.subscription_plan_services (plan_id, service_id, credits_cost)
SELECT sp.id, '4d08d439-f833-4ab5-b52b-fd5c33b85570'::uuid, 2
FROM public.subscription_plans sp
WHERE lower(sp.name) LIKE lower('%corte%e/ou%barba%')
  AND NOT EXISTS (
    SELECT 1
    FROM public.subscription_plan_services sps
    WHERE sps.plan_id = sp.id
      AND sps.service_id = '4d08d439-f833-4ab5-b52b-fd5c33b85570'::uuid
  );

UPDATE public.subscription_plan_services sps
SET credits_cost = CASE
  WHEN sps.service_id = '4d08d439-f833-4ab5-b52b-fd5c33b85570'::uuid THEN 2
  ELSE 1
END
FROM public.subscription_plans sp
WHERE sp.id = sps.plan_id
  AND lower(sp.name) LIKE lower('%corte%e/ou%barba%')
  AND sps.service_id IN (
    '4d08d439-f833-4ab5-b52b-fd5c33b85570'::uuid,
    '88147ab2-4f5f-4c88-98dc-226d158523a5'::uuid,
    '9470c60a-97c7-4275-91d2-b2d58dd0a63a'::uuid
  );

-- Corrigir Rafael Viola: adicionar o segundo uso de crédito (Barba) do checkout 28/04
INSERT INTO public.subscription_usage (subscription_id, appointment_id, service_name, notes)
SELECT
  '9c9a6984-84df-4834-bd46-8dc620650c16'::uuid,
  'f107a5ab-ab25-4caa-9727-5834f624e2a6'::uuid,
  'Barba',
  'Correção manual: checkout consumiu Corte + Barba, portanto 2 créditos.'
WHERE NOT EXISTS (
  SELECT 1
  FROM public.subscription_usage
  WHERE subscription_id = '9c9a6984-84df-4834-bd46-8dc620650c16'::uuid
    AND appointment_id = 'f107a5ab-ab25-4caa-9727-5834f624e2a6'::uuid
    AND service_name = 'Barba'
);

UPDATE public.client_subscriptions
SET credits_used = 4,
    updated_at = now()
WHERE id = '9c9a6984-84df-4834-bd46-8dc620650c16'::uuid
  AND credits_used < 4;

-- Remover o item indevido "Corte e Barba" da venda do Rafael, mantendo Corte + Barba separados
DELETE FROM public.vendas_itens
WHERE venda_id = 'b12c00f0-8404-4a62-a0f0-4eb5fa69f671'::uuid
  AND item_id = '4d08d439-f833-4ab5-b52b-fd5c33b85570'::uuid;

UPDATE public.vendas
SET valor_total = 0,
    desconto = 0,
    gorjeta = 0,
    forma_pagamento = 'subscription_credit',
    status = 'pago',
    observacoes = trim(coalesce(observacoes, '') || E'\n[Correção] Checkout Rafael Viola: assinatura consumiu 2 créditos para Corte + Barba; item combo indevido removido.'),
    updated_at = now()
WHERE id = 'b12c00f0-8404-4a62-a0f0-4eb5fa69f671'::uuid;

-- Remover lançamentos ERP/contas gerados pelo item combo indevido
DELETE FROM public.contas_pagar
WHERE observacoes LIKE '%id=b12c00f0-8404-4a62-a0f0-4eb5fa69f671%'
  AND observacoes LIKE '%4d08d439-f833-4ab5-b52b-fd5c33b85570%';

DELETE FROM public.contas_receber
WHERE observacoes LIKE '%id=b12c00f0-8404-4a62-a0f0-4eb5fa69f671%'
  AND observacoes LIKE '%4d08d439-f833-4ab5-b52b-fd5c33b85570%';

DELETE FROM public.financial_records
WHERE reference_id = 'b12c00f0-8404-4a62-a0f0-4eb5fa69f671'::uuid
  AND notes LIKE '%4d08d439-f833-4ab5-b52b-fd5c33b85570%';

-- Ajustar descrição dos usos mantidos para evidenciar correção auditada
UPDATE public.subscription_usage
SET notes = coalesce(notes, 'Correção auditada: crédito consumido no checkout Corte + Barba.')
WHERE subscription_id = '9c9a6984-84df-4834-bd46-8dc620650c16'::uuid
  AND appointment_id = 'f107a5ab-ab25-4caa-9727-5834f624e2a6'::uuid;