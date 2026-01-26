-- Atualizar fornecedor em contas_pagar para usar nomes curtos dos barbeiros
UPDATE public.contas_pagar 
SET fornecedor = 'Carlos Firme'
WHERE fornecedor ILIKE '%Carlos Firme%';

UPDATE public.contas_pagar 
SET fornecedor = 'Thomas Jefferson'
WHERE fornecedor ILIKE '%Thomas Jefferson%';
