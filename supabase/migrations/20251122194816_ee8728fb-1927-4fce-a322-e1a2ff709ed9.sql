-- Adicionar status "ausente" para agendamentos onde o cliente não compareceu
-- Este status não gera receita ou despesa para a barbearia

-- Primeiro, adicionar o novo status ao tipo enum se existir
-- Como o status é text, vamos apenas documentar os valores aceitos

-- Comentário para documentação dos status válidos:
-- 'agendado' - Agendamento inicial
-- 'confirmado' - Agendamento confirmado
-- 'concluido' - Atendimento realizado (gera receita/comissão)
-- 'cancelado' - Cancelado (não gera receita)
-- 'ausente' - Cliente faltou sem aviso (não gera receita/comissão)
-- 'FINALIZADO' - Status legado para compatibilidade

-- Criar índice para melhorar performance de queries por status
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_status 
ON painel_agendamentos(status);

-- Criar índice composto para queries de disponibilidade de barbeiro
CREATE INDEX IF NOT EXISTS idx_painel_agendamentos_barbeiro_data_hora 
ON painel_agendamentos(barbeiro_id, data, hora) 
WHERE status NOT IN ('cancelado', 'ausente');

-- Atualizar a trigger de comissão para não gerar comissão para status "ausente"
CREATE OR REPLACE FUNCTION calculate_financial_commission()
RETURNS TRIGGER AS $$
DECLARE
  staff_commission_rate NUMERIC;
  service_price NUMERIC;
  commission_amount NUMERIC;
  staff_user_id UUID;
BEGIN
  -- Só processa se o status mudou para 'concluido' (não 'ausente')
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    -- Buscar dados do barbeiro (staff)
    SELECT s.commission_rate, s.id
    INTO staff_commission_rate, staff_user_id
    FROM public.staff s
    INNER JOIN public.painel_barbeiros pb ON s.id = pb.staff_id
    WHERE pb.id = NEW.barbeiro_id;
    
    -- Buscar preço do serviço
    SELECT preco INTO service_price
    FROM public.painel_servicos 
    WHERE id = NEW.servico_id;
    
    -- Calcular comissão
    IF staff_commission_rate IS NOT NULL AND service_price IS NOT NULL THEN
      commission_amount := service_price * (staff_commission_rate / 100);
      
      -- Criar transação de receita (usando SECURITY DEFINER para bypass RLS)
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'receita', 'corte', 'Serviço realizado', service_price, NEW.data, NEW.id, 
        staff_user_id, 'pago'
      );
      
      -- Criar transação de despesa (comissão)
      INSERT INTO public.finance_transactions (
        tipo, categoria, descricao, valor, data, agendamento_id, barbeiro_id, status
      ) VALUES (
        'despesa', 'comissao', 'Comissão do barbeiro', commission_amount, NEW.data, NEW.id,
        staff_user_id, 'pago'
      );
      
      -- Criar registro de comissão
      INSERT INTO public.comissoes (
        agendamento_id, barbeiro_id, valor, percentual, data, status
      ) VALUES (
        NEW.id, 
        staff_user_id,
        commission_amount, staff_commission_rate, NEW.data, 'gerado'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar função para verificar disponibilidade de horário específico do barbeiro
-- Esta função será usada pelo frontend para validar horários na edição
CREATE OR REPLACE FUNCTION check_barber_slot_availability(
  p_barbeiro_id UUID,
  p_data DATE,
  p_hora TIME,
  p_duracao INTEGER,
  p_exclude_appointment_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  p_end_time TIME;
  v_has_conflict BOOLEAN;
BEGIN
  -- Calcular horário de término
  p_end_time := p_hora + (p_duracao || ' minutes')::INTERVAL;
  
  -- Verificar conflitos com outros agendamentos do mesmo barbeiro
  SELECT EXISTS(
    SELECT 1 FROM public.painel_agendamentos
    WHERE barbeiro_id = p_barbeiro_id
    AND data = p_data
    AND status NOT IN ('cancelado', 'ausente')
    AND (p_exclude_appointment_id IS NULL OR id != p_exclude_appointment_id)
    AND (
      -- Verifica sobreposição de horários
      (hora <= p_hora AND (hora + (
        SELECT duracao FROM painel_servicos WHERE id = servico_id
      ) * INTERVAL '1 minute') > p_hora)
      OR (hora < p_end_time AND hora >= p_hora)
    )
  ) INTO v_has_conflict;
  
  RETURN NOT v_has_conflict;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar RLS policy para permitir barbeiros editarem seus próprios agendamentos
-- Apenas agendamentos com status 'agendado' ou 'confirmado' podem ser editados
CREATE POLICY "barbers_can_update_own_scheduled_appointments"
ON painel_agendamentos
FOR UPDATE
USING (
  barbeiro_id IN (
    SELECT pb.id 
    FROM painel_barbeiros pb
    INNER JOIN staff s ON pb.staff_id = s.id
    WHERE s.email = auth.jwt() ->> 'email'
  )
  AND status IN ('agendado', 'confirmado')
)
WITH CHECK (
  barbeiro_id IN (
    SELECT pb.id 
    FROM painel_barbeiros pb
    INNER JOIN staff s ON pb.staff_id = s.id
    WHERE s.email = auth.jwt() ->> 'email'
  )
  AND status IN ('agendado', 'confirmado', 'ausente', 'cancelado', 'concluido')
);

-- Garantir que barbeiros NÃO podem deletar agendamentos
DROP POLICY IF EXISTS "barbers_cannot_delete_appointments" ON painel_agendamentos;
CREATE POLICY "barbers_cannot_delete_appointments"
ON painel_agendamentos
FOR DELETE
USING (false);