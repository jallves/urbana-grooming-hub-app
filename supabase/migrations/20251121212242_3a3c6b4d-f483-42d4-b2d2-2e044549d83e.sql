
-- =====================================================
-- LIBERAÇÃO TOTAL DE DADOS PARA ROLES ADMINISTRATIVOS
-- =====================================================
-- Dashboard, Barbeiros e ERP Financeiro
-- =====================================================

-- =====================================================
-- PAINEL_BARBEIROS: Adicionar Manager e garantir acesso total
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage barbers" ON painel_barbeiros;
DROP POLICY IF EXISTS "Barbeiro lê seu registro ativo" ON painel_barbeiros;

-- Admin roles têm acesso total para gerenciar
CREATE POLICY "Admin roles can manage barbers"
ON painel_barbeiros FOR ALL
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

-- Barbeiros podem ver seus próprios dados
CREATE POLICY "Barbers can view own data"
ON painel_barbeiros FOR SELECT
TO authenticated
USING (
  email = auth.email() AND is_active = true
);

-- Público pode ver barbeiros ativos (para agendamento)
CREATE POLICY "Public can view active barbers"
ON painel_barbeiros FOR SELECT
TO public
USING (is_active = true);

-- =====================================================
-- COMISSÕES: Garantir acesso para Manager também
-- =====================================================

DROP POLICY IF EXISTS "Admin roles can view commissions" ON barber_commissions;
DROP POLICY IF EXISTS "Masters and admins can manage commissions" ON barber_commissions;

CREATE POLICY "Admin roles can view commissions"
ON barber_commissions FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'master'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'manager'::app_role) OR
  barber_id IN (
    SELECT id FROM staff WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Admin roles can manage commissions"
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

-- =====================================================
-- VENDAS E VENDAS_ITENS: Adicionar Manager
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage vendas" ON vendas;
DROP POLICY IF EXISTS "Public can create vendas" ON vendas;
DROP POLICY IF EXISTS "Public can view vendas" ON vendas;

CREATE POLICY "Admin roles can manage vendas"
ON vendas FOR ALL
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

CREATE POLICY "Public can create vendas"
ON vendas FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view vendas"
ON vendas FOR SELECT
TO public
USING (true);

DROP POLICY IF EXISTS "Masters and admins can manage vendas_itens" ON vendas_itens;
DROP POLICY IF EXISTS "Public can create vendas_itens" ON vendas_itens;
DROP POLICY IF EXISTS "Public can view vendas_itens" ON vendas_itens;

CREATE POLICY "Admin roles can manage vendas_itens"
ON vendas_itens FOR ALL
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

CREATE POLICY "Public can create vendas_itens"
ON vendas_itens FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view vendas_itens"
ON vendas_itens FOR SELECT
TO public
USING (true);

-- =====================================================
-- PAGAMENTOS: Adicionar Manager
-- =====================================================

DROP POLICY IF EXISTS "Masters and admins can manage pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Public can create pagamentos" ON pagamentos;
DROP POLICY IF EXISTS "Public can view pagamentos" ON pagamentos;

CREATE POLICY "Admin roles can manage pagamentos"
ON pagamentos FOR ALL
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

CREATE POLICY "Public can create pagamentos"
ON pagamentos FOR INSERT
TO public
WITH CHECK (true);

CREATE POLICY "Public can view pagamentos"
ON pagamentos FOR SELECT
TO public
USING (true);

-- =====================================================
-- CASH_REGISTER_SESSIONS: Adicionar Manager
-- =====================================================

DROP POLICY IF EXISTS "Admins can manage cash register sessions" ON cash_register_sessions;

CREATE POLICY "Admin roles can manage cash register sessions"
ON cash_register_sessions FOR ALL
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

-- =====================================================
-- COMENTÁRIOS PARA DOCUMENTAÇÃO
-- =====================================================

COMMENT ON POLICY "Admin roles can manage barbers" ON painel_barbeiros IS 
'Master, Admin e Manager podem gerenciar todos os barbeiros';

COMMENT ON POLICY "Admin roles can manage vendas" ON vendas IS 
'Master, Admin e Manager podem gerenciar todas as vendas';

COMMENT ON POLICY "Admin roles can manage commissions" ON barber_commissions IS 
'Master, Admin e Manager podem gerenciar todas as comissões';
