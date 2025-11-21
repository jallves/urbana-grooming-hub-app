
-- =====================================================
-- CORRIGIR RLS DO ERP FINANCEIRO - PAYMENT_RECORDS
-- =====================================================

-- 1. Habilitar RLS em payment_records (se não estiver habilitado)
ALTER TABLE payment_records ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas de payment_records
DROP POLICY IF EXISTS "Admin roles can manage payment records" ON payment_records;
DROP POLICY IF EXISTS "Admin roles have full access to payment_records" ON payment_records;
DROP POLICY IF EXISTS "Masters and admins can manage payment records" ON payment_records;
DROP POLICY IF EXISTS "Admins can manage payment records" ON payment_records;

-- 3. Criar política simples e eficaz para payment_records
CREATE POLICY "Admin roles full access to payment_records"
ON payment_records FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- 4. Adicionar política pública de leitura para payment_records (necessária para JOINs no frontend)
CREATE POLICY "Public can view payment_records"
ON payment_records FOR SELECT
TO public
USING (true);

-- =====================================================
-- GARANTIR RLS CORRETO EM FINANCIAL_RECORDS
-- =====================================================

-- Verificar se financial_records tem RLS habilitado
ALTER TABLE financial_records ENABLE ROW LEVEL SECURITY;

-- Remover políticas duplicadas
DROP POLICY IF EXISTS "Admin roles can manage financial records" ON financial_records;
DROP POLICY IF EXISTS "Admin roles have full access to financial_records" ON financial_records;
DROP POLICY IF EXISTS "Masters and admins can manage financial records" ON financial_records;

-- Criar política clara para financial_records
CREATE POLICY "Admins full access to financial_records"
ON financial_records FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Barbeiros podem ver seus próprios registros
DROP POLICY IF EXISTS "Barbers can view own records" ON financial_records;
CREATE POLICY "Barbers view own financial_records"
ON financial_records FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

-- Política pública de leitura (necessária para joins e queries não autenticadas)
DROP POLICY IF EXISTS "Public can view financial_records" ON financial_records;
CREATE POLICY "Public view financial_records"
ON financial_records FOR SELECT
TO public
USING (true);

-- =====================================================
-- GARANTIR RLS CORRETO EM BARBER_COMMISSIONS
-- =====================================================

ALTER TABLE barber_commissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin roles can manage commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Admin roles can view commissions" ON barber_commissions;

-- Admin full access
CREATE POLICY "Admins full access to commissions"
ON barber_commissions FOR ALL
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role)
);

-- Barbers can view own commissions
DROP POLICY IF EXISTS "Barbers can view own commissions" ON barber_commissions;
CREATE POLICY "Barbers view own commissions"
ON barber_commissions FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

-- Public read access
DROP POLICY IF EXISTS "Public can view commissions" ON barber_commissions;
CREATE POLICY "Public view commissions"
ON barber_commissions FOR SELECT
TO public
USING (true);

COMMENT ON POLICY "Admin roles full access to payment_records" ON payment_records IS 
'Master, Admin e Manager têm acesso total aos registros de pagamento';

COMMENT ON POLICY "Public can view payment_records" ON payment_records IS 
'Acesso público de leitura necessário para JOINs no frontend';

COMMENT ON POLICY "Admins full access to financial_records" ON financial_records IS 
'Master, Admin e Manager têm acesso total aos registros financeiros';

COMMENT ON POLICY "Public view financial_records" ON financial_records IS 
'Acesso público de leitura necessário para queries no frontend';
