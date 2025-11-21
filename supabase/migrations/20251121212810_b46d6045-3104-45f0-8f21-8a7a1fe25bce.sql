
-- =====================================================
-- LIBERAR ACESSO AO ERP FINANCEIRO
-- =====================================================

-- Remover políticas antigas de financial_records
DROP POLICY IF EXISTS "Admin roles can manage financial records" ON financial_records;
DROP POLICY IF EXISTS "Masters and admins can manage financial records" ON financial_records;
DROP POLICY IF EXISTS "Admins can manage financial records" ON financial_records;
DROP POLICY IF EXISTS "Barbers can view own financial records" ON financial_records;
DROP POLICY IF EXISTS "Staff can view own financial records" ON financial_records;

-- Criar política única e clara para financial_records
CREATE POLICY "Admin roles have full access to financial_records"
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
CREATE POLICY "Barbers can view own records"
ON financial_records FOR SELECT
TO authenticated
USING (
  barber_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

-- =====================================================
-- VERIFICAR OUTRAS TABELAS DO ERP FINANCEIRO
-- =====================================================

-- Verificar payment_records
DROP POLICY IF EXISTS "Admin roles can manage payment records" ON payment_records;

CREATE POLICY "Admin roles have full access to payment_records"
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

COMMENT ON POLICY "Admin roles have full access to financial_records" ON financial_records IS 
'Master, Admin e Manager têm acesso total aos registros financeiros do ERP';

COMMENT ON POLICY "Barbers can view own records" ON financial_records IS 
'Barbeiros podem visualizar apenas seus próprios registros financeiros';

COMMENT ON POLICY "Admin roles have full access to payment_records" ON payment_records IS 
'Master, Admin e Manager têm acesso total aos registros de pagamento do ERP';
