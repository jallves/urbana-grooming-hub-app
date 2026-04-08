
-- Deletar contas_receber teste
DELETE FROM contas_receber WHERE id = '1ea70086-b15b-41fe-b7ee-53574ff5a59e';

-- Deletar contas_pagar teste
DELETE FROM contas_pagar WHERE id = 'f3b2ee3b-3c6f-4079-9c2b-083044665215';

-- Deletar barber_commissions teste
DELETE FROM barber_commissions WHERE id = 'cfe5a20c-2aef-48a4-93ce-76e10892b019';

-- Deletar financial_records teste
DELETE FROM financial_records WHERE id IN ('5244561a-970e-4e37-8ebc-64cc3a2eb07c', 'ed7d56b0-f1d3-4036-a680-58c7853eb04b');

-- Deletar vendas teste
DELETE FROM vendas WHERE id IN ('a2d0ad77-4233-4772-a244-b944e6b8c343', '4e7794b9-75ae-4cba-af8b-c9e1bd828874');
