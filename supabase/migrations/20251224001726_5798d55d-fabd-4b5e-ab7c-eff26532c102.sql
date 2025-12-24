-- Remover a última política pública de painel_servicos
DROP POLICY IF EXISTS "Todos podem visualizar servicos ativos" ON public.painel_servicos;