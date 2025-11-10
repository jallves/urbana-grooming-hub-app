-- Corrigir função que cria registros financeiros
-- Comissões devem ser criadas como 'pending' e não 'completed'
CREATE OR REPLACE FUNCTION public.create_financial_records_on_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_service_price NUMERIC;
  v_staff_id UUID;
  v_commission_rate NUMERIC;
  v_commission_amount NUMERIC;
  v_transaction_number TEXT;
  v_financial_record_id UUID;
BEGIN
  -- Só processa se o status mudou para 'concluido'
  IF NEW.status = 'concluido' AND (OLD.status IS NULL OR OLD.status != 'concluido') THEN
    
    -- Buscar preço do serviço e dados do barbeiro
    SELECT 
      ps.preco,
      pb.staff_id,
      s.commission_rate
    INTO 
      v_service_price,
      v_staff_id,
      v_commission_rate
    FROM painel_servicos ps
    JOIN painel_barbeiros pb ON pb.id = NEW.barbeiro_id
    LEFT JOIN staff s ON s.id = pb.staff_id
    WHERE ps.id = NEW.servico_id;
    
    -- Gerar número de transação único
    v_transaction_number := 'TRX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                           LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0');
    
    -- Criar registro de receita em financial_records (sempre COMPLETED)
    INSERT INTO financial_records (
      transaction_number,
      transaction_type,
      category,
      subcategory,
      gross_amount,
      discount_amount,
      tax_amount,
      net_amount,
      status,
      description,
      transaction_date,
      completed_at,
      appointment_id,
      client_id,
      barber_id,
      metadata,
      created_at,
      updated_at
    ) VALUES (
      v_transaction_number,
      'revenue',
      'services',
      'haircut',
      v_service_price,
      0,
      0,
      v_service_price,
      'completed',  -- Receitas sempre completadas
      'Serviço realizado - Agendamento concluído',
      NEW.data,
      NOW(),
      NEW.id,
      NEW.cliente_id,
      v_staff_id,
      jsonb_build_object(
        'service_id', NEW.servico_id,
        'barber_id', NEW.barbeiro_id,
        'appointment_date', NEW.data,
        'appointment_time', NEW.hora
      ),
      NOW(),
      NOW()
    ) RETURNING id INTO v_financial_record_id;
    
    -- Calcular e criar comissão do barbeiro (se houver taxa configurada)
    IF v_commission_rate IS NOT NULL AND v_commission_rate > 0 AND v_staff_id IS NOT NULL THEN
      v_commission_amount := v_service_price * (v_commission_rate / 100);
      
      -- Criar registro de comissão em barber_commissions
      INSERT INTO barber_commissions (
        appointment_id,
        barber_id,
        amount,
        commission_rate,
        status,
        appointment_source,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        v_staff_id,
        v_commission_amount,
        v_commission_rate,
        'pending',  -- Comissões sempre começam pendentes
        'painel',
        NOW(),
        NOW()
      );
      
      -- Criar registro de despesa (comissão) em financial_records com status PENDING
      INSERT INTO financial_records (
        transaction_number,
        transaction_type,
        category,
        subcategory,
        gross_amount,
        discount_amount,
        tax_amount,
        net_amount,
        status,
        description,
        transaction_date,
        appointment_id,
        barber_id,
        metadata,
        created_at,
        updated_at
      ) VALUES (
        'COM-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'),
        'commission',
        'staff_payments',
        'commission',
        v_commission_amount,
        0,
        0,
        v_commission_amount,
        'pending',  -- Comissões sempre PENDING, admin marca como pago
        'Comissão do barbeiro - ' || v_commission_rate || '%',
        NEW.data,
        NEW.id,
        v_staff_id,
        jsonb_build_object(
          'commission_rate', v_commission_rate,
          'revenue_record_id', v_financial_record_id,
          'service_price', v_service_price
        ),
        NOW(),
        NOW()
      );
    END IF;
    
    RAISE NOTICE 'Registros financeiros criados para agendamento %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;