-- Desabilitar temporariamente o trigger de proteção
ALTER TABLE painel_agendamentos DISABLE TRIGGER prevent_appointment_deletion_trigger;

-- Deletar samkcandido@gmail.com
DO $$
DECLARE
  cid UUID := '0e9c0413-02ae-4165-aa4b-4ef71f93d7c7';
  appointment_ids UUID[];
  financial_record_ids UUID[];
BEGIN
  SELECT ARRAY_AGG(id) INTO appointment_ids FROM painel_agendamentos WHERE cliente_id = cid;
  
  IF appointment_ids IS NOT NULL THEN
    SELECT ARRAY_AGG(id) INTO financial_record_ids FROM financial_records WHERE appointment_id = ANY(appointment_ids);
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
  
  DELETE FROM payment_records WHERE financial_record_id IN (SELECT id FROM financial_records WHERE client_id = cid);
  DELETE FROM painel_agendamentos WHERE cliente_id = cid;
  DELETE FROM financial_records WHERE client_id = cid;
  DELETE FROM client_profiles WHERE id = cid;
  
  RAISE NOTICE 'Cliente samkcandido@gmail.com deletado';
END $$;

-- Reabilitar trigger
ALTER TABLE painel_agendamentos ENABLE TRIGGER prevent_appointment_deletion_trigger;