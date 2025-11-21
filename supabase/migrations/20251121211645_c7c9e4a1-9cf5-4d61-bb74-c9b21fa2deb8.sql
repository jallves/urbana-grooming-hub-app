
-- =====================================================
-- CORREÇÃO: Manager NÃO deve ter acesso ao ERP Financeiro
-- =====================================================

-- Remover políticas que permitem Manager ver dados financeiros
DROP POLICY IF EXISTS "Managers can view financial records" ON financial_records;
DROP POLICY IF EXISTS "Managers can view finance transactions" ON finance_transactions;
DROP POLICY IF EXISTS "Managers can view cash flow" ON cash_flow;

-- Confirmação: Agora apenas Master e Admin têm acesso ao ERP Financeiro
COMMENT ON TABLE financial_records IS 
'ERP Financeiro - Acesso restrito apenas para Master e Admin. Manager NÃO tem acesso.';

COMMENT ON TABLE finance_transactions IS 
'ERP Financeiro - Acesso restrito apenas para Master e Admin. Manager NÃO tem acesso.';

COMMENT ON TABLE cash_flow IS 
'ERP Financeiro - Acesso restrito apenas para Master e Admin. Manager NÃO tem acesso.';
