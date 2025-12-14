-- Desabilitar temporariamente o trigger que protege deleção de agendamentos
ALTER TABLE painel_agendamentos DISABLE TRIGGER prevent_appointment_deletion_trigger;

-- Deletar clientes de teste e todos os registros relacionados
DO $$
DECLARE
  client_ids UUID[] := ARRAY[
    '4eb28070-a4be-433d-ba88-0e2db4381fda',
    '5b311894-5af4-498f-b609-ed2c3b645a1d',
    '28d1dd29-ea73-4f47-a671-07805dc9a2c7',
    'a09625d5-0b99-48ab-bc92-88072d5ded28',
    '7fa228dc-7b06-4d4b-8d4c-c86f98fa0968',
    '94dac6fc-ad9b-41ea-969c-680bb62bba97',
    'f313c4a6-6d75-4f92-acaa-61409d4b893c',
    '656932ec-63ca-4f77-b9e4-3f0b62c603a0',
    'bcfd5e53-f5a9-4b8d-b6b4-25d8ac36e678',
    '0d771c0f-4722-43cf-9986-a0772220cfda'
  ]::UUID[];
  cid UUID;
  appointment_ids UUID[];
BEGIN
  FOREACH cid IN ARRAY client_ids LOOP
    -- Buscar agendamentos do cliente
    SELECT ARRAY_AGG(id) INTO appointment_ids
    FROM painel_agendamentos
    WHERE cliente_id = cid;
    
    IF appointment_ids IS NOT NULL THEN
      -- Deletar comissões relacionadas
      DELETE FROM comissoes WHERE agendamento_id = ANY(appointment_ids);
      
      -- Deletar transações financeiras relacionadas
      DELETE FROM finance_transactions WHERE agendamento_id = ANY(appointment_ids);
      
      -- Deletar registros financeiros relacionados
      DELETE FROM financial_records WHERE appointment_id = ANY(appointment_ids);
      
      -- Deletar notification_logs relacionados
      DELETE FROM notification_logs WHERE appointment_id = ANY(appointment_ids);
      
      -- Deletar appointment_ratings relacionados
      DELETE FROM appointment_ratings WHERE appointment_id = ANY(appointment_ids);
      
      -- Deletar appointment_extra_services relacionados
      DELETE FROM appointment_extra_services WHERE appointment_id = ANY(appointment_ids);
      
      -- Deletar vendas_itens relacionados às vendas
      DELETE FROM vendas_itens WHERE venda_id IN (
        SELECT id FROM vendas WHERE agendamento_id = ANY(appointment_ids)
      );
      
      -- Deletar pagamentos relacionados às vendas
      DELETE FROM pagamentos WHERE venda_id IN (
        SELECT id FROM vendas WHERE agendamento_id = ANY(appointment_ids)
      );
      
      -- Deletar vendas relacionadas
      DELETE FROM vendas WHERE agendamento_id = ANY(appointment_ids);
      
      -- Deletar barber_commissions relacionados
      DELETE FROM barber_commissions WHERE appointment_id = ANY(appointment_ids);
    END IF;
    
    -- Deletar agendamentos do cliente
    DELETE FROM painel_agendamentos WHERE cliente_id = cid;
    
    -- Deletar financial_records que referenciam o cliente diretamente
    DELETE FROM financial_records WHERE client_id = cid;
    
    -- Deletar o cliente
    DELETE FROM client_profiles WHERE id = cid;
    
    RAISE NOTICE 'Cliente % deletado com sucesso', cid;
  END LOOP;
END $$;

-- Reabilitar o trigger de proteção
ALTER TABLE painel_agendamentos ENABLE TRIGGER prevent_appointment_deletion_trigger;