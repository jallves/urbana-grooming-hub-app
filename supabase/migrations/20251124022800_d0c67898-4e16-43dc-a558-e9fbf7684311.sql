-- Corrigir políticas RLS para barbeiros atualizarem agendamentos

-- 1. Dropar política problemática
DROP POLICY IF EXISTS "barbers_can_update_own_scheduled_appointments" ON painel_agendamentos;

-- 2. Criar política corrigida para barbeiros atualizarem seus agendamentos
CREATE POLICY "Barbeiros podem atualizar seus agendamentos"
ON painel_agendamentos
FOR UPDATE
TO authenticated
USING (
  -- Verificar se o barbeiro é dono do agendamento via user_id
  barbeiro_id IN (
    SELECT pb.id
    FROM painel_barbeiros pb
    INNER JOIN staff s ON pb.staff_id = s.id
    WHERE s.user_id = auth.uid()
  )
)
WITH CHECK (
  -- Permitir atualizar para qualquer status válido
  status IN ('agendado', 'confirmado', 'concluido', 'ausente', 'cancelado')
  AND
  -- Garantir que continua sendo do mesmo barbeiro
  barbeiro_id IN (
    SELECT pb.id
    FROM painel_barbeiros pb
    INNER JOIN staff s ON pb.staff_id = s.id
    WHERE s.user_id = auth.uid()
  )
);

-- 3. Ativar REPLICA IDENTITY FULL para realtime completo
ALTER TABLE painel_agendamentos REPLICA IDENTITY FULL;

-- 4. Adicionar comentário explicativo
COMMENT ON POLICY "Barbeiros podem atualizar seus agendamentos" ON painel_agendamentos IS 
'Permite barbeiros atualizarem status dos seus próprios agendamentos (agendado→ausente, agendado→cancelado, etc.)';
