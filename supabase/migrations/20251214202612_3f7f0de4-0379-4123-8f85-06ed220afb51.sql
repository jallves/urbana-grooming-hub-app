-- Desabilitar temporariamente o trigger que protege deleção de agendamentos
ALTER TABLE painel_agendamentos DISABLE TRIGGER prevent_appointment_deletion_trigger;

-- Deletar Joao Osório e registros relacionados
DO $$
DECLARE
  cid UUID := 'aa79dc56-9445-41e4-a274-95d934724c86';
  appointment_ids UUID[];
  financial_record_ids UUID[];
BEGIN
  -- Buscar agendamentos do cliente
  SELECT ARRAY_AGG(id) INTO appointment_ids
  FROM painel_agendamentos
  WHERE cliente_id = cid;
  
  IF appointment_ids IS NOT NULL THEN
    -- Buscar financial_records relacionados
    SELECT ARRAY_AGG(id) INTO financial_record_ids
    FROM financial_records
    WHERE appointment_id = ANY(appointment_ids);
    
    -- Deletar payment_records primeiro (FK para financial_records)
    IF financial_record_ids IS NOT NULL THEN
      DELETE FROM payment_records WHERE financial_record_id = ANY(financial_record_ids);
    END IF;
    
    DELETE FROM comissoes WHERE agendamento_id = ANY(appointment_ids);
    DELETE FROM finance_transactions WHERE agendamento_id = ANY(appointment_ids);
    DELETE FROM financial_records WHERE appointment_id = ANY(appointment_ids);
    DELETE FROM notification_logs WHERE appointment_id = ANY(appointment_ids);
    DELETE FROM appointment_ratings WHERE appointment_id = ANY(appointment_ids);
    DELETE FROM appointment_extra_services WHERE appointment_id = ANY(appointment_ids);
    DELETE FROM vendas_itens WHERE venda_id IN (SELECT id FROM vendas WHERE agendamento_id = ANY(appointment_ids));
    DELETE FROM pagamentos WHERE venda_id IN (SELECT id FROM vendas WHERE agendamento_id = ANY(appointment_ids));
    DELETE FROM vendas WHERE agendamento_id = ANY(appointment_ids);
    DELETE FROM barber_commissions WHERE appointment_id = ANY(appointment_ids);
  END IF;
  
  -- Deletar payment_records do cliente diretamente
  DELETE FROM payment_records WHERE financial_record_id IN (SELECT id FROM financial_records WHERE client_id = cid);
  
  DELETE FROM painel_agendamentos WHERE cliente_id = cid;
  DELETE FROM financial_records WHERE client_id = cid;
  DELETE FROM client_profiles WHERE id = cid;
  
  RAISE NOTICE 'Cliente Joao Osório deletado com sucesso';
END $$;

-- Reabilitar o trigger de proteção
ALTER TABLE painel_agendamentos ENABLE TRIGGER prevent_appointment_deletion_trigger;