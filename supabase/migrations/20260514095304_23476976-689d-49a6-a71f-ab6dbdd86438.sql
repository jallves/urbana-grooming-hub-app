
-- Correção pontual: comissões de "Corte e Barba" via uso de crédito de assinatura (2 créditos = R$ 38)
UPDATE contas_pagar
SET valor = 38.00,
    descricao = 'Comissão 40% de R$ 47.50 x 2 créditos - Corte e Barba (uso crédito assinatura)'
WHERE id IN ('e846b701-92ba-44fa-a397-188782866ad5','2f1b09eb-7590-472f-a6fc-3c3b26c46c02');

UPDATE financial_records
SET amount = 38.00,
    net_amount = 38.00,
    description = 'Comissão 40% de R$ 47.50 x 2 créditos - Corte e Barba (uso crédito assinatura)'
WHERE id IN ('6bea53c3-ee32-43f3-81d8-4a4e359260f9','fc132a43-291f-4ca0-b87e-ff89e9007b7d');

UPDATE barber_commissions
SET valor = 38.00
WHERE id IN ('991903da-97f8-4972-9699-5069549e82e2','d473032c-9936-4112-b95e-c7a232298c4f');
