UPDATE contas_pagar SET valor = 38.00, descricao = 'Comissão 40% de R$ 95.00 - Corte e Barba x2 créditos (uso crédito assinatura)', updated_at = now() WHERE id = '6555b669-9cb7-4d37-9da4-906f9d804870';

UPDATE barber_commissions SET valor = 38.00, amount = 38.00 WHERE id = 'a6aca3a4-2528-4c4a-a8a0-be25623aa37e';

UPDATE financial_records SET amount = 38.00, net_amount = 38.00, description = 'Comissão 40% de R$ 95.00 - Corte e Barba x2 créditos (uso crédito assinatura)', updated_at = now() WHERE id = '326b2a0c-6dc1-40c9-93b6-6e06a3feac25';