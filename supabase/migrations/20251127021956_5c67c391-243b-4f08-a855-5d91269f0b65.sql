-- ========================================
-- RECRIAÇÃO DAS TRIGGERS DE PROTEÇÃO
-- ========================================
-- Esta migration recria as triggers e funções de proteção
-- que foram removidas temporariamente para permitir limpeza de dados

-- ========================================
-- FUNÇÃO: Prevenir deleção de agendamentos críticos
-- ========================================
-- Regras de proteção:
-- 1. Não pode deletar agendamentos concluídos
-- 2. Não pode deletar agendamentos com registros financeiros
-- 3. Pode deletar agendamentos cancelados, ausentes ou pendentes sem pagamento
-- ========================================

CREATE OR REPLACE FUNCTION prevent_appointment_deletion()
RETURNS TRIGGER AS $$
DECLARE
  has_financial_records BOOLEAN;
  appointment_status TEXT;
BEGIN
  -- Buscar status do agendamento
  SELECT status INTO appointment_status
  FROM painel_agendamentos
  WHERE id = OLD.id;
  
  -- Verificar se existem registros financeiros relacionados
  SELECT EXISTS (
    SELECT 1 FROM financial_records 
    WHERE appointment_id = OLD.id
    UNION ALL
    SELECT 1 FROM finance_transactions 
    WHERE agendamento_id = OLD.id
    UNION ALL
    SELECT 1 FROM comissoes 
    WHERE agendamento_id = OLD.id
    UNION ALL
    SELECT 1 FROM vendas 
    WHERE agendamento_id = OLD.id
  ) INTO has_financial_records;
  
  -- REGRA 1: Impedir deleção de agendamentos concluídos
  IF appointment_status = 'concluido' THEN
    RAISE EXCEPTION 'Não é possível deletar agendamento concluído (ID: %). Status: %', 
      OLD.id, appointment_status
      USING HINT = 'Agendamentos concluídos só podem ser cancelados, não deletados.',
            ERRCODE = 'P0001';
  END IF;
  
  -- REGRA 2: Impedir deleção se existem registros financeiros
  IF has_financial_records THEN
    RAISE EXCEPTION 'Não é possível deletar agendamento com registros financeiros (ID: %)', 
      OLD.id
      USING HINT = 'Este agendamento possui registros financeiros. Delete primeiro os registros financeiros ou cancele o agendamento.',
            ERRCODE = 'P0002';
  END IF;
  
  -- REGRA 3: Permitir deleção de agendamentos sem problemas
  -- Status permitidos: 'cancelado', 'ausente', 'agendado', 'confirmado'
  -- E sem registros financeiros
  RAISE NOTICE 'Deletando agendamento % com status %', OLD.id, appointment_status;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- TRIGGER: Aplicar proteção antes de deletar
-- ========================================
CREATE TRIGGER prevent_appointment_deletion_trigger
  BEFORE DELETE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION prevent_appointment_deletion();

-- ========================================
-- COMENTÁRIOS E DOCUMENTAÇÃO
-- ========================================
COMMENT ON FUNCTION prevent_appointment_deletion() IS 
  'Função de proteção que impede deleção de agendamentos críticos. 
   Regras: (1) Não deleta agendamentos concluídos, (2) Não deleta se há registros financeiros, 
   (3) Permite deleção de cancelados/ausentes/pendentes sem financeiro.';

COMMENT ON TRIGGER prevent_appointment_deletion_trigger ON painel_agendamentos IS
  'Trigger que executa validações antes de deletar um agendamento, 
   protegendo dados críticos e mantendo integridade financeira.';

-- ========================================
-- LOGS E AUDITORIA
-- ========================================
-- Criar função de auditoria para deletar agendamentos (se não existir)
CREATE OR REPLACE FUNCTION audit_appointment_deletion()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO barber_audit_log (
    action,
    description,
    performed_by
  ) VALUES (
    'appointment_deleted',
    format('Agendamento deletado - ID: %s, Cliente: %s, Status: %s', 
      OLD.id, OLD.cliente_id, OLD.status),
    auth.uid()
  );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de auditoria (depois da proteção)
DROP TRIGGER IF EXISTS audit_appointment_deletion_trigger ON painel_agendamentos;
CREATE TRIGGER audit_appointment_deletion_trigger
  AFTER DELETE ON painel_agendamentos
  FOR EACH ROW
  EXECUTE FUNCTION audit_appointment_deletion();

-- ========================================
-- MENSAGEM DE CONFIRMAÇÃO
-- ========================================
DO $$
BEGIN
  RAISE NOTICE '✅ Triggers de proteção recriadas com sucesso!';
  RAISE NOTICE '🔒 Proteções aplicadas:';
  RAISE NOTICE '   - Agendamentos concluídos não podem ser deletados';
  RAISE NOTICE '   - Agendamentos com registros financeiros não podem ser deletados';
  RAISE NOTICE '   - Agendamentos cancelados/ausentes/pendentes podem ser deletados';
  RAISE NOTICE '📋 Sistema de auditoria ativo para deletar agendamentos';
END $$;