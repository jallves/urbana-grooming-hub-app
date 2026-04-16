
-- Adicionar coluna venda_id (UUID) em contas_receber e contas_pagar
-- para padronizar o vínculo entre lançamentos financeiros e a venda de origem.
-- O campo transaction_id existente passa a ser dedicado a referências externas
-- (NSU PIX/PayGo, códigos de gateway, IDs de sistemas legados).

ALTER TABLE public.contas_receber 
  ADD COLUMN IF NOT EXISTS venda_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL;

ALTER TABLE public.contas_pagar 
  ADD COLUMN IF NOT EXISTS venda_id uuid REFERENCES public.vendas(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_contas_receber_venda_id ON public.contas_receber(venda_id);
CREATE INDEX IF NOT EXISTS idx_contas_pagar_venda_id  ON public.contas_pagar(venda_id);

COMMENT ON COLUMN public.contas_receber.venda_id IS 'FK para vendas.id - vínculo padronizado com a venda de origem';
COMMENT ON COLUMN public.contas_receber.transaction_id IS 'Referência externa (NSU PIX/PayGo, ID de gateway, código legado). Não usar para vínculo com vendas.';
COMMENT ON COLUMN public.contas_pagar.venda_id IS 'FK para vendas.id - vínculo padronizado com a venda de origem';
COMMENT ON COLUMN public.contas_pagar.transaction_id IS 'Referência externa (NSU PIX/PayGo, ID de gateway, código legado). Não usar para vínculo com vendas.';
