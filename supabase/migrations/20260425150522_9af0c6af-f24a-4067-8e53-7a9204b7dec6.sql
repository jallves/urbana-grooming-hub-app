
-- Inserir lançamento em Contas a Receber para a venda do agendamento
-- Barbearia Costa Urbana - Carlos Firme - Barba - 24/04/2026 19:30 - R$ 55,00 DINHEIRO
INSERT INTO public.contas_receber (
  descricao,
  valor,
  data_vencimento,
  data_recebimento,
  categoria,
  cliente_id,
  status,
  forma_pagamento,
  venda_id,
  observacoes,
  created_at,
  updated_at
)
SELECT
  'Serviço: Barba - Carlos Firme (Agendamento 24/04 19:30)',
  55.00,
  '2026-04-24'::date,
  '2026-04-24'::date,
  'Receita de Serviços',
  '2c5fe747-a022-4cc0-80bd-f13a83283f9f',
  'recebido',
  'DINHEIRO',
  '93b50287-99d0-42ce-bbf2-2979967d2d06',
  'Migração manual - finalização retroativa do agendamento abd086a7',
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM public.contas_receber WHERE venda_id = '93b50287-99d0-42ce-bbf2-2979967d2d06'
);
